import * as THREE from 'three';
import { M, box, cyl, sph, dashedLine, solidLine, makeFlow, glowTube, ECOL } from './stage.js';

const G = 10;          // 重力加速度取 10，方便心算
const GY = 0.18;       // 书页表面高度

/* ============ L1 认识能量：六种形式画廊 ============ */
export function sceneIntro(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const t0 = performance.now() / 1000;

  const names = ['动能', '重力势能', '弹性势能', '内能', '电能', '光能'];
  const subs = ['运动中', '被举高', '形变中', '热着呢', '电流做功', '正在发光'];
  const cols = [ECOL.KE, ECOL.PE, ECOL.EPE, ECOL.Q, ECOL.E, ECOL.LIGHT];
  const objs = [];
  const R = 3.1;

  // 虚线环：暗示"能量在形式间转圈"
  const ringPts = [];
  for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2; ringPts.push([Math.cos(a) * R, GY + 0.02, Math.sin(a) * R]); }
  const ring = dashedLine(ringPts, '#a89a7d', 0.22, 0.16);
  grp.add(ring);

  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    const ped = cyl(0.5, 0.62, 0.16, M('#3f3b32', { rough: 0.5, metal: 0.2 }));
    ped.position.set(x, GY + 0.08, z); ped.castShadow = true; grp.add(ped);
    const holder = new THREE.Group(); holder.position.set(x, GY + 0.16, z); grp.add(holder);
    objs.push(holder);
    const lab = addLabel(names[i], holder, { dy: -95, sub: subs[i] });
    lab.el.style.color = cols[i];
  }

  // 各形式的小装置
  const cart = new THREE.Group();
  const body = box(0.55, 0.28, 0.34, M(cols[0], { rough: 0.4 }));
  body.position.y = 0.24; cart.add(body);
  for (const dx of [-0.18, 0.18]) for (const dz of [-0.16, 0.16]) {
    const w = cyl(0.09, 0.09, 0.05, M('#2b2a26')); w.rotation.x = Math.PI / 2;
    w.position.set(dx, 0.09, dz); cart.add(w);
  }
  const rail = box(1.7, 0.04, 0.1, M('#8a8272')); rail.position.y = 0.02; objs[0].add(rail);
  objs[0].add(cart);

  const ball = sph(0.3, M(cols[1], { rough: 0.35 })); ball.castShadow = true;
  const drop = dashedLine([[0, 0.1, 0], [0, 1.5, 0]], '#8a8272');
  objs[1].add(ball, drop); ball.position.y = 1.55;

  const springGrp = new THREE.Group();
  const hpts = [];
  for (let i = 0; i <= 140; i++) { const t = i / 140; hpts.push(new THREE.Vector3(t * 0.9, 0.2 + Math.sin(t * Math.PI * 7) * 0.17, Math.cos(t * Math.PI * 7) * 0.17)); }
  const helix = new THREE.CatmullRomCurve3(hpts);
  const coil = new THREE.Mesh(new THREE.TubeGeometry(helix, 160, 0.035, 8), M(cols[2], { metal: 0.5, rough: 0.35 }));
  const plate = box(0.06, 0.42, 0.42, M('#3f3b32')); plate.position.set(0.95, 0.2, 0);
  springGrp.add(coil, plate); objs[2].add(springGrp);

  const mug = cyl(0.26, 0.22, 0.4, M('#fdf6ea', { rough: 0.7 })); mug.position.y = 0.2;
  const tea = cyl(0.22, 0.22, 0.03, M(cols[3])); tea.position.y = 0.38;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 10, 24), M('#fdf6ea', { rough: 0.7 }));
  handle.position.set(0.3, 0.2, 0);
  const steam = [];
  for (let i = 0; i < 5; i++) {
    const s = sph(0.05, M('#ffffff', { opacity: 0.5, emissive: '#fff', ei: 0.4 }));
    s.userData.ph = i / 5; objs[3].add(s); steam.push(s);
  }
  objs[3].add(mug, tea, handle);

  const batt = cyl(0.2, 0.2, 0.5, M(cols[4], { rough: 0.4, metal: 0.3 }));
  batt.rotation.z = Math.PI / 2; batt.position.y = 0.22;
  const cap = cyl(0.09, 0.09, 0.1, M('#d9b23a', { metal: 0.8, rough: 0.3 }));
  cap.rotation.z = Math.PI / 2; cap.position.set(0.3, 0.22, 0);
  const spark = sph(0.09, M('#ffffff', { emissive: cols[4], ei: 2.5 })); spark.position.set(-0.3, 0.55, 0);
  objs[4].add(batt, cap, spark);

  const bulb = sph(0.26, M('#fff6d8', { emissive: cols[5], ei: 1.6, opacity: 0.95 })); bulb.position.y = 0.6;
  const base = cyl(0.1, 0.12, 0.3, M('#3f3b32', { metal: 0.4 })); base.position.y = 0.28;
  const plight = new THREE.PointLight(0xe3b93c, 3, 4); plight.position.set(0, 0.7, 0);
  objs[5].add(bulb, base, plight);

  const anchors = objs;

  return {
    update(dt, p) {
      const t = performance.now() / 1000 - t0;
      // 动能小车往返
      cart.position.x = Math.sin(t * 1.6) * 0.55;
      // 势能小球浮动
      ball.position.y = 1.55 + Math.sin(t * 1.2) * 0.06;
      // 弹簧压缩循环
      const c = (Math.sin(t * 1.3) * 0.5 + 0.5);
      springGrp.scale.x = 0.55 + 0.45 * c;
      // 蒸汽上升
      steam.forEach((s, i) => {
        const ph = (t * 0.35 + s.userData.ph) % 1;
        s.position.set(Math.sin(ph * 9 + i) * 0.08, 0.45 + ph * 0.7, 0);
        s.material.opacity = 0.5 * (1 - ph);
      });
      spark.material.emissiveIntensity = 2 + Math.sin(t * 8) * 1.5;
      plight.intensity = 2.4 + Math.sin(t * 5) * 1.2;
      bulb.material.emissiveIntensity = 1.4 + Math.sin(t * 5) * 0.5;
    },
    reset() {},
    energy: () => null,
    readouts: () => [],
    dispose() { scene.remove(grp); },
  };
}

/* ============ L2 动能 ============ */
export function sceneKinetic(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const M2 = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .45, ...o });
  const bx = (w, h, d, m) => { const x = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); x.castShadow = true; return x; };

  /* ---------- 教材图 11.3-2：斜面 + 小球 + 木块 + 刻度尺 ---------- */
  const PLANE_Y = 0;
  const rampLen = 2.1;
  const wood = M2('#a67c52', { roughness: .65 });
  // 斜面（楔形，用旋转薄板 + 侧挡）
  const rampGrp = new THREE.Group();
  rampGrp.position.set(-2.1, PLANE_Y, 0);
  grp.add(rampGrp);
  const rampBoard = bx(rampLen, .09, 1.3, M2('#b98d5e', { roughness: .6 }));
  rampBoard.position.y = .045;
  rampGrp.add(rampBoard);
  // 楔形支撑（三角形棱柱，随高度缩放）
  const triShape = new THREE.Shape();
  triShape.moveTo(0, 0); triShape.lineTo(-rampLen, 0); triShape.lineTo(-rampLen, 1); triShape.closePath();
  const wedge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(triShape, { depth: 1.3, bevelEnabled: false }),
    M2('#9c7448', { roughness: .6 }));
  wedge.position.set(0, 0, -.65);
  wedge.castShadow = true;
  rampGrp.add(wedge);
  // 水平面（带木纹色）
  const plane = bx(7.4, .1, 1.4, wood);
  plane.position.set(.9, PLANE_Y - .05, 0);
  plane.receiveShadow = true;
  grp.add(plane);

  // 刻度尺（canvas 纹理）
  const rc = document.createElement('canvas'); rc.width = 1024; rc.height = 96;
  const rg = rc.getContext('2d');
  rg.fillStyle = '#f7f0dd'; rg.fillRect(0, 0, 1024, 96);
  rg.strokeStyle = '#5d564a'; rg.lineWidth = 6; rg.strokeRect(3, 3, 1018, 90);
  rg.fillStyle = '#5d564a'; rg.font = '600 34px Georgia'; rg.textAlign = 'center';
  for (let i = 0; i <= 12; i++) {
    const x = 40 + i * 79;
    rg.fillRect(x - 2, i % 2 ? 48 : 30, 4, i % 2 ? 30 : 48);
    if (i % 2 === 0) rg.fillText(String(i / 2), x, 26);
  }
  rg.font = 'italic 30px Georgia'; rg.fillText('s / dm', 950, 88);
  const rulerTex = new THREE.CanvasTexture(rc); rulerTex.colorSpace = THREE.SRGBColorSpace;
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(5.0, .46), new THREE.MeshBasicMaterial({ map: rulerTex }));
  ruler.rotation.x = -Math.PI / 2;
  ruler.position.set(1.3, PLANE_Y + .012, .78);
  grp.add(ruler);

  // 木块（被撞物）
  const block = bx(.62, .45, .6, M2('#c9a35c', { roughness: .5 }));
  block.position.set(.35, PLANE_Y + .28, 0);
  grp.add(block);
  const blockStart = .35;

  // 小球
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.24, 24, 18),
    new THREE.MeshStandardMaterial({ color: ECOL.KE, roughness: .3, emissive: '#7a2408', emissiveIntensity: .25 }));
  ball.castShadow = true;
  grp.add(ball);

  // 速度尾巴（运动感）
  const tailMat = new THREE.MeshBasicMaterial({ color: ECOL.KE, transparent: true, opacity: .3 });
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .5, 4, 10), tailMat);
  tail.rotation.z = Math.PI / 2;
  tail.visible = false;
  grp.add(tail);

  // 幽灵块（上次结果对照）
  const ghost = bx(.62, .45, .6, new THREE.MeshBasicMaterial({ color: '#9db6c4', transparent: true, opacity: .38 }));
  ghost.visible = false;
  grp.add(ghost);
  const ghostLine = dashedLine([[0, PLANE_Y + .02, 0], [0, PLANE_Y + .02, 0]], '#8fb2c9');
  grp.add(ghostLine);

  /* ---------- 三步推理链标签 ---------- */
  const lab1 = addLabel('', new THREE.Object3D(), { dy: -46 });   // 步骤①
  const lab2 = addLabel('', new THREE.Object3D(), { dy: -46 });   // 步骤②
  const lab3 = addLabel('', new THREE.Object3D(), { dy: -52 });   // 步骤③
  grp.add(lab1.anchor, lab2.anchor, lab3.anchor);
  lab1.el.style.cssText += ';background:rgba(38,166,138,.92);color:#fff';
  lab2.el.style.cssText += ';background:rgba(194,64,30,.92);color:#fff';
  lab3.el.style.cssText += ';background:rgba(63,81,140,.94);color:#fff;font-size:13px';

  /* ---------- 状态机 ---------- */
  // idle → roll(斜面) → flat → hit(块滑动) → done
  let phase = 'idle', t = 0, vNow = 0, sDist = 0;
  let lastRun = null;   // { h0, m, s }

  const sceneH = p => .35 + p.h0 * 1.25;          // 释放高度（场景单位）
  const vEnd = p => Math.sqrt(2 * 10 * sceneH(p) * .5);  // 到底速度（演示口径）
  const sOf = (p, v2) => .09 * p.m * v2;          // 滑距 = k·Ek（演示口径）
  const rampAngle = () => Math.atan2(sceneH({ h0: 1 }), rampLen);

  function layout(p) {
    const H = sceneH(p);
    rampGrp.rotation.z = 0;
    rampGrp.position.y = PLANE_Y;
    // 楔形斜面：板绕 z 转角，使顶端高度 = H
    const ang = Math.atan2(H, rampLen);
    rampBoard.rotation.z = -ang;
    rampBoard.position.set(-rampLen / 2 * Math.cos(ang), H / 2 + .05, 0);
    wedge.scale.y = H;
    return ang;
  }

  function placeBallRamp(p, k) {  // k: 0(左上高端)→1(右下低端)
    const H = sceneH(p), ang = rampAngle();
    const len = Math.sqrt(H * H + rampLen * rampLen);
    const d = len * (1 - k);              // 距高端的弧长
    const topX = rampGrp.position.x - rampLen * Math.cos(ang);
    ball.position.set(
      topX + d * Math.cos(ang),
      PLANE_Y + H - d * Math.sin(ang) + .26 * Math.cos(ang),
      0);
    ball.rotation.z -= (vNow * .012);
    tail.visible = true;
    tail.position.copy(ball.position);
    tail.quaternion.copy(ball.quaternion);
    tail.rotation.set(0, 0, -Math.atan2(Math.sin(ang) * vNow, Math.cos(ang) * vNow));
    tail.scale.setScalar(.7 + vNow * .1);
  }

  return {
    update(dt, p) {
      layout(p);
      const v2 = vEnd(p) ** 2;
      const sMax = sOf(p, v2);
      const hitX = blockStart + .31 + .24;   // 球心接触块面

      if (phase === 'idle') {
        placeBallRamp(p, 0);
        vNow = 0; tail.visible = false;
        lab1.el.textContent = '① 松手：高度 h 决定到底速度';
        lab1.anchor.position.set(-2.0, sceneH(p) + .8, 0);
        lab2.el.textContent = '② 小球撞击木块，克服摩擦做功';
        lab2.anchor.position.set(.35, 1.3, 0);
        lab3.el.textContent = '▶ 点"开始"滚动小球';
        lab3.anchor.position.set(1.3, PLANE_Y + .55, .78);
        lab1.el.style.opacity = .55; lab2.el.style.opacity = .55; lab3.el.style.opacity = .95;
      }
      else if (phase === 'roll') {
        t += dt;
        const H = sceneH(p), ang = rampAngle();
        const len = Math.sqrt(H * H + rampLen * rampLen);
        const acc = 10 * Math.sin(ang) * .55;      // 演示加速度
        const d = Math.min(.5 * acc * t * t, len);
        const k = d / len;
        placeBallRamp(p, k);
        vNow = Math.sqrt(2 * acc * d);
        lab1.el.textContent = `① h = ${p.h0.toFixed(2)} m → v = ${vNow.toFixed(1)} m/s　(mgh → ½mv²)`;
        lab1.el.style.opacity = 1; lab3.el.style.opacity = .3;
        lab1.anchor.position.set(-2.0, sceneH(p) + .8, 0);
        if (d >= len - 1e-3) { phase = 'flat'; t = 0; }
      }
      else if (phase === 'flat') {
        t += dt;
        vNow = vEnd(p);
        ball.position.x += vNow * dt;
        ball.position.y = PLANE_Y + .24;
        ball.rotation.z -= vNow * dt / .24;
        tail.position.copy(ball.position); tail.rotation.set(0, 0, 0); tail.scale.setScalar(.7 + vNow * .1);
        if (ball.position.x >= hitX) { phase = 'hit'; t = 0; vNow = 0; sDist = 0; }
      }
      else if (phase === 'hit') {
        t += dt;
        // 块被推出：先快后慢（摩擦减速）
        const dec = 4.2;
        const vB = Math.max(0, sMax * dec * Math.exp(-dec * t) - 0);
        const sInst = sMax * (1 - Math.exp(-dec * t) * (1 + dec * t));
        const disp = Math.min(sInst, sMax);
        block.position.x = blockStart + disp;
        ball.position.x = Math.max(hitX, block.position.x - .55);
        ball.position.y = PLANE_Y + .24;
        sDist = disp;
        lab2.el.textContent = `② 推力做功 W = f·s　木块被推出 s = ${disp.toFixed(2)} dm`;
        lab2.el.style.opacity = 1;
        lab2.anchor.position.set(block.position.x, 1.25, 0);
        lab3.el.textContent = `③ s = ${(disp).toFixed(2)} dm　③ s 越大 ⇒ 动能越大`;
        lab3.anchor.position.set(1.3, PLANE_Y + .55, .78);
        if (t > .45 && vB <= 0.01 && disp >= sMax - 1e-3) { phase = 'done'; t = 0; lastRun = { h0: p.h0, m: p.m, s: sMax }; }
      }
      else if (phase === 'done') {
        lab2.el.textContent = `② W = f·s = ${(.5 * p.m * v2 / 10).toFixed(1)} J　s = ${sDist.toFixed(2)} dm`;
        lab3.el.textContent = `③ 结论：s ∝ m·v²　⇒　Ek = ½mv²　（Ek = ${(0.5 * p.m * v2).toFixed(1)} J）`;
        lab3.el.style.opacity = 1;
        if (lastRun && (lastRun.h0 !== p.h0 || lastRun.m !== p.m)) {
          ghost.visible = true;
          ghost.position.x = lastRun.s + .35 + .31;
          ghost.position.y = block.position.y;
          ghostLine.geometry.dispose?.();
        }
      }
      // 幽灵标注
      if (ghost.visible) {
        ghostLine.scale.x = 1;
      }
    },
    start(p) {
      phase = 'roll'; t = 0; vNow = 0;
      if (lastRun && lastRun.s > 0 && (lastRun.h0 !== p.h0 || lastRun.m !== p.m)) {
        ghost.visible = true;
        ghost.position.set(lastRun.s + .35 + .31, PLANE_Y + .28, 0);
      } else ghost.visible = false;
    },
    reset(p) {
      phase = 'idle'; t = 0; vNow = 0;
      block.position.x = blockStart;
      ghost.visible = false;
      placeBallRamp(p, 0);
      tail.visible = false;
      // 把上一轮结果固化成幽灵
      if (lastRun && lastRun.s > 0) {
        ghost.visible = true;
        ghost.position.x = lastRun.s + .35 + .31;
        ghost.position.y = PLANE_Y + .28;
      }
    },
    onDone(p) {
      // 一次运行结束（done → 下次 start 前）记录幽灵
      lastRun = { h0: p.h0, m: p.m, s: sDist };
    },
    isPlaying() { return phase === 'roll' || phase === 'flat' || phase === 'hit'; },
    setGhostFrom(p) { lastRun = { h0: p.h0, m: p.m, s: sDist }; },
    get phase() { return phase; },
    markDone() { if (phase === 'done') return true; return false; },
    energy(p) {
      const v2 = vEnd(p) ** 2;
      return [
        { label: '小球动能 ½mv²', value: .5 * p.m * v2, color: ECOL.KE, unit: 'J' },
        { label: '对木块做功 f·s', value: .5 * p.m * v2 * .98, color: '#c2401e', unit: 'J' },
      ];
    },
    readouts(p) {
      const v = phase === 'idle' ? vEnd(p) : vNow;
      const v2 = vEnd(p) ** 2;
      return [
        { label: '释放高度 h', val: p.h0.toFixed(2), unit: 'm' },
        { label: '到底速度 v', val: v.toFixed(1), unit: 'm/s' },
        { label: '木块滑距 s', val: (phase === 'hit' || phase === 'done' ? sDist : 0).toFixed(2), unit: 'dm' },
        { label: '动能 ½mv²', val: (0.5 * p.m * v2).toFixed(1), unit: 'J' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ L3 重力势能（落塔） ============ */
export function sceneGPE(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const HMAX = 9.6;

  // 标尺
  const ruler = box(0.1, HMAX, 0.24, M('#cfc4a8', { rough: 0.9 }));
  ruler.position.set(-2.4, GY + HMAX / 2, 0); grp.add(ruler);
  for (let h = 0; h <= 9; h += 3) {
    const tick = box(0.34, 0.035, 0.26, M('#3f3b32'));
    tick.position.set(-2.4, GY + h + 0.3, 0); grp.add(tick);
    const anchor = new THREE.Object3D(); anchor.position.set(-2.85, GY + h + 0.34, 0); grp.add(anchor);
    addLabel(h + ' m', anchor, { dy: -8 });
  }
  // 起始平台
  const plat = box(1.5, 0.12, 1.5, M('#8a8272', { rough: 0.7 }));
  grp.add(plat);
  const ball = sph(0.34, M(ECOL.KE, { rough: 0.3, emissive: '#ff5a1a', ei: 0.15 }));
  ball.castShadow = true; grp.add(ball);
  const lab = addLabel('小球', ball, { dy: -46 });

  // 影子ghost 轨迹池
  const ghosts = [];
  for (let i = 0; i < 16; i++) {
    const g = sph(0.3, M(ECOL.PE, { opacity: 0 }));
    g.visible = false; grp.add(g); ghosts.push({ m: g, life: 0 });
  }
  // 落地涟漪
  const puff = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 40), M('#d96f1e', { emissive: '#ff7a1a', ei: 1.5, opacity: 0 }));
  puff.rotation.x = Math.PI / 2; puff.position.y = GY + 0.06; grp.add(puff);

  const st = { phase: 'ready', t: 0, h0: 6, trailT: 0 };
  function place(p) {
    plat.position.y = GY + p.h + 0.06;
    ball.position.set(0, GY + p.h + 0.4, 0);
    st.h0 = p.h;
  }
  place({ h: 6 });

  return {
    update(dt, p) {
      st.t += dt;
      if (st.phase === 'ready') { place(p); return; }
      if (st.phase === 'fall') {
        const y = p.h - 0.5 * G * st.t * st.t;
        if (y <= 0.4) {
          st.phase = 'puff'; st.t = 0;
          ball.position.y = GY + 0.4;
        } else {
          ball.position.y = GY + y + 0.4;
          st.trailT += dt;
          if (st.trailT > 0.085) {
            st.trailT = 0;
            const g = ghosts.find(g => !g.m.visible) || ghosts[0];
            g.m.visible = true; g.m.material.opacity = 0.3; g.life = 0;
            g.m.position.copy(ball.position);
          }
        }
      } else if (st.phase === 'puff') {
        const k = st.t / 0.55;
        puff.scale.setScalar(0.4 + k * 3.2);
        puff.material.opacity = 0.75 * (1 - k);
        if (k >= 1) { st.phase = 'rearm'; st.t = 0; puff.material.opacity = 0; }
      } else if (st.phase === 'rearm' && st.t > 0.5) {
        st.phase = 'ready'; st.t = 0;
        ghosts.forEach(g => { g.m.visible = false; });
      }
      ghosts.forEach(g => {
        if (!g.m.visible) return;
        g.life += dt;
        g.m.material.opacity = Math.max(0, 0.3 * (1 - g.life / 0.9));
        if (g.life > 0.9) g.m.visible = false;
      });
      lab.el.style.display = st.phase === 'ready' ? '' : 'none';
    },
    reset(p) { st.phase = 'ready'; st.t = 0; place(p); ghosts.forEach(g => g.m.visible = false); },
    isPlaying: st => st.phase !== 'ready' && st.phase !== 'rearm',
    energy(p) {
      const y = ball.position.y - GY - 0.4;
      const pe = p.m * G * Math.max(0, y);
      const v = st.phase === 'fall' ? G * st.t : 0;
      const ke = 0.5 * p.m * v * v;
      return [
        { label: '重力势能', value: pe, color: ECOL.PE },
        { label: '动能', value: ke, color: ECOL.KE },
      ];
    },
    readouts(p) {
      const y = Math.max(0, ball.position.y - GY - 0.4);
      const v = st.phase === 'fall' ? G * st.t : 0;
      return [
        { label: '当前高度', val: y.toFixed(1), unit: 'm' },
        { label: '当前速度', val: v.toFixed(1), unit: 'm/s' },
        { label: '落地速度（理论）', val: Math.sqrt(2 * G * p.h).toFixed(1), unit: 'm/s' },
        { label: '总机械能', val: (p.m * G * p.h).toFixed(0), unit: 'J' },
      ];
    },
    start() { if (st.phase === 'ready') { st.phase = 'fall'; st.t = 0; } },
    dispose() { scene.remove(grp); },
  };
}

/* ============ L4 弹性势能（弹簧炮） ============ */
export function sceneSpring(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const LN = 1.1, ANCHOR = -2.9, TRACK_END = 4.4, MU = 0.18;

  const wall = box(0.35, 1.5, 1.7, M('#3f3b32', { rough: 0.5 }));
  wall.position.set(ANCHOR - 0.25, GY + 0.75, 0); grp.add(wall);
  const track = box(8.4, 0.13, 1.6, M('#4a463c', { rough: 0.55 }));
  track.position.set(0.6, GY + 0.065, 0); track.receiveShadow = true; grp.add(track);

  // 弹簧（自然长度 LN，沿 +x）
  const sgrp = new THREE.Group(); sgrp.position.set(ANCHOR, GY + 0.42, 0); grp.add(sgrp);
  const hpts = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    hpts.push(new THREE.Vector3(t * LN, Math.sin(t * Math.PI * 8) * 0.19, Math.cos(t * Math.PI * 8) * 0.19));
  }
  const helix = new THREE.CatmullRomCurve3(hpts);
  const coilMesh = new THREE.Mesh(new THREE.TubeGeometry(helix, 200, 0.04, 8), M('#b0b6c2', { metal: 0.65, rough: 0.3 }));
  coilMesh.castShadow = true; sgrp.add(coilMesh);
  const plate = box(0.08, 0.5, 0.5, M('#3f3b32')); plate.position.x = LN; sgrp.add(plate);

  const blk = box(0.62, 0.62, 0.62, M(ECOL.KE, { rough: 0.35 }));
  blk.castShadow = true; blk.position.y = GY + 0.13 + 0.31; grp.add(blk);
  // 摩擦热光
  const heat = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), M('#ff7a1a', { emissive: '#ff7a1a', ei: 1.2, opacity: 0 }));
  heat.rotation.x = -Math.PI / 2; heat.position.y = GY + 0.145; grp.add(heat);

  addLabel('弹簧 · 劲度系数 k', sgrp, { dy: -30, dx: 20 });
  const st = { phase: 'armed', bp: 0, v: 0, E0: 0, dist: 0 };

  function arm(p) {
    st.bp = LN - p.x; st.v = 0; st.phase = 'armed';
    st.E0 = 0.5 * p.k * p.x * p.x;
    sgrp.scale.x = st.bp / LN;
    blk.position.x = ANCHOR + st.bp + 0.31;
  }
  arm({ x: 0.35, k: 120, m: 1.5 });

  return {
    update(dt, p) {
      if (st.phase === 'armed') { arm(p); heat.material.opacity = 0; return; }
      if (st.phase === 'fly') {
        const c = Math.max(0, LN - st.bp);
        let a = 0;
        if (c > 0.001) { a = p.k * c / p.m; st.v += a * dt; }
        else { a = -MU * G; st.v = Math.max(0, st.v + a * dt); }
        const ds = st.v * dt;
        st.bp += ds; st.dist += ds;
        if (st.v <= 0.001 && c <= 0.001) st.phase = 'done';
        const bcap = TRACK_END - ANCHOR - 0.31;
        if (st.bp > bcap) { st.bp = bcap; st.phase = 'done'; }
      }
      sgrp.scale.x = Math.min(1, st.bp / LN);
      blk.position.x = ANCHOR + st.bp + 0.31;
      heat.position.x = blk.position.x;
      const sliding = st.phase === 'fly' && st.v > 0.05;
      heat.material.opacity = sliding ? Math.min(0.5, st.v * 0.08) : 0;
    },
    reset(p) { arm(p); },
    isPlaying: st => st.phase === 'fly',
    start() { if (st.phase === 'armed') st.phase = 'fly'; },
    energy(p) {
      const c = Math.max(0, LN - st.bp);
      const epe = 0.5 * p.k * c * c;
      const ke = 0.5 * p.m * st.v * st.v;
      const q = Math.max(0, st.E0 - epe - ke);
      return [
        { label: '弹性势能', value: epe, color: ECOL.EPE },
        { label: '动能', value: ke, color: ECOL.KE },
        { label: '摩擦生热', value: q, color: ECOL.Q },
      ];
    },
    readouts(p) {
      const c = Math.max(0, LN - st.bp);
      return [
        { label: '滑块速度', val: st.v.toFixed(2), unit: 'm/s' },
        { label: '剩余压缩量', val: c.toFixed(2), unit: 'm' },
        { label: '储存总能量', val: (0.5 * p.k * p.x * p.x).toFixed(1), unit: 'J' },
        { label: '已滑行距离', val: st.dist.toFixed(2), unit: 'm' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ L5 机械能守恒（单摆） ============ */
export function scenePendulum(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const PIV = 4.1, MG = 1.2;

  for (const s of [-1, 1]) {
    const post = box(0.16, PIV, 0.16, M('#3f3b32', { rough: 0.5 }));
    post.position.set(s * 2.3, GY + PIV / 2, 0); post.castShadow = true; grp.add(post);
    grp.add(dashedLine([[s * 2.3, GY + 0.05, 0], [s * 2.3, GY + PIV, 0]], '#b0a488', 0.1, 0.1));
  }
  const bar = box(4.9, 0.14, 0.18, M('#3f3b32', { rough: 0.5 }));
  bar.position.set(0, GY + PIV, 0); grp.add(bar);

  const pivot = new THREE.Object3D(); pivot.position.set(0, GY + PIV, 0); grp.add(pivot);
  const rod = cyl(0.025, 0.025, 1, M('#6b6558', { metal: 0.4, rough: 0.4 }));
  pivot.add(rod);
  const bob = sph(0.34, M(ECOL.KE, { rough: 0.3, emissive: '#ff5a1a', ei: 0.2 }));
  bob.castShadow = true; pivot.add(bob);
  // 摆动轨迹弧
  let arc = null;
  const traceGeo = new THREE.BufferGeometry();
  const MAXPT = 90;
  traceGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXPT * 3), 3));
  const trace = new THREE.Line(traceGeo, new THREE.LineBasicMaterial({ color: '#c9701f', transparent: true, opacity: 0.45 }));
  trace.frustumCulled = false; grp.add(trace);
  const tracePts = [];

  const labAnchor = new THREE.Object3D();
  labAnchor.position.set(0, GY + 0.6, 0);
  grp.add(labAnchor);
  const lab = addLabel('最低点 · 动能最大', labAnchor, { dy: -14 });

  const st = { th: 0.7, w: 0, L: 2.2, th0: 0.7 };
  function layout() {
    rod.scale.y = st.L; rod.position.y = -st.L / 2;
    bob.position.y = -st.L;
    pivot.rotation.z = -st.th;
  }
  // 弧线
  function buildArc() {
    if (arc) { grp.remove(arc); arc.geometry.dispose(); }
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = -st.th0 + i / 40 * 2 * st.th0;
      pts.push([-Math.sin(a) * st.L, GY + PIV - Math.cos(a) * st.L, 0]);
    }
    arc = solidLine(pts, '#c9a27a', 0.5);
    grp.add(arc);
  }

  return {
    update(dt, p) {
      st.L = p.L; st.th0 = p.theta * Math.PI / 180;
      if (!st.built || Math.abs(st.lastTh0 - st.th0) > 1e-6 || st.lastL !== st.L) {
        buildArc(); st.built = true; st.lastTh0 = st.th0; st.lastL = st.L;
      }
      dt = Math.min(dt, 0.033);
      st.w += -(G / st.L) * Math.sin(st.th) * dt;
      st.th += st.w * dt;
      layout();
      // 轨迹
      const bw = new THREE.Vector3(); bob.getWorldPosition(bw);
      tracePts.push(bw.x, bw.y, bw.z);
      while (tracePts.length > MAXPT * 3) tracePts.splice(0, 3);
      traceGeo.attributes.position.array.set(tracePts);
      traceGeo.attributes.position.needsUpdate = true;
      traceGeo.setDrawRange(0, tracePts.length / 3);
    },
    reset(p) { st.th = p.theta * Math.PI / 180; st.w = 0; tracePts.length = 0; },
    isPlaying: () => true,
    energy(p) {
      const m = 1;
      const h = st.L * (1 - Math.cos(st.th));
      const pe = m * G * h;
      const v = Math.abs(st.w) * st.L;
      const ke = 0.5 * m * v * v;
      return [
        { label: '重力势能', value: pe, color: ECOL.PE },
        { label: '动能', value: ke, color: ECOL.KE },
      ];
    },
    readouts(p) {
      const m = 1, h = st.L * (1 - Math.cos(st.th));
      const v = Math.abs(st.w) * st.L;
      return [
        { label: '当前摆角', val: (st.th * 180 / Math.PI).toFixed(1), unit: '°' },
        { label: '摆锤速度', val: v.toFixed(2), unit: 'm/s' },
        { label: '当前高度', val: h.toFixed(2), unit: 'm' },
        { label: '机械能合计', val: (m * G * st.L * (1 - Math.cos(st.th0))).toFixed(1), unit: 'J' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}
