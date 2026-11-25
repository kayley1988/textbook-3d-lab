import { lessons } from './content.js';
import * as THREE from 'three';
import { createStage, ECOL } from './stage.js';
import { createBook } from './book.js';
import { loadBook, renderSpread, renderCover } from './pdfpages.js';
import { BOOKS, DEFAULT_BOOK, spreadForLesson, spreadAt } from './bindings.js';
import { sceneIntro, sceneKinetic, sceneGPE, sceneSpring, scenePendulum } from './scenesA.js';
import { sceneWork, sceneEfficiency, sceneFriction, sceneHeating, sceneSankey } from './scenesB.js';
import { sceneBuoyancy } from './scenesBuoy.js';
import {
  sceneElastic, sceneGravity, sceneNewton, sceneBalance2, sceneFrictionS,
  scenePressure, sceneLiquidP, sceneAtmos, sceneFluid, sceneArchimedes,
  sceneFloatSink, sceneLever, scenePulley, sceneMechEff,
} from './scenesC.js';
import {
  sceneForceDoor, sceneCircular, sceneManometer, sceneSinkPlug, sceneTorricelli,
  sceneBaroMeter, sceneCoinJump, sceneWing, sceneClayBoat, sceneBalloon,
  sceneRoller, scenePulleyWork,
} from './scenesD.js';

const SCENES = {
  intro: sceneIntro, kinetic: sceneKinetic, gpe: sceneGPE, spring: sceneSpring,
  pendulum: scenePendulum, work: sceneWork, efficiency: sceneEfficiency,
  friction: sceneFriction, heating: sceneHeating, sankey: sceneSankey,
  buoyancy: sceneBuoyancy,
  elastic: sceneElastic, gravity: sceneGravity, newton: sceneNewton,
  balance2: sceneBalance2, frictionS: sceneFrictionS, pressure: scenePressure,
  liquidP: sceneLiquidP, atmos: sceneAtmos, fluid: sceneFluid,
  archimedes: sceneArchimedes, floatSink: sceneFloatSink, lever: sceneLever,
  pulley: scenePulley, mechEff: sceneMechEff,
  forceDoor: sceneForceDoor, circular: sceneCircular, manometer: sceneManometer,
  sinkPlug: sceneSinkPlug, torricelli: sceneTorricelli, baroMeter: sceneBaroMeter,
  coinJump: sceneCoinJump, wing: sceneWing, clayBoat: sceneClayBoat,
  balloon: sceneBalloon, roller: sceneRoller, pulleyWork: scenePulleyWork,
};
const SELF_ANIM = new Set([
  'intro', 'kinetic', 'pendulum', 'sankey', 'buoyancy',
  'elastic', 'gravity', 'newton', 'balance2', 'frictionS', 'pressure',
  'liquidP', 'atmos', 'fluid', 'archimedes', 'floatSink', 'lever', 'pulley', 'mechEff',
  'forceDoor', 'circular', 'manometer', 'sinkPlug', 'torricelli', 'baroMeter',
  'coinJump', 'wing', 'clayBoat', 'balloon', 'roller', 'pulleyWork',
]);
const LEGEND = [
  ['动能', ECOL.KE, '正在运动'], ['重力势能', ECOL.PE, '被举高'],
  ['弹性势能', ECOL.EPE, '发生形变'], ['内能 · 热量', ECOL.Q, '温度与热'],
  ['电能', ECOL.E, '电流做功'], ['化学能 / 光能', ECOL.LIGHT, '燃料与发光'],
];

const $ = id => document.getElementById(id);
const stage = createStage($('stage'), $('labels'));
window.__dbg = () => ({
  cam: stage.camera.position.toArray().map(n => +n.toFixed(2)),
  tgt: stage.controls.target.toArray().map(n => +n.toFixed(2)),
  grp: appGroup?.position.toArray().map(n => +n.toFixed(2)),
  fit: lessons[cur]?.fit, id: lessons[cur]?.id,
});
const book = createBook(stage.scene, 12);

let cur = -1, scene = null, P = {}, playing = false, lastT = performance.now();
let appGroup = null, riseT = 1, waitingBook = false;

/* ---------- 教材联动 ---------- */
// 书架数据库 book id → bindings SPREADS key 映射（只有物理八下有 SPREADS）
const SHELF_ID_TO_BINDINGS = {
  '119': 'physics8b',   // 物理八年级下册（ready）
};
// 从 ?book=<id> 读取要打开的教材；映射不到 bindings 时回退到默认书（物理八下）
const URL_PARAMS = new URLSearchParams(location.search);
const RAW_BOOK_ID = URL_PARAMS.get('book') || '';
const BOOK_ID = SHELF_ID_TO_BINDINGS[RAW_BOOK_ID] || DEFAULT_BOOK;
const BOOK = BOOKS[BOOK_ID];
let pdfDoc = null, curRight = 0;
const anchorOf = (u, v) =>
  new THREE.Vector3(u * book.W / 2, book.pageY, -book.D / 2 + v * book.D);
let curAnchor = null, curHover = 0;

/* ---------- 指示光流（装置 → 教材知识点） ---------- */
let indicator = null;
function ensureIndicator() {
  if (indicator) return indicator;
  const g = new THREE.Group();
  stage.scene.add(g);
  const N = 9;
  const dots = [];
  const geo = new THREE.SphereGeometry(.055, 10, 8);
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: i === N - 1 ? '#ffb43a' : '#ffd98a', transparent: true, opacity: .9,
    }));
    g.add(m); dots.push(m);
  }
  const head = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 12),
    new THREE.MeshBasicMaterial({ color: '#ffb43a' }));
  g.add(head);
  indicator = { group: g, dots, head, from: new THREE.Vector3(), to: new THREE.Vector3(), mid: new THREE.Vector3(), v: new THREE.Vector3() };
  return indicator;
}
const _bez = (o, a, c, b, t) => {
  const s = 1 - t;
  o.set(
    s * s * a.x + 2 * s * t * c.x + t * t * b.x,
    s * s * a.y + 2 * s * t * c.y + t * t * b.y,
    s * s * a.z + 2 * s * t * c.z + t * t * b.z);
  return o;
};
function updateIndicator(dt, targetUV, hoverY) {
  if (!targetUV || !appGroup || !book.isOpen()) { if (indicator) indicator.group.visible = false; return; }
  const ind = ensureIndicator();
  ind.group.visible = true;
  ind.from.copy(appGroup.position); ind.from.y -= .1;
  ind.to.copy(anchorOf(targetUV[0], targetUV[1])); ind.to.y += .03;
  ind.mid.lerpVectors(ind.from, ind.to, .5); ind.mid.y += .55;
  const T = performance.now() / 1000;
  const n = ind.dots.length;
  ind.dots.forEach((d, i) => {
    const t = ((T * .55 + i / n) % 1);
    _bez(d.position, ind.from, ind.mid, ind.to, t);
    const fade = Math.sin(t * Math.PI);
    d.material.opacity = .25 + fade * .7;
    d.scale.setScalar(.55 + fade * .7);
  });
  // 箭头头部指向锚点，沿末端切线
  const t0 = .97, t1 = 1;
  _bez(ind.v, ind.from, ind.mid, ind.to, t0);
  const p0 = ind.v.clone();
  _bez(ind.v, ind.from, ind.mid, ind.to, t1);
  ind.head.position.copy(ind.to); ind.to.y += 0;
  ind.head.position.y = ind.to.y + .1;
  ind.v.sub(p0).normalize();
  ind.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ind.v.negate());
}

/* ---------- 笔模式（书页批注） ---------- */
let penMode = false, penDrawing = false, penGroup = null, penLast = null;
const penRay = new THREE.Raycaster(), penPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), penPt = new THREE.Vector3();
const PEN_COLORS = ['#c2401e', '#1e6fc2', '#1e9e50'];
let penColor = PEN_COLORS[0];

/* ---------- 装置拖拽（悬空平移） ---------- */
const HOVER_DEF = 0.85;
const dragRay = new THREE.Raycaster();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragPt = new THREE.Vector3();
let dragOn = false;
const dragOff = new THREE.Vector3();
const ndcOf = e => {
  const r = stage.renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
};
function tryGrab(e) {
  if (!appGroup || penMode || !book.isOpen() || !appGroup.visible) return false;
  dragRay.setFromCamera(ndcOf(e), stage.camera);
  const hits = dragRay.intersectObject(appGroup, true);
  if (!hits.length) return false;
  dragPlane.constant = -appGroup.position.y;
  if (!dragRay.ray.intersectPlane(dragPlane, dragPt)) return false;
  dragOn = true;
  dragOff.copy(appGroup.position).sub(dragPt);
  return true;
}

function penAddStroke(a, b) {
  if (!penGroup) { penGroup = new THREE.Group(); penGroup.position.y = book.pageY + .02; stage.scene.add(penGroup); }
  const mat = new THREE.MeshBasicMaterial({ color: penColor, transparent: true, opacity: .85 });
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 1e-4) return;
  const joint = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), mat);
  joint.position.copy(a).sub(penGroup.position); joint.position.y = 0;
  penGroup.add(joint);
  const seg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, len, 6), mat);
  seg.position.copy(a).add(b).multiplyScalar(.5).sub(penGroup.position); seg.position.y = 0;
  seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  penGroup.add(seg);
}
function penLocal(e) {
  const r = stage.renderer.domElement.getBoundingClientRect();
  const nd = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  penRay.setFromCamera(nd, stage.camera);
  penPlane.constant = -book.pageY;
  return penRay.ray.intersectPlane(penPlane, penPt) ? penPt.clone() : null;
}

/* ---------- 格式化 ---------- */
const fmtJ = v => v >= 1000 ? (v / 1000).toFixed(2) + ' kJ' : v.toFixed(1) + ' J';

/* ---------- 左栏渲染 ---------- */
function renderPanel(L) {
  $('lessonTag').textContent = `第 ${lessons.indexOf(L) + 1} 课 / 共 ${lessons.length} 课`;
  $('lessonTitle').textContent = L.title;
  $('lessonLead').textContent = L.lead;
  $('concept').innerHTML = L.concept.map(p => `<p>${p}</p>`).join('');
  $('formulaExpr').innerHTML = L.formula.expr;
  $('formulaNote').textContent = L.formula.note;
  $('points').innerHTML = L.points.map(p => `<li>${p}</li>`).join('');
  $('think').textContent = L.question;

  // 控件
  const cw = $('controls'); cw.innerHTML = '';
  for (const c of L.controls) {
    if (c.type === 'check') {
      const w = document.createElement('label');
      w.className = 'ctrl-check';
      w.innerHTML = `<input type="checkbox" ${c.value ? 'checked' : ''}> ${c.label}`;
      const inp = w.querySelector('input');
      inp.addEventListener('change', () => { P[c.key] = inp.checked; });
      cw.appendChild(w);
    } else {
      const w = document.createElement('div');
      w.className = 'ctrl';
      w.innerHTML = `
        <label><b>${c.label}</b><span class="val" id="v_${c.key}"></span></label>
        <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">`;
      const inp = w.querySelector('input');
      const val = w.querySelector('.val');
      const sync = () => {
        P[c.key] = parseFloat(inp.value);
        val.textContent = P[c.key] + (c.unit ? ' ' + c.unit : '');
        inp.style.setProperty('--fill', ((P[c.key] - c.min) / (c.max - c.min) * 100) + '%');
      };
      inp.addEventListener('input', sync);
      sync();
      cw.appendChild(w);
    }
  }

  // 读数占位（数量在场景建立后确定）
  $('readouts').innerHTML = '';
}

function buildReadouts(n) {
  const r = $('readouts'); r.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'readout';
    d.innerHTML = `<div class="r-label"></div><div class="r-val"></div>`;
    r.appendChild(d);
  }
}

/* ---------- 能量账本 ---------- */
function renderEnergyCard(L) {
  const card = $('energyCard');
  const stack = $('energyStack'), rows = $('energyRows');
  stack.innerHTML = ''; rows.innerHTML = '';
  $('energyTitle').textContent = L.energy?.title || '能量账本';
  if (!L.energy || L.energy.mode === 'legend') {
    $('energyTotal').textContent = '六种基本形式';
    for (const [name, col, desc] of LEGEND) {
      const d = document.createElement('div');
      d.className = 'e-row';
      d.innerHTML = `<span class="e-dot" style="background:${col};color:${col}"></span>
        <span class="e-name" style="width:auto">${name}</span>
        <span style="font-size:10.5px;color:#a39a86">${desc}</span>`;
      rows.appendChild(d);
    }
    stack.style.display = 'none';
    return;
  }
  stack.style.display = L.energy.mode === 'stack' ? '' : 'none';
}
function updateEnergy(L) {
  if (!L.energy || L.energy.mode === 'legend' || !scene?.energy) return;
  const list = scene.energy(P) || [];
  const rows = $('energyRows'), stack = $('energyStack');
  if (rows.children.length !== list.length) {
    rows.innerHTML = '';
    for (const it of list) {
      const d = document.createElement('div');
      d.className = 'e-row';
      d.innerHTML = `<span class="e-dot" style="background:${it.color};color:${it.color}"></span>
        <span class="e-name">${it.label}</span>
        <span class="e-bar"><span class="e-fill" style="background:${it.color}"></span></span>
        <span class="e-val"></span>`;
      rows.appendChild(d);
    }
    if (L.energy.mode === 'stack') {
      stack.innerHTML = list.map(it => `<span class="seg" style="background:${it.color}"></span>`).join('');
    }
  }
  const total = list.reduce((s, it) => s + it.value, 0);
  const scale = L.energy.mode === 'stack' ? Math.max(total, 1e-6)
    : Math.max(...list.map(it => it.value), 1e-6);
  const segs = stack.children, fills = rows.querySelectorAll('.e-fill'), vals = rows.querySelectorAll('.e-val');
  list.forEach((it, i) => {
    const f = it.value / scale * 100;
    fills[i].style.width = f + '%';
    vals[i].textContent = it.unit ? it.value.toFixed(2) + ' ' + it.unit : fmtJ(it.value);
    if (L.energy.mode === 'stack' && segs[i]) segs[i].style.width = (it.value / Math.max(total, 1e-6) * 100) + '%';
  });
  const hasUnit = list.some(it => it.unit);
  $('energyTotal').textContent = hasUnit ? '' : '合计 ' + fmtJ(total);
}

/* ---------- 课时切换 ---------- */
function disposeGroup(g) {
  if (!g) return;
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}

function loadLesson(i, forceRight) {
  if (i === cur && forceRight === undefined && pdfDoc) return;
  cur = i;
  const L = lessons[i];
  playing = false;
  $('btnPlay').textContent = '▶ 开始';

  // 清空装置（保留灯光与书本）
  disposeGroup(appGroup);
  for (const o of [...stage.scene.children]) {
    if (o !== stage.lightRig && o !== book.group) stage.scene.remove(o);
  }
  stage.clearLabels();

  // 参数
  P = {};
  for (const c of L.controls) P[c.key] = c.value;

  // 相机
  const cam = L.cam;
  stage.camera.position.set(...cam.pos);
  stage.controls.target.set(...cam.target);
  stage.controls.autoRotate = !!cam.autoRotate;
  stage.controls.autoRotateSpeed = 0.55;
  stage.controls.update();

  // 场景
  scene = SCENES[L.id](stage);

  // 把装置收进一个组，落到教材锚点上，做"从纸面立起来"的动画
  const extra = stage.scene.children.filter(o => o !== stage.lightRig && o !== book.group);
  appGroup = new THREE.Group();
  stage.scene.add(appGroup);
  extra.forEach(o => appGroup.add(o));
  const sp = spreadForLesson(L.id);
  const a = sp ? sp.anchor : [0.5, 0.6];
  curAnchor = a;
  curHover = sp?.hover ?? HOVER_DEF;          // 默认悬空在书页上方
  appGroup.position.copy(anchorOf(a[0], a[1]));
  appGroup.position.y = book.pageY + curHover;
  const fit = L.fit || 1;
  appGroup.scale.set(fit, 0.02, fit);
  riseT = 1;
  waitingBook = !book.isOpen();
  autoFrame(appGroup, fit);

  // UI
  renderPanel(L);
  renderEnergyCard(L);
  const nR = scene.readouts(P).length || 4;
  buildReadouts(Math.max(nR, 2));
  document.querySelectorAll('.chip').forEach((c, j) => c.classList.toggle('active', j === i));
  $('navPos').textContent = `${i + 1} / ${lessons.length}`;
  scene.reset?.(P);

  // 教材对开联动
  gotoSpread(forceRight || (sp ? sp.right : curRight || 62));
}

/* ---------- 教材跨页 ---------- */
function updateSpreadUI(right) {
  const r = right || curRight;
  $('spreadInfo').textContent = r ? `P ${r - 1}–${r}` : '—';
  $('pageInput').value = r || '';
  const sp = spreadAt(r);
  $('spreadTag').textContent = sp ? '◆ ' + sp.tag : '';
  highlightToc();
}

async function gotoSpread(right) {
  right = Math.max(2, Math.min(BOOK.pages, right | 0));
  updateSpreadUI(right);
  if (!pdfDoc) { riseT = 0; return; }
  if (!book.isOpen()) {                    // 封面未开：静默换页，等开书后立起
    await renderSpread(pdfDoc, right, book.canvas);
    book.blit();
    curRight = right;
    if (book.isOpen()) riseT = 0;
    updateSpreadUI(right);
    return;
  }
  if (right === curRight) { riseT = 0; return; }
  const dir = right > curRight ? 1 : -1;
  const started = book.flipTo(dir,
    () => renderSpread(pdfDoc, right, book.canvas).then(() => book.blit()),
    () => { curRight = right; riseT = 0; updateSpreadUI(right); });
  if (!started) {                          // 已有翻页在进行：直接换内容
    await renderSpread(pdfDoc, right, book.canvas);
    book.blit();
    curRight = right; riseT = 0;
    updateSpreadUI(right);
  }
}

function pageTurn(dir) {
  const base = curRight || 62;
  const target = Math.max(2, Math.min(BOOK.pages, base + dir * 2));
  const sp = spreadAt(target);
  if (sp && sp.lesson !== lessons[cur]?.id) loadLesson(lessons.findIndex(l => l.id === sp.lesson), target);
  else loadLesson(Math.max(0, cur), target);
}

/* ---------- 主循环 ---------- */
function tick() {
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const L = lessons[cur];

  book.update(dt);

  // 装置从纸页上"立起来"
  if (appGroup) {
    if (waitingBook) {
      appGroup.scale.set(1, 0.02, 1);
      if (book.isOpen()) { waitingBook = false; riseT = 0; }
    } else if (riseT < 1) {
      riseT = Math.min(1, riseT + dt / 0.95);
      const c1 = 1.70158, c3 = c1 + 1, k = riseT, d = k - 1;
      appGroup.scale.y = Math.max(0.02, 1 + c3 * d * d * d + c1 * d * d);
    }
  }

  if (scene && L && (playing || SELF_ANIM.has(L.id))) scene.update(dt, P);
  updateIndicator(dt, curAnchor, curHover);
  $('labels').style.visibility = waitingBook ? 'hidden' : 'visible';
  stage.controls.update();
  stage.renderer.render(stage.scene, stage.camera);
  stage.updateLabels();
  if (scene?.readouts) {
    const rd = scene.readouts(P);
    const nodes = $('readouts').children;
    for (let i = 0; i < Math.min(rd.length, nodes.length); i++) {
      nodes[i].children[0].textContent = rd[i].label;
      nodes[i].children[1].innerHTML = `${rd[i].val}<small>${rd[i].unit || ''}</small>`;
    }
  }
  if (L) updateEnergy(L);
}

/* ---------- 教材目录面板 ---------- */
let tocData = null;
const spreadRightOfPage = p => (p % 2 === 0 ? p : p + 1);

function renderToc() {
  const body = $('tocBody');
  body.innerHTML = '';
  for (const ch of tocData) {
    const wrap = document.createElement('div');
    wrap.className = 'toc-ch open';
    const chBtn = document.createElement('button');
    chBtn.className = 'toc-ch-head';
    chBtn.innerHTML = `<span class="toc-arrow">▾</span><span class="toc-ch-title">${ch.label}</span><span class="toc-ch-page">P${ch.page}</span>`;
    const list = document.createElement('div');
    list.className = 'toc-sec-list';
    for (const sec of ch.children) {
      const r = spreadRightOfPage(sec.page);
      const sp = spreadAt(r);
      const btn = document.createElement('button');
      btn.className = 'toc-sec' + (sp ? ' has3d' : '');
      btn.dataset.right = r;
      btn.innerHTML = `<span class="toc-dot">${sp ? '●' : '○'}</span>
        <span class="toc-sec-title">${sec.label.replace(/^\d+\s*节\s*/, '')}</span>
        <span class="toc-sec-page">P${sec.page}</span>`;
      btn.addEventListener('click', () => {
        if (sp) loadLesson(lessons.findIndex(l => l.id === sp.lesson), r);
        else pageTurnTo(r);
        $('tocPanel').classList.add('hide');
      });
      list.appendChild(btn);
    }
    chBtn.addEventListener('click', () => wrap.classList.toggle('open'));
    wrap.appendChild(chBtn); wrap.appendChild(list);
    body.appendChild(wrap);
  }
  highlightToc();
}
function highlightToc() {
  if (!tocData) return;
  document.querySelectorAll('.toc-sec').forEach(b =>
    b.classList.toggle('cur', +b.dataset.right === curRight));
}
function toggleToc(show) {
  const p = $('tocPanel');
  const target = show === undefined ? p.classList.contains('hide') : show;
  p.classList.toggle('hide', !target);
}
$('btnToc').addEventListener('click', () => toggleToc());
$('btnTocClose').addEventListener('click', () => toggleToc(false));
fetch('./books_toc/物理八下.toc.json')
  .then(r => r.json())
  .then(d => { tocData = d; renderToc(); })
  .catch(err => console.warn('目录加载失败', err));

/* ---------- 自动取景：装置溢出画面时按原视角方向重新框定（已框好的不动） ---------- */
function autoFrame(group, fit) {
  const camera = stage.camera;
  const sy = group.scale.y;
  group.scale.y = fit;                    // 按立起后的最终尺寸计算
  group.updateMatrixWorld(true);
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  group.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (o.material && o.material.transparent && o.material.opacity < 0.45) return; // 玻璃/水流等
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(tmp);
  });
  group.scale.y = sy;
  group.updateMatrixWorld(true);
  if (box.isEmpty() || !isFinite(box.min.x + box.min.y + box.min.z + box.max.x + box.max.y + box.max.z)) return;

  camera.updateMatrixWorld();          // 关键：刷新矩阵再做投影，否则用旧矩阵会误判

  // 8 个角投影到屏幕，全部在安全区 → 已框好，不动
  const corner = new THREE.Vector3();
  let ok = true;
  for (let i = 0; i < 8 && ok; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
    if (corner.x < -0.96 || corner.x > 0.96 || corner.y < -0.94 || corner.y > 0.94 || corner.z > 1) ok = false;
  }
  if (ok) {
    // 不裁切但偏离画面中心 → 平移视点把装置摆正（不改距离）
    const sph0 = new THREE.Sphere();
    box.getBoundingSphere(sph0);
    const cNdc = sph0.center.clone().project(camera);
    if (Math.abs(cNdc.x) <= 0.42 && Math.abs(cNdc.y) <= 0.55) return;
    const vFov0 = THREE.MathUtils.degToRad(camera.fov);
    const hFov0 = 2 * Math.atan(Math.tan(vFov0 / 2) * camera.aspect);
    const d0 = camera.position.distanceTo(sph0.center);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const delta = right.multiplyScalar(cNdc.x * Math.tan(hFov0 / 2) * d0)
      .add(up.multiplyScalar(cNdc.y * Math.tan(vFov0 / 2) * d0));
    camera.position.add(delta);
    stage.controls.target.add(delta);
    stage.controls.update();
    return;
  }

  // 保留原视角方向，目标=包围盒中心，距离按包围球和视场角计算
  const sph = new THREE.Sphere();
  box.getBoundingSphere(sph);
  const dir = camera.position.clone().sub(stage.controls.target).normalize();
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = (sph.radius / Math.sin(Math.min(vFov, hFov) / 2)) * 1.18;
  camera.position.copy(sph.center).addScaledVector(dir, dist);
  stage.controls.target.copy(sph.center);
  stage.controls.update();
}

/* ---------- 事件 ---------- */
$('btnPlay').addEventListener('click', () => {
  if (!scene) return;
  if (scene.markDone?.()) scene.setGhostFrom?.(P);
  if (scene.togglePlay) { scene.togglePlay(); playing = scene.isPlaying ? !!scene.isPlaying() : !playing; }
  else {
    if (!playing) scene.start?.(P);
    playing = !playing;
  }
  $('btnPlay').textContent = playing ? '⏸ 暂停' : '▶ 开始';
});
$('btnReset').addEventListener('click', () => {
  if (!scene) return;
  playing = false;
  $('btnPlay').textContent = '▶ 开始';
  scene.reset?.(P);
});
$('btnPrev').addEventListener('click', () => loadLesson((cur - 1 + lessons.length) % lessons.length));
$('btnNext').addEventListener('click', () => loadLesson((cur + 1) % lessons.length));
$('btnPagePrev').addEventListener('click', () => pageTurn(-1));
$('btnPageNext').addEventListener('click', () => pageTurn(1));
$('pageInput').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const v = parseInt(e.target.value, 10);
  if (!isNaN(v)) pageTurnTo(v);
});
function pageTurnTo(right) {
  const target = Math.max(2, Math.min(BOOK.pages, right));
  const sp = spreadAt(target);
  if (sp && sp.lesson !== lessons[cur]?.id) loadLesson(lessons.findIndex(l => l.id === sp.lesson), target);
  else loadLesson(Math.max(0, cur), target);
}
/* ---------- 笔模式 / 拖拽事件 ---------- */
const cv = stage.renderer.domElement;
cv.addEventListener('pointerdown', e => {
  if (penMode) {
    if (!book.isOpen()) return;
    const pt = penLocal(e);
    if (pt) { penDrawing = true; penLast = pt; cv.setPointerCapture(e.pointerId); }
    return;
  }
  if (tryGrab(e)) {
    cv.setPointerCapture(e.pointerId);
    stage.controls.enabled = false;
    cv.style.cursor = 'grabbing';
    $('bookHint').textContent = '✋ 拖动装置：把它挪到任意位置，箭头会一直指向知识点';
  }
});
cv.addEventListener('pointermove', e => {
  if (dragOn && appGroup) {
    dragRay.setFromCamera(ndcOf(e), stage.camera);
    dragPlane.constant = -appGroup.position.y;
    if (dragRay.ray.intersectPlane(dragPlane, dragPt)) {
      const nx = dragPt.x + dragOff.x, nz = dragPt.z + dragOff.z;
      appGroup.position.x = Math.max(-book.W * 0.56, Math.min(book.W * 0.56, nx));
      appGroup.position.z = Math.max(-book.D * 0.64, Math.min(book.D * 0.64, nz));
    }
    return;
  }
  if (!penDrawing) return;
  const pt = penLocal(e);
  if (pt) { penAddStroke(penLast, pt); penLast = pt; }
});
cv.addEventListener('pointerup', () => {
  penDrawing = false; penLast = null;
  if (dragOn) {
    dragOn = false;
    stage.controls.enabled = !penMode;
    cv.style.cursor = '';
    $('bookHint').textContent = '翻开教材 · 实验装置会从书页上立起来';
  }
});
$('btnPen').addEventListener('click', () => {
  penMode = !penMode;
  stage.controls.enabled = !penMode;
  $('btnPen').classList.toggle('active', penMode);
  $('bookHint').textContent = penMode ? '✏️ 笔模式：直接在书页上划线批注' : '翻开教材 · 实验装置会从书页上立起来';
});
$('btnPenClear').addEventListener('click', () => {
  if (penGroup) { disposeGroup(penGroup); stage.scene.remove(penGroup); penGroup = null; }
});
$('btnPenColor').addEventListener('click', () => {
  penColor = PEN_COLORS[(PEN_COLORS.indexOf(penColor) + 1) % PEN_COLORS.length];
  $('btnPenColor').style.color = penColor;
});

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft') pageTurn(-1);
  if (e.key === 'ArrowRight') pageTurn(1);
});

/* ---------- 初始化 ---------- */
const chips = $('chips');
lessons.forEach((L, i) => {
  const b = document.createElement('button');
  b.className = 'chip';
  b.textContent = i + 1;
  b.title = L.title;
  b.addEventListener('click', () => loadLesson(i));
  chips.appendChild(b);
});

function showLoading(t) { $('loadingText').textContent = t; $('loadingMask').classList.remove('hide'); }
function hideLoading() { $('loadingMask').classList.add('hide'); }

(async () => {
  const q = new URLSearchParams(location.search);
  showLoading('正在打开教材…');
  try {
    pdfDoc = await loadBook(BOOK.url);
    const cc = document.createElement('canvas');
    cc.width = 680; cc.height = 950;
    await renderCover(pdfDoc, BOOK.cover, cc);
    book.setCoverImage(cc);
    $('bookMeta').textContent = `人教版 · ${BOOK.title} · 共 ${pdfDoc.numPages} 页`;
  } catch (err) {
    console.error(err);
    showLoading('教材加载失败：' + err.message + '（请通过本地服务打开，勿双击文件）');
    return;
  }
  const li = Math.max(1, Math.min(lessons.length, parseInt(q.get('lesson') || '1', 10)));
  const lp = parseInt(q.get('page') || '0', 10);
  const startRight = lp || (spreadForLesson(lessons[li - 1].id)?.right ?? 62);
  hideLoading();
  loadLesson(li - 1, startRight);
  if (!q.has('open')) setTimeout(() => book.open(), 900);
})();
tick();
