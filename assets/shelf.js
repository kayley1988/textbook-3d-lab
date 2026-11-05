// 全科书架前端：拉取书架树 + 全量教材，按 学段 → 年级 → 学科 → 书脊 渲染
const $ = id => document.getElementById(id);

const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const state = { stage: '初中', grade: 8, keyword: '' };
const DATA = { shelf: null, books: [] };

/* ---------- 小工具 ---------- */
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('on'), 1800);
}

/** 书脊上的短标签：一上 / 八下 / 必修1 */
function spineLabel(b) {
  if (b.volume_kind === 'module') {
    const m = (b.volume || '').match(/必修(?:第([一二三四])册)?(\d+)?/);
    if (/选择性必修/.test(b.volume || '')) return '选必' + (b.volume.match(/\d+/)?.[0] || '1');
    const n = m?.[2] || { 一: 1, 二: 2, 三: 3, 四: 4 }[m?.[1]] || 1;
    return '必修' + n;
  }
  const g = b.grade && b.grade <= 9 ? CN[b.grade] : '';
  const v = b.volume === '上册' ? '上' : b.volume === '下册' ? '下' : '全';
  return g + v;
}

/** 版本徽标，用于区分同年级同学科的不同版本 */
function editionTag(b) {
  if (b.edition) return b.edition.replace('版', '');
  if (b.publisher && /一年级起点/.test(b.publisher)) return '一起';
  if (b.publisher && /三年级起点/.test(b.publisher)) return '三起';
  return '';
}

/* ---------- 渲染 ---------- */
function renderStats() {
  const s = DATA.shelf.stats;
  const subjects = new Set(DATA.books.map(b => b.subject));
  $('shelfStats').innerHTML = `
    <div><b>${s.total}</b><span>册教材</span></div>
    <div><b>${s.onShelf}</b><span>已上架</span></div>
    <div><b>${s.with3d}</b><span>有 3D</span></div>
    <div><b>${subjects.size}</b><span>学科</span></div>`;
}

function renderStageTabs() {
  const el = $('stageTabs');
  el.innerHTML = '';
  for (const s of DATA.shelf.stages) {
    const n = DATA.books.filter(b => b.stage === s.stage).length;
    const btn = document.createElement('button');
    btn.className = 'stage-tab' + (s.stage === state.stage ? ' on' : '');
    btn.innerHTML = `${s.stage}<span class="cnt">${n}</span>`;
    btn.onclick = () => {
      state.stage = s.stage;
      const first = s.grades.find(g => g.grade > 0) || s.grades[0];
      state.grade = first ? first.grade : 0;
      renderAll();
    };
    el.appendChild(btn);
  }
}

function currentStage() {
  return DATA.shelf.stages.find(s => s.stage === state.stage) || DATA.shelf.stages[0];
}

function renderGradeTabs() {
  const el = $('gradeTabs');
  el.innerHTML = '';
  const st = currentStage();
  if (!st) return;
  for (const g of st.grades) {
    const btn = document.createElement('button');
    btn.className = 'grade-tab' + (g.grade === state.grade ? ' on' : '');
    const onShelf = g.subjects.reduce((a, s) => a + s.onShelf, 0);
    btn.textContent = g.label + (onShelf ? ` · ${onShelf}册在架` : '');
    btn.onclick = () => { state.grade = g.grade; renderAll(); };
    el.appendChild(btn);
  }
}

/** 学科卡片 */
function subjectCard(subject, books, color) {
  const card = document.createElement('div');
  card.className = 'subject-card';

  const onShelf = books.filter(b => b.status !== 'pending').length;
  const with3d = books.filter(b => b.status === 'ready').length;

  const head = document.createElement('div');
  head.className = 'sc-head';
  head.innerHTML = `
    <span class="sc-dot" style="background:${color}"></span>
    <span class="sc-name">${subject}</span>
    <span class="sc-meta"><b>${books.length}</b> 册 · <b>${onShelf}</b> 在架${with3d ? ` · <b style="color:#2fa36b">${with3d}</b> 有3D` : ''}</span>`;
  card.appendChild(head);

  const row = document.createElement('div');
  row.className = 'spines';

  // 按 sort_key 排
  books.sort((a, b) => (a.sort_key ?? 0) - (b.sort_key ?? 0));

  for (const b of books) {
    const sp = document.createElement('div');
    const off = b.status === 'pending';
    sp.className = 'spine' + (off ? ' off' : '');
    const tag = editionTag(b);
    sp.title = `${b.short_title}${tag ? '（' + tag + '）' : ''}${off ? ' · 待上架' : ' · 点击进入'}`;

    if (!off) {
      sp.style.background = `linear-gradient(180deg, ${color} 0%, ${shade(color, -18)} 100%)`;
      sp.style.color = '#fff';
    }
    sp.innerHTML = `<span class="sp-text">${spineLabel(b)}${tag ? `<i style="font-style:normal;opacity:.75;font-size:9px"> ${tag}</i>` : ''}</span>`
      + (b.status === 'ready' ? '<span class="sp-badge">3D</span>' : '');

    sp.onclick = () => {
      if (off) return toast(`《${b.short_title}》还没上架`);
      location.href = `./reader.html?book=${b.id}`;
    };
    row.appendChild(sp);
  }

  card.appendChild(row);
  return card;
}

/** 颜色加深/减淡 */
function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function renderGrid() {
  const grid = $('shelfGrid');
  const empty = $('shelfEmpty');
  grid.innerHTML = '';

  const kw = state.keyword.trim().toLowerCase();
  let pool;

  if (kw) {
    // 搜索：跨全库
    pool = DATA.books.filter(b =>
      (b.short_title || '').toLowerCase().includes(kw) ||
      (b.title || '').toLowerCase().includes(kw) ||
      (b.subject || '').toLowerCase().includes(kw) ||
      (b.stage || '').toLowerCase().includes(kw) ||
      (b.volume || '').toLowerCase().includes(kw) ||
      (b.edition || '').toLowerCase().includes(kw));
  } else {
    pool = DATA.books.filter(b => b.stage === state.stage && b.grade === state.grade);
  }

  if (!pool.length) {
    empty.hidden = false;
    empty.innerHTML = kw
      ? `<span class="big">🔍</span>没有找到「${state.keyword}」<br>试试搜「物理」「八年级」「必修」`
      : `<span class="big">📚</span>这一层还空着<br>等这批教材上架后就会出现在这里`;
    return;
  }
  empty.hidden = true;

  // 按学科分组（保持学科首次出现的顺序按册数降序）
  const groups = new Map();
  for (const b of pool) {
    if (!groups.has(b.subject)) groups.set(b.subject, []);
    groups.get(b.subject).push(b);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [subject, books] of ordered) {
    const color = books[0].spine_color || '#6b6558';
    grid.appendChild(subjectCard(subject, books, color));
  }
}

function renderAll() {
  renderStageTabs();
  renderGradeTabs();
  renderGrid();
}

/* ---------- 启动 ---------- */
async function boot() {
  try {
    const [shelf, books] = await Promise.all([
      fetch('/api/shelf').then(r => r.json()),
      fetch('/api/textbooks').then(r => r.json()),
    ]);
    DATA.shelf = shelf;
    DATA.books = books;

    // 默认定位到「有 3D 的那本书」所在层
    const ready = books.find(b => b.status === 'ready');
    if (ready) { state.stage = ready.stage; state.grade = ready.grade; }
    else {
      const st = shelf.stages[0];
      if (st) { state.stage = st.stage; state.grade = st.grades[0]?.grade ?? 0; }
    }

    renderStats();
    renderAll();

    $('searchInput').addEventListener('input', e => {
      state.keyword = e.target.value;
      renderGrid();
    });
    $('footPath').textContent = `${shelf.stats.onShelf}/${shelf.stats.total} 册在架`;
  } catch (e) {
    console.error(e);
    $('shelfGrid').innerHTML = `<div class="shelf-empty"><span class="big">⚠️</span>书架加载失败<br>${e.message}<br><br>请确认本地服务已启动：<code>node --no-warnings server/api.js</code></div>`;
  }
}

boot();
