// 教材路径解析器
// 输入：Repo 里的相对路径，如
//   初中/物理/人教版-人民教育出版社/八年级/义务教育教科书·物理八年级下册.pdf
//   小学/数学/人教版/义务教育教科书 · 数学一年级上册.pdf
//   高中/化学/人教版-人民教育出版社/普通高中教科书·化学必修 第一册.pdf.1
// 输出：结构化的教材维度属性

const SUBJECT_SLUG = {
  数学: 'math', 英语: 'en', 物理: 'phy', 化学: 'chem',
  生物学: 'bio', 生物: 'bio', 语文: 'cn', 地理: 'geo',
  历史: 'hist', 道德与法治: 'pol', 科学: 'sci',
};

const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };

const STAGE_ORDER = { 小学: 0, 初中: 1, 高中: 2 };

/** 归一化：去掉重复副本后缀 .pdf.1 / .pdf.2 */
export function normalizePath(p) {
  return p.replace(/\.pdf(\.\d+)?$/i, '.pdf');
}

/** 该路径是否是同一本的重复副本 */
export const isDuplicateCopy = (p) => /\.pdf\.\d+$/i.test(p);

function cnToInt(s) {
  if (!s) return null;
  // 「第二」「二册」「第三」都要能吃到数字
  const t = String(s).replace(/^第/, '').replace(/[册期]$/, '');
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  return CN_NUM[t] ?? null;
}

/** 从出版社段提取版本（人教版（A版）（主编：xx） → A版 / PEP / 精通） */
function parseEdition(pubSeg = '', fileSeg = '') {
  const m = pubSeg.match(/[（(]([AB])版[)）]/);
  if (m) return `${m[1]}版`;
  // 版本标记既可能出现在出版社目录（人教版（精通）），也可能出现在文件名（英语（PEP））
  if (/精通/.test(pubSeg) || /精通/.test(fileSeg)) return '精通';
  if (/PEP/i.test(pubSeg) || /PEP/i.test(fileSeg)) return 'PEP';
  return '';
}

/** 从文件名提取 年级 / 册次 / 模块信息 */
function parseVolume(fileSeg) {
  // 高中模块：必修 第一册 / 选择性必修1 化学反应原理
  const mod = fileSeg.match(/(选择性必修|必修)\s*([一二三四五六七八九十\d]+)?\s*([第]?[一二三四五六七八九十]+册)?\s*([^（）()]*)/);
  if (/普通高中/.test(fileSeg) && mod) {
    const kind = mod[1];                       // 必修 / 选择性必修
    const numRaw = mod[2] || (mod[3] ? mod[3].replace('册', '') : '1');
    const num = cnToInt(numRaw) ?? 1;
    const sub = (mod[4] || '').replace(/^[\s·]+/, '').trim();
    const cnNum = ['零', '一', '二', '三', '四', '五'][num] || num;
    const volume = kind === '必修'
      ? `必修第${cnNum}册`
      : `选择性必修${num}`;
    return {
      volume, volumeKind: 'module', moduleGroup: kind,
      moduleNo: num, subtitle: sub,
    };
  }

  // 小学/初中：上册 / 下册 / 全一册
  // 注意：「三年级起点」里的"三年级"不是年级，必须先剔除再匹配
  const cleaned = fileSeg.replace(/[一二三四五六]年级起点/g, '');
  const v = cleaned.match(/(上册|下册|全一册)/);
  const g = cleaned.match(/([一二三四五六七八九])年级/);
  return {
    volume: v ? v[1] : '',
    volumeKind: 'term',
    gradeNo: g ? cnToInt(g[1]) : null,
  };
}

/** 高中模块 → 推测年级（仅用于排序） */
function moduleToGrade(kind, no) {
  if (kind === '必修') return no <= 2 ? 10 : 11;
  return no <= 1 ? 11 : 12;
}

/**
 * 解析一条路径
 * @returns 结构化教材信息
 */
export function parsePath(relPath) {
  const raw = relPath.replace(/\\/g, '/');
  const dup = isDuplicateCopy(raw);
  const norm = normalizePath(raw);
  const segs = norm.split('/');
  const stage = segs[0];
  const subject = segs[1] || '';
  // 初中：stage/subject/publisher/grade/file ；小学&高中：stage/subject/publisher/file
  const fileName = segs[segs.length - 1];
  const pubSeg = segs[2] || '';
  const dirGrade = segs.length === 5 ? segs[3] : '';   // 初中的年级目录
  const fileSeg = fileName.replace(/\.pdf$/i, '');

  const vol = parseVolume(fileSeg);
  const edition = parseEdition(pubSeg, fileSeg);

  // 年级
  let grade = vol.gradeNo ?? null;
  if (stage === '初中' && dirGrade) {
    const g = dirGrade.match(/([一二三四五六七八九])年级/);
    if (g) grade = cnToInt(g[1]);
  }
  if (stage === '高中') grade = moduleToGrade(vol.moduleGroup, vol.moduleNo);

  // 起点标记（小学英语：一年级起点 / 三年级起点）
  const startM = fileSeg.match(/([一二三四五六])年级起点/);
  const startPoint = startM ? `${startM[1]}年级起点` : '';

  const slug = SUBJECT_SLUG[subject] || subject;
  const stageCode = stage === '小学' ? 'p' : stage === '初中' ? 'j' : 'h';

  let volumeCode = '';
  if (vol.volumeKind === 'module') {
    volumeCode = vol.moduleGroup === '必修' ? `bx${vol.moduleNo}` : `xx${vol.moduleNo}`;
  } else {
    volumeCode = vol.volume === '上册' ? '1' : vol.volume === '下册' ? '2' : '0';
  }

  const code = [
    slug, stageCode, grade ?? 0, volumeCode,
    edition ? edition.replace('版', '').toLowerCase() : '',
    startPoint ? startPoint.replace('年级起点', '') : '',
  ].filter(Boolean).join('-');

  // 短标题
  const cnNum = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  let shortTitle;
  if (vol.volumeKind === 'module') {
    shortTitle = `${subject}·${vol.moduleGroup === '必修' ? '必修' + (['', '一', '二', '三', '四'][vol.moduleNo] || vol.moduleNo) : '选必' + vol.moduleNo}`;
  } else {
    const gLabel = grade ? cnNum[grade] + '年级' : '';
    shortTitle = `${subject}${stage === '高中' ? '' : gLabel}${(vol.volume || '').replace('全一册', '全')}`;
  }

  return {
    raw, normPath: norm, dup,
    stage, subject, publisher: pubSeg.split('-')[0] || '人教版',
    edition, startPoint,
    grade: grade ?? null,
    volume: vol.volume || '',
    volumeKind: vol.volumeKind,
    moduleGroup: vol.moduleGroup || null,
    moduleNo: vol.moduleNo ?? null,
    subtitle: vol.subtitle || '',
    title: fileSeg,
    shortTitle,
    code,
    sortKey: (STAGE_ORDER[stage] ?? 9) * 10000 + (grade ?? 0) * 100 +
             (vol.volumeKind === 'module' ? 50 + (vol.moduleNo || 0) : (vol.volume === '上册' ? 1 : vol.volume === '下册' ? 2 : 0)),
    pdfPath: 'books/' + norm,   // 清单里的路径不含 books/ 前缀，实际文件在 books/ 下
  };
}

/** 书架配色（按学科固定色相，书架看起来成体系） */
export const SUBJECT_COLOR = {
  数学: '#2f6fdb', 英语: '#7a4fd6', 物理: '#c9572a',
  化学: '#1e9e50', 生物学: '#0f8f9c', 语文: '#b0392e',
  地理: '#3f8f5a', 历史: '#8a6a3f', 道德与法治: '#a04a86',
};
