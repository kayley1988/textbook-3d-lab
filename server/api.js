// 纸上实验 · 本地服务
// 职责：静态文件（含 PDF Range 流式）+ 书架 REST API
// 零依赖：只用 Node 内置模块 + node:sqlite
// 用法：node --no-warnings api.js [端口]
import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { ROOT, all, get, run } from './db.js';

const PORT = Number(process.argv[2] || 8200);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
};

function json(res, data, code = 200) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS });
  res.end(body);
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 5e6) req.destroy(); });
    req.on('end', () => { try { ok(buf ? JSON.parse(buf) : {}); } catch (e) { fail(e); } });
    req.on('error', fail);
  });
}

/* ================= 书架数据 ================= */

const STAGE_GRADES = { 小学: [1, 2, 3, 4, 5, 6], 初中: [7, 8, 9], 高中: [10, 11, 12] };
const STAGE_LABEL = { 10: '高一', 11: '高二', 12: '高三' };

function gradeLabel(stage, g) {
  if (stage === '高中') return STAGE_LABEL[g] || `${g}年级`;
  const cn = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return `${cn[g] || g}年级`;
}

/** 书架树：学段 → 年级 → 学科（含册数/已上架数/3D课数） */
function apiShelf() {
  const rows = all(`SELECT stage, grade, subject,
      COUNT(*) AS total,
      SUM(CASE WHEN status IN ('downloaded','indexed','ready') THEN 1 ELSE 0 END) AS on_shelf,
      SUM(CASE WHEN status='ready' THEN 1 ELSE 0 END) AS with_3d
    FROM textbook GROUP BY stage, grade, subject`);

  const stages = [];
  for (const stage of ['小学', '初中', '高中']) {
    const grades = [];
    for (const g of STAGE_GRADES[stage]) {
      const subs = rows.filter(r => r.stage === stage && r.grade === g)
        .sort((a, b) => b.total - a.total);
      if (!subs.length) continue;
      grades.push({
        grade: g, label: gradeLabel(stage, g),
        subjects: subs.map(s => ({
          subject: s.subject, total: s.total,
          onShelf: s.on_shelf || 0, with3d: s.with_3d || 0,
        })),
      });
    }
    // 高中模块制没有严格年级归属，把 grade 为空的也挂进来
    const loose = rows.filter(r => r.stage === stage && !r.grade);
    if (stage === '高中' && loose.length) {
      const agg = {};
      for (const r of loose) {
        agg[r.subject] = agg[r.subject] || { subject: r.subject, total: 0, onShelf: 0, with3d: 0 };
        agg[r.subject].total += r.total;
        agg[r.subject].onShelf += r.on_shelf || 0;
        agg[r.subject].with3d += r.with_3d || 0;
      }
      grades.push({ grade: 0, label: '不分年级', subjects: Object.values(agg) });
    }
    if (grades.length) stages.push({ stage, grades });
  }

  const stat = get(`SELECT COUNT(*) total,
      SUM(CASE WHEN status IN ('downloaded','indexed','ready') THEN 1 ELSE 0 END) on_shelf,
      SUM(CASE WHEN status='ready' THEN 1 ELSE 0 END) with_3d
    FROM textbook`);

  return { stages, stats: { total: stat.total, onShelf: stat.on_shelf || 0, with3d: stat.with_3d || 0 } };
}

/** 某年级某学科的册次列表 */
function apiTextbooks(q) {
  const where = [], args = [];
  if (q.stage) { where.push('stage = ?'); args.push(q.stage); }
  if (q.subject) { where.push('subject = ?'); args.push(q.subject); }
  if (q.grade) { where.push('grade = ?'); args.push(Number(q.grade)); }
  const sql = `SELECT id, code, title, short_title, stage, grade, subject, publisher, edition,
      volume, volume_kind, module_group, page_count, status, spine_color, pdf_size
    FROM textbook ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY sort_key, id`;
  const rows = all(sql, ...args);
  return rows.map(r => ({
    ...r,
    statusLabel: { pending: '待上架', downloaded: '已上架', indexed: '已建目录', ready: '有 3D' }[r.status] || r.status,
  }));
}

/** 单本教材详情：章节树 + 课时 */
function apiTextbook(id) {
  const book = get('SELECT * FROM textbook WHERE id = ?', Number(id));
  if (!book) return null;
  const chapters = all('SELECT * FROM chapter WHERE textbook_id = ? ORDER BY sort_key, id', book.id);
  const sections = all('SELECT * FROM section WHERE textbook_id = ? ORDER BY sort_key, id', book.id);
  const lessons = all('SELECT * FROM lesson WHERE textbook_id = ? ORDER BY sort_key, id', book.id);
  const progress = get('SELECT * FROM progress WHERE textbook_id = ?', book.id);

  return {
    book,
    chapters: chapters.map(c => ({
      ...c,
      children: sections.filter(s => s.chapter_id === c.id)
        .map(s => ({
          ...s,
          lessons: lessons.filter(l => l.section_id === s.id || l.right_page === s.page),
        })),
    })),
    lessons,
    progress: progress || null,
  };
}

/* ================= 路由 ================= */

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  const path = decodeURIComponent(u.pathname);

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  try {
    /* ---------- API ---------- */
    if (path.startsWith('/api/')) {
      const seg = path.split('/').filter(Boolean);   // ['api', ...]

      if (path === '/api/shelf') return json(res, apiShelf());

      if (path === '/api/textbooks') return json(res, apiTextbooks(Object.fromEntries(u.searchParams)));

      if (seg[1] === 'textbook' && seg[2]) {
        const data = apiTextbook(seg[2]);
        return data ? json(res, data) : json(res, { error: '教材不存在' }, 404);
      }

      if (seg[1] === 'lesson' && seg[2]) {
        const l = get('SELECT * FROM lesson WHERE id = ?', Number(seg[2]));
        return l ? json(res, l) : json(res, { error: '课时不存在' }, 404);
      }

      // PDF 流式（支持 Range，pdf.js 按页取数据，不必下载整本）
      if (seg[1] === 'pdf' && seg[2]) {
        const book = get('SELECT pdf_path FROM textbook WHERE id = ?', Number(seg[2]));
        if (!book?.pdf_path) return json(res, { error: '该教材尚未上架' }, 404);
        const abs = resolve(ROOT, book.pdf_path);
        if (!abs.startsWith(ROOT + sep) || !existsSync(abs)) return json(res, { error: '文件不存在' }, 404);

        const size = statSync(abs).size;
        const range = req.headers.range;
        if (range) {
          const m = range.match(/bytes=(\d*)-(\d*)/);
          const start = m[1] ? Number(m[1]) : 0;
          const end = m[2] ? Number(m[2]) : size - 1;
          if (start >= size) {
            res.writeHead(416, { 'Content-Range': `bytes */${size}`, ...CORS });
            return res.end();
          }
          res.writeHead(206, {
            'Content-Type': 'application/pdf',
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Cache-Control': 'no-store',
            ...CORS,
          });
          return createReadStream(abs, { start, end }).pipe(res);
        }
        res.writeHead(200, {
          'Content-Type': 'application/pdf', 'Content-Length': size,
          'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store', ...CORS,
        });
        return createReadStream(abs).pipe(res);
      }

      // 阅读进度
      if (seg[1] === 'progress' && seg[2]) {
        const id = Number(seg[2]);
        if (req.method === 'POST') {
          const b = await readBody(req);
          run(`INSERT INTO progress(textbook_id, last_page, last_lesson_id, updated_at)
               VALUES(?,?,?,datetime('now','localtime'))
               ON CONFLICT(textbook_id) DO UPDATE SET
                 last_page=excluded.last_page,
                 last_lesson_id=excluded.last_lesson_id,
                 updated_at=excluded.updated_at`,
            id, b.last_page ?? 1, b.last_lesson_id ?? null);
          return json(res, { ok: true });
        }
        return json(res, get('SELECT * FROM progress WHERE textbook_id = ?', id) || {});
      }

      // 书签
      if (seg[1] === 'bookmark') {
        if (req.method === 'POST') {
          const b = await readBody(req);
          const r = run('INSERT INTO bookmark(textbook_id, page, note) VALUES(?,?,?)',
            b.textbook_id, b.page, b.note || '');
          return json(res, { id: Number(r.lastInsertRowid) });
        }
        if (req.method === 'DELETE' && seg[2]) {
          run('DELETE FROM bookmark WHERE id = ?', Number(seg[2]));
          return json(res, { ok: true });
        }
        const book = u.searchParams.get('book');
        return json(res, book
          ? all('SELECT * FROM bookmark WHERE textbook_id = ? ORDER BY page', Number(book))
          : all('SELECT * FROM bookmark ORDER BY created_at DESC LIMIT 50'));
      }

      if (path === '/api/stats') {
        return json(res, {
          textbook: get('SELECT COUNT(*) c FROM textbook').c,
          onShelf: get(`SELECT COUNT(*) c FROM textbook WHERE status!='pending'`).c,
          chapter: get('SELECT COUNT(*) c FROM chapter').c,
          section: get('SELECT COUNT(*) c FROM section').c,
          lesson: get('SELECT COUNT(*) c FROM lesson').c,
          events: all('SELECT * FROM shelf_event ORDER BY id DESC LIMIT 20'),
        });
      }

      return json(res, { error: '未知接口', path }, 404);
    }

    /* ---------- 静态文件 ---------- */
    // 默认入口 = 书架
    let rel = path === '/' ? '/shelf.html' : path;
    // 不允许访问服务端源码与数据库
    if (/^\/(server|data)\//.test(rel)) return json(res, { error: '禁止访问' }, 403);

    const abs = resolve(ROOT, '.' + rel);
    if (!abs.startsWith(ROOT + sep) || !existsSync(abs) || statSync(abs).isDirectory()) {
      // 单页应用兜底
      if (!extname(rel)) {
        const idx = resolve(ROOT, 'shelf.html');
        if (existsSync(idx)) {
          res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
          return createReadStream(idx).pipe(res);
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + rel);
    }

    const ext = extname(abs).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
      ...CORS,
    });
    createReadStream(abs).pipe(res);
  } catch (e) {
    console.error('[ERR]', req.method, path, e.message);
    json(res, { error: e.message }, 500);
  }
});

server.listen(PORT, () => {
  const s = get('SELECT COUNT(*) c FROM textbook');
  const on = get(`SELECT COUNT(*) c FROM textbook WHERE status!='pending'`);
  console.log(`纸上实验 · 本地服务  http://127.0.0.1:${PORT}/`);
  console.log(`  书库 ${s.c} 本，已上架 ${on.c} 本`);
});
