// 教材导入器：把 dl_list.txt + books/ 实际文件 + books_toc/ + content.js 课时 写入数据库
// 用法：
//   node --no-warnings seed.js           增量导入（幂等）
//   node --no-warnings seed.js --reset   清空教材数据后重建（不动 progress/bookmark）
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, db, all, get, run, tx, logEvent } from './db.js';
import { parsePath, normalizePath, isDuplicateCopy, SUBJECT_COLOR } from './lib/parse.js';

const RESET = process.argv.includes('--reset');

const LIST_FILE = join(ROOT, 'dl_list.txt');
const BOOKS_DIR = join(ROOT, 'books');
const TOC_DIR = join(ROOT, 'books_toc');

/* ---------- 1. 读取清单并去重 ---------- */
const lines = readFileSync(LIST_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
const entries = lines.map(l => {
  const [p, size] = l.split('\t');
  return { path: p.trim(), size: Number(size) || 0 };
});

const byNorm = new Map();   // normPath -> { info, copies, size }
for (const e of entries) {
  const info = parsePath(e.path);
  const key = info.normPath;
  if (!byNorm.has(key)) byNorm.set(key, { info, copies: 0, size: e.size });
  if (isDuplicateCopy(e.path)) byNorm.get(key).copies++;
}

console.log(`清单 ${entries.length} 条 → 去重后 ${byNorm.size} 本（合并副本 ${entries.length - byNorm.size} 条）`);

/* ---------- 2. 重置 ---------- */
if (RESET) {
  tx(() => {
    db.exec('DELETE FROM lesson; DELETE FROM section; DELETE FROM chapter;');
    db.exec('DELETE FROM textbook;');
  });
  console.log('已清空教材/目录/课时表');
}

/* ---------- 3. 导入 textbook ---------- */
const codeToId = new Map();
let added = 0, updated = 0, downloaded = 0;

tx(() => {
  for (const { info, copies, size } of byNorm.values()) {
    const abs = join(ROOT, info.pdfPath);
    const exists = existsSync(abs);
    const realSize = exists ? statSync(abs).size : 0;
    const spine = SUBJECT_COLOR[info.subject] || '#6b6558';
    const status = exists ? 'downloaded' : 'pending';

    const prev = get('SELECT id, status FROM textbook WHERE code = ?', info.code);
    if (prev) {
      run(`UPDATE textbook SET title=?, short_title=?, stage=?, grade=?, subject=?, publisher=?,
             edition=?, volume=?, volume_kind=?, module_group=?, sort_key=?, pdf_path=?, pdf_size=?,
             spine_color=?, updated_at=datetime('now','localtime')
           WHERE id=?`,
        info.title, info.shortTitle, info.stage, info.grade, info.subject, info.publisher,
        info.edition || null, info.volume || null, info.volumeKind, info.moduleGroup,
        info.sortKey, info.pdfPath, realSize, spine, prev.id);
      codeToId.set(info.code, prev.id);
      updated++;
    } else {
      const r = run(`INSERT INTO textbook
          (code, title, short_title, stage, grade, subject, publisher, edition, volume,
           volume_kind, module_group, sort_key, pdf_path, pdf_size, status, spine_color)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        info.code, info.title, info.shortTitle, info.stage, info.grade, info.subject,
        info.publisher, info.edition || null, info.volume || null, info.volumeKind,
        info.moduleGroup, info.sortKey, info.pdfPath, realSize, status, spine);
      codeToId.set(info.code, Number(r.lastInsertRowid));
      added++;
      logEvent(Number(r.lastInsertRowid), 'import', `来自清单，副本 ${copies} 个`);
    }
    if (exists) downloaded++;
  }
});
console.log(`教材：新增 ${added} 本，更新 ${updated} 本，磁盘上实有 ${downloaded} 本`);

/* ---------- 4. 导入目录（books_toc/*.toc.json） ---------- */
// 文件名形如「物理八下.toc.json」，用学科+年级+册次匹配 textbook
const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

function matchTextbookByTocName(name) {
  const m = name.match(/^(.+?)([一二三四五六七八九])?(上|下|全)/);
  if (!m) return null;
  const subject = m[1];
  const grade = m[2] ? CN[m[2]] : null;
  const volChar = m[3];
  const rows = all(`SELECT * FROM textbook WHERE subject = ? ${grade ? 'AND grade = ?' : ''}`,
    ...(grade ? [subject, grade] : [subject]));
  if (!rows.length) return null;
  const want = volChar === '上' ? '上册' : volChar === '下' ? '下册' : '全一册';
  return rows.find(r => (r.volume || '').includes(want)) || rows[0];
}

let tocCount = 0, sectionCount = 0;
if (existsSync(TOC_DIR)) {
  for (const f of readdirSync(TOC_DIR).filter(n => n.endsWith('.toc.json'))) {
    const base = f.replace('.toc.json', '');
    const tb = matchTextbookByTocName(base);
    if (!tb) { console.log(`  ! 目录 ${f} 未匹配到教材，跳过`); continue; }

    const chapters = JSON.parse(readFileSync(join(TOC_DIR, f), 'utf8'));

    tx(() => {
      db.exec(`DELETE FROM section WHERE textbook_id = ${tb.id}`);
      db.exec(`DELETE FROM chapter WHERE textbook_id = ${tb.id}`);
      let ci = 0, si = 0;
      for (const ch of chapters) {
        const cr = run('INSERT INTO chapter(textbook_id, no, title, page, sort_key) VALUES(?,?,?,?,?)',
          tb.id, ci + 1, ch.label || '', ch.page ?? null, ci++);
        const chId = Number(cr.lastInsertRowid);
        for (const sec of (ch.children || [])) {
          // 节标题：「1 节　力」→ no=1, title=力
          const sm = (sec.label || '').match(/^(\d+)\s*节\s*(.+)?$/);
          run('INSERT INTO section(chapter_id, textbook_id, no, title, page, sort_key) VALUES(?,?,?,?,?,?)',
            chId, tb.id, sm ? Number(sm[1]) : null, sm ? (sm[2] || '').trim() : (sec.label || ''),
            sec.page ?? null, si++);
          sectionCount++;
        }
        tocCount++;
      }
      run("UPDATE textbook SET status = CASE WHEN status='ready' THEN status ELSE 'indexed' END WHERE id = ?", tb.id);
      logEvent(tb.id, 'toc', `${chapters.length} 章`);
    });
    console.log(`  目录导入：${base} → ${tb.short_title}（${chapters.length} 章）`);
  }
}

/* ---------- 5. 导入课时（content.js + bindings.js） ---------- */
const { lessons } = await import('../js/content.js');
const { SPREADS, BOOKS } = await import('../js/bindings.js');

const metaById = new Map(lessons.map(l => [l.id, l]));

// 目标教材：SPREADS 目前只属于物理八年级下册
const target = get("SELECT * FROM textbook WHERE subject='物理' AND grade=8 AND volume LIKE '%下%'");
if (!target) {
  console.log('! 未找到物理八年级下册，跳过课时导入');
} else {
  tx(() => {
    db.exec(`DELETE FROM lesson WHERE textbook_id = ${target.id}`);
    let i = 0;
    for (const sp of SPREADS) {
      const meta = metaById.get(sp.lesson);
      if (!meta) { console.log(`  ! 课时 ${sp.lesson} 在 content.js 中不存在，跳过`); continue; }
      const level = /想想做做|演示|科学世界/.test(sp.tag || '') ? 'B' : 'A';
      run(`INSERT INTO lesson
            (textbook_id, scene_key, title, tag, right_page, anchor_u, anchor_v, hover, level, status, sort_key)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        target.id, sp.lesson, meta.title || sp.lesson, sp.tag || '', sp.right ?? null,
        sp.anchor?.[0] ?? 0.5, sp.anchor?.[1] ?? 0.6, sp.hover ?? 0.85,
        level, 'ready', i++);
    }
    run("UPDATE textbook SET status='ready' WHERE id=?", target.id);
    logEvent(target.id, 'lesson', `${SPREADS.length} 个 3D 课时`);
  });
  console.log(`课时导入：${SPREADS.length} 个 → ${target.short_title}`);
}

/* ---------- 6. 汇总 ---------- */
const stat = get(`SELECT
    COUNT(*) total,
    SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS n_pending,
    SUM(CASE WHEN status IN ('downloaded','indexed','ready') THEN 1 ELSE 0 END) AS n_shelf,
    SUM(CASE WHEN status='indexed' THEN 1 ELSE 0 END) AS n_indexed,
    SUM(CASE WHEN status='ready' THEN 1 ELSE 0 END) AS n_ready
  FROM textbook`);

const shelf = all(`SELECT stage, COUNT(*) n,
    SUM(CASE WHEN status IN ('downloaded','indexed','ready') THEN 1 ELSE 0 END) has
  FROM textbook GROUP BY stage ORDER BY
    CASE stage WHEN '小学' THEN 1 WHEN '初中' THEN 2 ELSE 3 END`);

console.log('\n=== 书架总览 ===');
for (const s of shelf) console.log(`  ${s.stage}：${s.n} 本（已上架 ${s.has}）`);
console.log(`  合计 ${stat.total} 本 | 待下载 ${stat.n_pending ?? 0} | 已上架 ${stat.n_shelf ?? 0}（其中 ${stat.n_ready ?? 0} 本有 3D）`);
console.log(`  章 ${tocCount} 节 ${sectionCount} 课时 ${get('SELECT COUNT(*) c FROM lesson').c}`);
console.log(`  数据库：${join(ROOT, 'data', 'lab.db')}`);
