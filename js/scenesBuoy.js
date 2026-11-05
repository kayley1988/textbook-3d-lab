import * as THREE from 'three';

/* ============================================================
   浮力实验室 · 阿基米德原理
   ——把"浮力来自压力差"和"F浮 = G排"同时可视化
   ============================================================ */

const G0 = 10;                 // g = 10 N/kg（教材口径）
const A = 1.0;                 // 物块边长（场景单位）
const RHO_W = 1.0;             // 水密度（g/cm³ 显示口径）
const DEPTH_MAX = 2.2;         // 缸内水深
const CYL = { w: 5.2, d: 3.2, h: 3.0, x: -0.4 };   // 水缸

const MAT = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .45, ...o });

function box(w, h, d, m) { const x = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); x.castShadow = true; return x; }
function cyl(r, h, m, seg = 24) { const x = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); x.castShadow = true; return x; }

/* 发光力箭头（粗细随力变化） */
function makeArrow(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: .85, roughness: .3,
    transparent: true, opacity: .92,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 14), mat);
  g.add(shaft, head);
  g.userData = { shaft, head, mat };
  return g;
}
function setArrow(a, origin, dir, len, thick = .05) {
  a.visible = len > .04;
  if (!a.visible) return;
  a.position.copy(origin);
  a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  a.userData.shaft.scale.set(thick, Math.max(len - thick * 3, .01), thick);
  a.userData.shaft.position.y = (len - thick * 3) / 2;
  a.userData.head.scale.set(thick * 2.6, thick * 3, thick * 2.6);
  a.userData.head.position.y = len - thick * 1.5;
}

export function sceneBuoyancy(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const GY = 0;

  /* ---------- 玻璃水缸（普通透明 + 亮边框，兼容性最好） ---------- */
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#bfe4ee', metalness: 0, roughness: .05,
    transparent: true, opacity: .16, side: THREE.DoubleSide,
    depthWrite: false,
  });
  const frameMat = MAT('#e8f2f5', { metalness: .3, roughness: .3 });
  const wall = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat);
    m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false;
    m.renderOrder = 5;
    grp.add(m); return m;
  };
  const edge = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    m.position.set(x, y, z); grp.add(m); return m;
  };
  const cx = CYL.x, cw = CYL.w, cd = CYL.d, chh = CYL.h;
  wall(cw, chh, .05, cx, GY + chh / 2, -cd / 2);
  wall(cw, chh, .05, cx, GY + chh / 2, cd / 2);
  wall(.05, chh, cd, cx - cw / 2, GY + chh / 2, 0);
  wall(.05, chh, cd, cx + cw / 2, GY + chh / 2, 0);
  // 亮边框（顶圈 + 竖棱）
  for (const sz of [-cd / 2, cd / 2]) edge(cw + .06, .07, .07, cx, GY + chh, sz);
  for (const sx of [-cw / 2, cw / 2]) for (const sz of [-cd / 2, cd / 2])
    edge(.07, chh, .07, cx + sx, GY + chh / 2, sz);
  const bottom = box(cw, .12, cd, MAT('#dfe7ea', { roughness: .3 }));
  bottom.position.set(cx, GY + .06, 0); bottom.castShadow = false; grp.add(bottom);

  /* ---------- 水体（半透明 + 波动水面） ---------- */
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: '#2f9cc4', transparent: true, opacity: .5,
    roughness: .08, metalness: 0, transmission: .55, ior: 1.33,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry(cw - .16, 1, cd - .16), waterMat);
  grp.add(water);

  const surfGeo = new THREE.PlaneGeometry(cw - .16, cd - .16, 48, 30);
  const surf = new THREE.Mesh(surfGeo, new THREE.MeshPhysicalMaterial({
    color: '#7fd4ea', roughness: .05, metalness: .1, transparent: true, opacity: .55,
    side: THREE.DoubleSide,
  }));
  surf.rotation.x = -Math.PI / 2;
  grp.add(surf);
  const surfBase = surfGeo.attributes.position.array.slice();

  /* ---------- 弹簧测力计（支架 + 弹簧 + 吊块） ---------- */
  const standMat = MAT('#5d564a', { roughness: .55 });
  const pole = cyl(.07, 4.6, standMat); pole.position.set(1.9, GY + 2.3, -0.9); grp.add(pole);
  const arm = box(1.7, .1, .1, standMat); arm.position.set(1.1, GY + 4.5, -0.9); grp.add(arm);
  const knob = cyl(.09, .18, MAT('#c9a35c', { metalness: .8, roughness: .3 }));
  knob.position.set(0.35, GY + 4.44, -0.9); grp.add(knob);

  // 弹簧（螺旋管）：用 TorusGeometry 串
  const springGrp = new THREE.Group();
  springGrp.position.set(0.35, GY + 4.35, -0.9);
  const springMat = MAT('#b8b2a6', { metalness: .9, roughness: .35 });
  const coils = [];
  for (let i = 0; i < 9; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(.14, .028, 10, 22), springMat);
    t.rotation.x = Math.PI / 2;
    springGrp.add(t); coils.push(t);
  }
  grp.add(springGrp);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1, 8), springMat);
  grp.add(wire);

  // 刻度牌
  const scaleCv = document.createElement('canvas'); scaleCv.width = 128; scaleCv.height = 512;
  const scaleTex = new THREE.CanvasTexture(scaleCv); scaleTex.colorSpace = THREE.SRGBColorSpace;
  const scalePlate = new THREE.Mesh(new THREE.PlaneGeometry(.5, 2.0),
    new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true }));
  scalePlate.position.set(-0.32, GY + 3.3, -0.55);
  grp.add(scalePlate);
  function drawScale(fPull, fMax = 5) {
    const g = scaleCv.getContext('2d');
    g.clearRect(0, 0, 128, 512);
    g.fillStyle = 'rgba(252,247,235,.92)';
    g.beginPath(); g.roundRect(4, 4, 120, 504, 14); g.fill();
    g.strokeStyle = '#8a7f68'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#3b3830'; g.font = '600 30px Georgia';
    g.textAlign = 'center';
    g.fillText('N', 64, 52);
    for (let i = 0; i <= 10; i++) {
      const y = 80 + i * 40;
      g.strokeStyle = '#6a6252'; g.lineWidth = i % 2 ? 2 : 4;
      g.beginPath(); g.moveTo(i % 2 ? 62 : 46, y); g.lineTo(92, y); g.stroke();
      if (i % 2 === 0) { g.font = '24px Georgia'; g.fillText(String(i / 2), 108, y + 8); }
    }
    // 指针
    const fy = 80 + Math.min(fPull / fMax, 1) * 400;
    g.fillStyle = '#c2401e';
    g.beginPath(); g.moveTo(24, fy); g.lineTo(58, fy - 12); g.lineTo(58, fy + 12); g.closePath(); g.fill();
    scaleTex.needsUpdate = true;
  }
  drawScale(4);

  /* ---------- 被吊物块 ---------- */
  const blockGrp = new THREE.Group();
  grp.add(blockGrp);
  const blockMat = MAT('#c8ccd2', { metalness: .45, roughness: .45 });
  const block = box(A, A, A, blockMat);
  block.position.y = -A / 2;
  blockGrp.add(block);
  // 块上吊环
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.09, .025, 8, 18), springMat);
  ring.position.y = .04; blockGrp.add(ring);

  /* ---------- 溢水槽 + 小桶（阿基米德） ---------- */
  const spoutX = cx + cw / 2;
  const spout = box(.5, .16, .9, MAT('#cfd8dc', { roughness: .3 }));
  spout.position.set(spoutX + .18, GY + DEPTH_MAX + .06, 0);
  grp.add(spout);

  const bucketGrp = new THREE.Group();
  bucketGrp.position.set(spoutX + 1.55, GY, .35);
  grp.add(bucketGrp);
  const bucket = cyl(.62, 1.05, MAT('#a67c52', { roughness: .6 }), 26);
  bucket.position.y = .52; bucketGrp.add(bucket);
  // 桶内水面
  const bucketWater = cyl(.55, .02, new THREE.MeshPhysicalMaterial({
    color: '#5ec4de', transparent: true, opacity: .6, roughness: .1,
  }), 26);
  bucketWater.position.y = .62; bucketGrp.add(bucketWater);
  const bucketWaterBase = bucketWater.scale.y;

  /* ---------- 气泡粒子 ---------- */
  const BUB_N = 60;
  const bubGeo = new THREE.SphereGeometry(.035, 8, 8);
  const bubMat = new THREE.MeshPhysicalMaterial({
    color: '#dff6ff', transparent: true, opacity: .75, roughness: .05,
  });
  const bubbles = [];
  for (let i = 0; i < BUB_N; i++) {
    const b = new THREE.Mesh(bubGeo, bubMat);
    b.visible = false;
    b.userData = { life: 0, vx: 0, z: 0 };
    grp.add(b); bubbles.push(b);
  }
  let bubTimer = 0;

  /* ---------- 溢流粒子（排开的水流向桶） ---------- */
  const FLOW_N = 26;
  const flowGeo = new THREE.CapsuleGeometry(.035, .12, 4, 8);
  const flowMat = new THREE.MeshPhysicalMaterial({
    color: '#66c9e4', transparent: true, opacity: .8, roughness: .05,
  });
  const flows = [];
  for (let i = 0; i < FLOW_N; i++) {
    const f = new THREE.Mesh(flowGeo, flowMat);
    f.visible = false;
    f.userData = { t: Math.random() };
    grp.add(f); flows.push(f);
  }

  /* ---------- 压力箭头组 ---------- */
  const arrUp = makeArrow('#26c6a8');     // 下表面向上（主角）
  const arrDown = makeArrow('#4a7fd6');   // 上表面向下
  const arrSideL = makeArrow('#9aa7b8');
  const arrSideR = makeArrow('#9aa7b8');
  grp.add(arrUp, arrDown, arrSideL, arrSideR);
  const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);

  /* ---------- 溢出的水杯历史水位 ---------- */
  let displaced = 0;          // 已排入桶的水量（显示口径 N）
  let sinkT = 0;              // 漂浮摇晃时间

  /* ---------- 标签 ---------- */
  const lab = {
    pull: addLabel('测力计示数', new THREE.Object3D(), { dy: -70 }),
    buo: addLabel('浮力', new THREE.Object3D(), { dy: -46 }),
    disp: addLabel('排开的水', new THREE.Object3D(), { dy: -46 }),
    state: addLabel('', new THREE.Object3D(), { dy: 26 }),
  };
  grp.add(lab.state.anchor);

  /* ============================================================ */
  function submergeH(p) {
    // 浸入深度（米）0→A，受漂浮约束
    let h = Math.max(0, Math.min(1, p.depth)) * A;
    const floatLimit = (p.rhoO / p.rhoL) * A;   // 漂浮浸深
    const floating = p.rhoO <= p.rhoL + 1e-6;
    if (floating) {
      if (p.depth >= 1 || h > floatLimit) h = floatLimit;   // 自动浮起
    }
    return { h, floating };
  }

  function update(dt, p) {
    const { h, floating } = submergeH(p);
    const rhoL = p.rhoL, rhoO = p.rhoO;

    // 物理量（显示口径）
    const Vsub = (h / A);                        // 浸入体积比例
    const Fbuo = rhoL * Vsub * 4;                // 浸没时 4N（ρ物=1 时 G=4N 基准）
    const Gobj = rhoO * 4;
    const Fpull = floating ? 0 : Math.max(0, Gobj - Fbuo);
    const submerged = h > 0.001;

    // 物块位置：吊在弹簧下，随浸深下降；漂浮时停在水面（块底 = 水面 − h）
    const bt = floating ? (GY + waterLevelY() - h) + A : 3.35 - h * 1.15;
    blockGrp.position.y += (bt - blockGrp.position.y) * Math.min(1, dt * 6);
    blockGrp.position.x = 0.35;
    if (floating) {
      sinkT += dt;
      blockGrp.position.z = -0.9 + Math.sin(sinkT * 2.2) * .02;
      blockGrp.rotation.z = Math.sin(sinkT * 1.7) * .015;
    } else {
      blockGrp.position.z += (-0.9 - blockGrp.position.z) * Math.min(1, dt * 4);
      blockGrp.rotation.z *= .9;
    }

    // 材质随密度换色（铁灰→铝白→蜡米→木棕）
    const c = rhoO > 5 ? '#9aa7b5' : rhoO > 2 ? '#d7dce2' : rhoO > .8 ? '#f0e2bd' : '#c99a68';
    if (blockMat.color.getHexString() !== c.replace('#', '')) blockMat.color.set(c);

    // 水位（缸内略降表示水被排走？视觉保持，改用桶水位上升）
    const wy = GY + DEPTH_MAX;
    water.position.set(cx, GY + DEPTH_MAX / 2, 0);
    water.scale.y = DEPTH_MAX;
    surf.position.y = wy;

    // 水面波动
    const pos = surfGeo.attributes.position;
    const t = performance.now() / 1000;
    for (let i = 0; i < pos.count; i++) {
      const bx = surfBase[i * 3], by = surfBase[i * 3 + 1];
      const wave = Math.sin(bx * 2.1 + t * 2.2) * .028 + Math.sin(by * 2.8 - t * 1.7) * .022;
      // 物块周围涟漪
      const wx = bx + cx, wz = by;
      const dx = wx - blockGrp.position.x, dz = wz - blockGrp.position.z;
      const d2 = dx * dx + dz * dz;
      const ripple = submerged ? Math.sin(d2 * 14 - t * 6) * .04 * Math.exp(-d2 * 1.1) : 0;
      pos.setZ(i, wave + ripple);
    }
    pos.needsUpdate = true;
    surfGeo.computeVertexNormals();

    // 弹簧：F拉 越小越缩；吊线连接弹簧底与块顶吊环
    const springLen = .55 + (Fpull / 5) * 1.15;
    coils.forEach((c2, i) => { c2.position.y = -(i / 8) * springLen; });
    const wireTop = GY + 4.35 - springLen;
    const wireBot = blockGrp.position.y + .08;
    wire.position.set(0.35, (wireTop + wireBot) / 2, -0.9);
    wire.scale.y = Math.max(wireTop - wireBot, .02);
    drawScale(Fpull);

    // ---------- 压力箭头 ----------
    const showA = p.arrows && submerged;
    const bx0 = blockGrp.position.x, bz = blockGrp.position.z;
    const bTop = blockGrp.position.y, bBot = blockGrp.position.y - A;
    const depthTop = Math.max(0, wy - bTop);
    const depthBot = Math.max(0, wy - bBot);
    const pAt = d => rhoL * G0 * d * .028;      // 压强→箭头长度系数
    setArrow(arrUp, new THREE.Vector3(bx0, bBot - .01, bz), UP, showA ? pAt(depthBot) : 0, .07);
    setArrow(arrDown, new THREE.Vector3(bx0, bTop + .01, bz), DOWN, showA && depthTop > .05 ? pAt(depthTop) : 0, .05);
    setArrow(arrSideL, new THREE.Vector3(bx0 - A / 2 - .01, Math.max(bBot, wy - depthBot / 2), bz),
      new THREE.Vector3(1, 0, 0), showA ? pAt((depthBot + depthTop) / 2) * .7 : 0, .035);
    setArrow(arrSideR, new THREE.Vector3(bx0 + A / 2 + .01, Math.max(bBot, wy - depthBot / 2), bz),
      new THREE.Vector3(-1, 0, 0), showA ? pAt((depthBot + depthTop) / 2) * .7 : 0, .035);

    // ---------- 气泡 ----------
    bubTimer -= dt;
    if (submerged && h < A && bubTimer <= 0) {
      bubTimer = .12;
      const b = bubbles.find(x => !x.visible);
      if (b) {
        b.visible = true;
        b.position.set(bx0 + (Math.random() - .5) * A * .8, bBot + Math.random() * .2, bz + (Math.random() - .5) * A * .7);
        b.userData.life = 1.6 + Math.random();
        b.userData.vx = 0;
      }
    }
    for (const b of bubbles) {
      if (!b.visible) continue;
      b.userData.life -= dt;
      b.position.y += dt * .75;
      b.position.x += Math.sin(b.position.y * 9 + b.userData.z) * dt * .12;
      b.scale.setScalar(.6 + (1.6 - Math.max(0, b.userData.life)) * .4);
      if (b.userData.life <= 0 || b.position.y > wy) b.visible = false;
    }

    // ---------- 排开水：溢流 + 桶水位 ----------
    const target = Fbuo;                         // G排 = F浮（阿基米德）
    displaced += (target - displaced) * Math.min(1, dt * 1.2);
    bucketWater.scale.y = bucketWaterBase + displaced * .16;
    bucketWater.position.y = .62 + displaced * .08;

    const flowing = submerged && Math.abs(target - displaced) > .06;
    for (const f of flows) {
      if (!flowing) { f.visible = false; continue; }
      f.visible = true;
      f.userData.t += dt * 1.6;
      if (f.userData.t > 1) f.userData.t -= 1;
      const k = f.userData.t;
      const sx = spoutX + .42, sy = GY + DEPTH_MAX + .1, sxz = 0;
      const ex = bucketGrp.position.x, ey = bucketWater.position.y + .35, ez = bucketGrp.position.z;
      // 抛物线
      f.position.set(
        sx + (ex - sx) * k,
        sy + (ey - sy) * k - 1.1 * k * (1 - k),
        sxz + (ez - sxz) * k);
      f.scale.y = 1.6;
    }

    // ---------- 标签 ----------
    lab.pull.el.textContent = `F拉 = ${Fpull.toFixed(2)} N`;
    lab.pull.anchor.position.set(-1.1, GY + 1.0, -0.9);
    lab.buo.el.textContent = `F浮 = ${Fbuo.toFixed(2)} N`;
    lab.buo.anchor.position.set(bx0 + 1.15, Math.min(bTop, wy) + .5, bz);
    lab.disp.el.textContent = `G排 = ${displaced.toFixed(2)} N`;
    lab.disp.anchor.position.set(bucketGrp.position.x, bucketGrp.position.y + 1.5, bucketGrp.position.z);
    const st = h <= 0.001 ? '未浸入 · F浮 = 0'
      : floating ? (rhoO < rhoL - .01 ? `漂浮 · 浸入 ${Math.round(h / A * 100)}%` : '悬浮')
      : h < A ? `部分浸入 · 缓慢下沉` : `浸没 · ρ物(${rhoO.toFixed(1)}) > ρ液(${rhoL.toFixed(1)}) 下沉`;
    lab.state.el.textContent = st;
    lab.state.anchor.position.set(cx, GY + .12, cd / 2 + .55);
  }

  function waterLevelY() { return DEPTH_MAX; }

  return {
    update,
    reset(p) { displaced = 0; sinkT = 0; },
    dispose() { scene.remove(grp); },
    energy(p) {
      const { h, floating } = submergeH(p);
      const Fbuo = p.rhoL * (h / A) * 4;
      const Gobj = p.rhoO * 4;
      const Fpull = floating ? 0 : Math.max(0, Gobj - Fbuo);
      return [
        { label: '物块重力 G', value: Gobj, color: '#8a5a3a', unit: 'N' },
        { label: '弹簧读数 F拉', value: Fpull, color: '#c2401e', unit: 'N' },
        { label: '浮力 F浮', value: Fbuo, color: '#26c6a8', unit: 'N' },
        { label: '排开水重 G排', value: Fbuo, color: '#3fa8c8', unit: 'N' },
      ];
    },
    readouts(p) {
      const { h, floating } = submergeH(p);
      const Fbuo = p.rhoL * (h / A) * 4;
      const Gobj = p.rhoO * 4;
      const Fpull = floating ? 0 : Math.max(0, Gobj - Fbuo);
      return [
        { label: '物块重力 G', val: Gobj.toFixed(2), unit: 'N' },
        { label: '测力计示数 F拉', val: Fpull.toFixed(2), unit: 'N' },
        { label: '浮力 F浮 = G − F拉', val: Fbuo.toFixed(2), unit: 'N' },
        { label: '排开水重 G排', val: Fbuo.toFixed(2), unit: 'N' },
        { label: 'V排 / V物', val: Math.round(h / A * 100), unit: '%' },
      ];
    },
  };
}
