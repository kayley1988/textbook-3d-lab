import * as THREE from 'three';
import { M, box, cyl, sph, dashedLine, solidLine, makeFlow, glowTube, ECOL } from './stage.js';

const G = 10;
const GY = 0.18;

/* ============ L6 功与功率（起重机） ============ */
export function sceneWork(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const MX = -1.8, TOPY = GY + 4.8, TIPX = 2.1;

  const mast = box(0.3, 4.8, 0.3, M('#c9572a', { rough: 0.5, metal: 0.3 }));
  mast.position.set(MX, GY + 2.4, 0); mast.castShadow = true; grp.add(mast);
  const jib = box(4.6, 0.22, 0.34, M('#3f3b32', { rough: 0.5 }));
  jib.position.set((MX + TIPX) / 2, TOPY, 0); jib.castShadow = true; grp.add(jib);
  for (const s of [-0.12, 0.12]) grp.add(solidLine([[MX, TOPY + 0.9, s], [TIPX, TOPY + 0.08, s]], '#6b6558', 0.7));
  const capst = cyl(0.09, 0.09, 0.5, M('#3f3b32')); capst.position.set(MX, TOPY + 0.55, 0); grp.add(capst);
  const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 10, 24), M('#6b6558', { metal: 0.5 }));
  pulley.position.set(TIPX, TOPY - 0.16, 0); grp.add(pulley);

  const rope = cyl(0.022, 0.022, 1, M('#8a8272'));
  grp.add(rope);
  const crate = box(1.05, 1.05, 1.05, M('#a8763e', { rough: 0.75 }));
  crate.castShadow = true; grp.add(crate);
  const labM = addLabel('货物', crate, { dy: -60 });

  const st = { y: 0, t: 0, phase: 'idle' }; // idle | lifting | done
  function place() {
    crate.position.set(TIPX, GY + 0.53 + st.y, 0);
    rope.position.set(TIPX, (TOPY - 0.2 + crate.position.y + 0.5) / 2, 0);
    rope.scale.y = TOPY - 0.2 - (crate.position.y + 0.5);
  }
  place();

  return {
    update(dt, p) {
      const v = p.h / p.t;
      if (st.phase === 'lifting') {
        st.t += dt;
        st.y = Math.min(p.h, v * st.t);
        if (st.y >= p.h - 1e-4) st.phase = 'done';
      }
      place();
      labM.el.textContent = `货物 ${p.m} kg`;
    },
    reset(p) { st.phase = 'idle'; st.t = 0; st.y = 0; place(); },
    isPlaying: st => st.phase === 'lifting',
    start() { if (st.phase !== 'lifting') { st.phase = 'lifting'; st.t = 0; } },
    energy(p) {
      const done = p.m * G * st.y;
      const total = p.m * G * p.h;
      return [
        { label: '已做功 W', value: done, color: ECOL.KE },
        { label: '还需做功', value: Math.max(0, total - done), color: ECOL.REST },
      ];
    },
    readouts(p) {
      const v = p.h / p.t;
      return [
        { label: '提升速度', val: v.toFixed(2), unit: 'm/s' },
        { label: '总功 W=mgh', val: (p.m * G * p.h).toFixed(0), unit: 'J' },
        { label: '功率 P=W/t', val: (p.m * G * p.h / p.t).toFixed(0), unit: 'W' },
        { label: '已用时间', val: st.t.toFixed(1), unit: 's' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ L7 能量转化效率（电动机提升） ============ */
export function sceneEfficiency(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const MW = 50;      // 重物 50 kg
  const HMAX = 2.9;

  // 电源
  const pbox = box(0.9, 0.9, 0.9, M('#5a4a7a', { rough: 0.5 }));
  pbox.position.set(-3.2, GY + 0.45, 0); pbox.castShadow = true; grp.add(pbox);
  const pplate = box(0.92, 0.1, 0.92, M(ECOL.E, { emissive: ECOL.E, ei: 0.7 }));
  pplate.position.set(-3.2, GY + 0.95, 0); grp.add(pplate);
  addLabel('电源 · 输入电功率 P', pbox, { dy: -84 });

  // 电动机
  const motor = box(1.15, 0.85, 0.85, M('#3f3b32', { rough: 0.45, metal: 0.3 }));
  motor.position.set(-0.9, GY + 0.43, 0); motor.castShadow = true; grp.add(motor);
  const coil = sph(0.24, M('#ff5a1a', { emissive: '#ff3d00', ei: 0.2 }));
  coil.position.set(-0.9, GY + 0.45, 0); grp.add(coil);
  addLabel('电动机', motor, { dy: -70, dx: -10 });

  // 转轴 + 卷筒
  const drum = cyl(0.2, 0.2, 0.5, M('#8a8272', { metal: 0.5, rough: 0.4 }));
  drum.rotation.x = Math.PI / 2; drum.position.set(0.15, GY + 0.43, 0); grp.add(drum);
  // 立柱导轨
  const post = box(0.12, HMAX + 0.9, 0.12, M('#6b6558'));
  post.position.set(1.7, GY + (HMAX + 0.9) / 2, 0); grp.add(post);
  // 绳
  const rope = cyl(0.02, 0.02, 1, M('#8a8272')); grp.add(rope);
  // 重物
  const weight = box(0.6, 0.7, 0.6, M(ECOL.PE, { rough: 0.4 }));
  weight.castShadow = true; grp.add(weight);
  const labW = addLabel('重物 50 kg', weight, { dy: -52 });

  // 能量流：电源 → 电动机（紫色，效率越低越暗淡）
  const fcurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.7, GY + 0.5, 0), new THREE.Vector3(-1.7, GY + 0.62, 0.12), new THREE.Vector3(-1.5, GY + 0.45, 0),
  ]);
  const tube1 = glowTube(fcurve, 0.09, ECOL.E, 0.3); grp.add(tube1.obj);
  const flow1 = makeFlow(fcurve, { count: 26, speed: 0.5, size: 0.2, color: '#a678e8' }); grp.add(flow1.obj);
  // 损耗热浪
  const wisps = [];
  for (let i = 0; i < 5; i++) {
    const s = sph(0.06, M('#ffb35c', { emissive: '#ff8a1a', ei: 1.2, opacity: 0 }));
    s.userData.ph = i / 5; grp.add(s); wisps.push(s);
  }

  const st = { ein: 0, y: 0, on: false, glow: 0 };

  return {
    update(dt, p) {
      const eta = p.eta / 100;
      if (st.on) {
        st.ein += p.P * dt;
        st.y = Math.min(HMAX, st.y + (eta * p.P / (MW * G)) * dt);
        if (st.y >= HMAX - 1e-4) st.on = false;
      }
      st.glow += ((st.on ? (1 - eta) : 0) - st.glow) * Math.min(1, dt * 4);
      coil.material.emissiveIntensity = 0.15 + st.glow * 3.2;
      // 热浪上升
      wisps.forEach((s, i) => {
        const ph = (performance.now() / 1000 * 0.4 + s.userData.ph) % 1;
        s.position.set(-0.9 + Math.sin(ph * 8 + i * 2) * 0.16, GY + 0.75 + ph * 0.8, 0);
        s.material.opacity = st.glow * 0.65 * (1 - ph);
      });
      // 重物与绳
      weight.position.set(1.7, GY + 0.36 + st.y, 0);
      rope.position.set(0.15, (GY + 0.43 + weight.position.y + 0.35) / 2, 0);
      rope.scale.y = weight.position.y + 0.35 - (GY + 0.43);
      labW.el.textContent = `重物 ${MW} kg`;
    },
    reset() { st.ein = 0; st.y = 0; st.on = false; },
    isPlaying: () => st.on,
    togglePlay() { if (st.y < HMAX - 1e-3) st.on = !st.on; },
    energy(p) {
      const use = MW * G * st.y;
      return [
        { label: '有用机械能', value: use, color: ECOL.PE },
        { label: '损耗（内能）', value: Math.max(0, st.ein - use), color: ECOL.Q },
      ];
    },
    readouts(p) {
      return [
        { label: '输入电功率', val: p.P.toFixed(0), unit: 'W' },
        { label: '当前效率', val: p.eta.toFixed(0), unit: '%' },
        { label: '累计输入电能', val: (st.ein / 1000).toFixed(2), unit: 'kJ' },
        { label: '重物已升高度', val: st.y.toFixed(2), unit: 'm' },
      ];
    },
    dispose() {
      scene.remove(grp);
      tube1.dispose(); flow1.dispose();
    },
  };
}

/* ============ L8 摩擦生热 ============ */
export function sceneFriction(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);

  const plank = box(9.2, 0.15, 1.8, M('#4a463c', { rough: 0.85 }));
  plank.position.y = GY + 0.075; plank.receiveShadow = true; grp.add(plank);
  for (const s of [-1, 1]) grp.add(dashedLine([[s * 4.6, GY + 0.2, 0], [s * 4.6, 2.4, 0]], '#b0a488'));

  const blk = box(0.75, 0.75, 0.75, M(ECOL.KE, { rough: 0.4 }));
  blk.castShadow = true; blk.position.y = GY + 0.15 + 0.375; grp.add(blk);
  // 接触面热光
  const heat = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), M('#ff7a1a', { emissive: '#ff6a00', ei: 1.4, opacity: 0 }));
  heat.rotation.x = -Math.PI / 2; heat.position.y = GY + 0.158; grp.add(heat);
  // 热粒子
  const embers = [];
  for (let i = 0; i < 7; i++) {
    const e = sph(0.05, M('#ffc37a', { emissive: '#ff8a1a', ei: 1.6, opacity: 0 }));
    e.userData.ph = i / 7; grp.add(e); embers.push(e);
  }
  // 停止标记
  const stopMark = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 8, 32), M('#2b2a26', { opacity: 0 }));
  stopMark.rotation.x = Math.PI / 2; stopMark.position.y = GY + 0.16; grp.add(stopMark);

  const st = { x: -3.9, v: 0, s: 0, phase: 'armed' };
  function place() { blk.position.x = st.x; heat.position.x = st.x; }

  return {
    update(dt, p) {
      if (st.phase === 'sliding') {
        st.v = Math.max(0, st.v - p.mu * G * dt);
        const ds = st.v * dt;
        st.x += ds; st.s += ds;
        if (st.v <= 0.001) {
          st.v = 0; st.phase = 'done';
          stopMark.position.x = st.x; stopMark.material.opacity = 0.8;
        }
      }
      place();
      const sliding = st.phase === 'sliding' && st.v > 0.05;
      heat.material.opacity = sliding ? Math.min(0.45, 0.1 + st.v * 0.05) : (st.phase === 'done' ? 0.18 : 0);
      embers.forEach((e, i) => {
        const ph = (performance.now() / 1000 * 0.55 + e.userData.ph) % 1;
        e.position.set(st.x + Math.sin(ph * 10 + i) * 0.3, GY + 0.2 + ph * 0.9, (i % 3 - 1) * 0.3);
        e.material.opacity = sliding ? 0.7 * (1 - ph) : 0;
      });
    },
    reset(p) { st.x = -3.9; st.v = p.v0; st.s = 0; st.phase = 'armed'; stopMark.material.opacity = 0; place(); },
    isPlaying: st => st.phase === 'sliding',
    start(p) { if (st.phase !== 'sliding') { st.v = p.v0; st.phase = 'sliding'; } },
    energy(p) {
      const v = st.phase === 'armed' ? p.v0 : st.v;
      const ke = 0.5 * p.m * v * v;
      const q = p.mu * p.m * G * st.s;
      return [
        { label: '动能（剩余）', value: ke, color: ECOL.KE },
        { label: '摩擦生热', value: q, color: ECOL.Q },
      ];
    },
    readouts(p) {
      return [
        { label: '当前速度', val: st.v.toFixed(2), unit: 'm/s' },
        { label: '已滑行距离', val: st.s.toFixed(2), unit: 'm' },
        { label: '摩擦生热 Q', val: (p.mu * p.m * G * st.s).toFixed(1), unit: 'J' },
        { label: '理论滑距 v₀²/2μg', val: (p.v0 * p.v0 / (2 * p.mu * G)).toFixed(2), unit: 'm' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ L9 电能→内能（烧水） ============ */
export function sceneHeating(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const C = 4200;

  // 电热炉
  const stove = cyl(1.05, 1.15, 0.22, M('#3f3b32', { rough: 0.5 }));
  stove.position.y = GY + 0.11; stove.castShadow = true; grp.add(stove);
  const coilRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 10, 48), M('#ff5a1a', { emissive: '#ff3d00', ei: 0.2 }));
  coilRing.rotation.x = Math.PI / 2; coilRing.position.y = GY + 0.23; grp.add(coilRing);
  addLabel('电热圈', coilRing, { dy: -20, dx: 62 });

  // 烧杯
  const glass = cyl(0.82, 0.75, 1.7, M('#dfe9f2', { rough: 0.15, opacity: 0.22 }));
  glass.position.y = GY + 1.07; grp.add(glass);
  const water = cyl(0.72, 0.68, 1, M(ECOL.PE, { rough: 0.2, opacity: 0.6 }));
  grp.add(water);
  // 气泡与蒸汽
  const bubbles = [];
  for (let i = 0; i < 9; i++) {
    const b = sph(0.03 + Math.random() * 0.025, M('#ffffff', { opacity: 0, emissive: '#fff', ei: 0.3 }));
    b.userData.ph = Math.random(); b.userData.r = Math.random();
    grp.add(b); bubbles.push(b);
  }
  const steams = [];
  for (let i = 0; i < 5; i++) {
    const s = sph(0.07, M('#ffffff', { opacity: 0, emissive: '#fff', ei: 0.35 }));
    s.userData.ph = i / 5; grp.add(s); steams.push(s);
  }
  // 温度计
  const therm = box(0.08, 2.2, 0.08, M('#fdf6ea', { rough: 0.5 }));
  therm.position.set(1.6, GY + 1.1, 0); grp.add(therm);
  const mcol = box(0.045, 1, 0.045, M('#d94b2a', { emissive: '#d94b2a', ei: 0.6 }));
  mcol.position.set(1.6, GY + 0.75, 0);
  grp.add(mcol);
  for (const t of [0, 50, 100]) {
    const tick = box(0.16, 0.02, 0.02, M('#3f3b32'));
    tick.position.set(1.6, GY + 0.24 + t / 100 * 1.8, 0.05); grp.add(tick);
    const a = new THREE.Object3D(); a.position.set(1.9, GY + 0.26 + t / 100 * 1.8, 0); grp.add(a);
    addLabel(t + '℃', a, { dy: -6 });
  }

  const st = { T: 20, t: 0, on: false };
  function layoutWater(p) {
    const h = 0.35 + p.mw * 0.5;
    water.scale.y = h;
    water.position.y = GY + 0.28 + h / 2;
    // 颜色随温度变暖
    const k = Math.min(1, (st.T - 20) / 80);
    water.material.color.setHex(0x2f6fdb).lerp(new THREE.Color(0x3f9f8f), k);
  }
  layoutWater({ mw: 1 });

  return {
    update(dt, p) {
      if (st.on) {
        st.t += dt;
        st.T = Math.min(100, st.T + p.P / (C * p.mw) * dt);
      }
      layoutWater(p);
      coilRing.material.emissiveIntensity = st.on ? 1.6 + Math.sin(performance.now() / 120) * 0.5 : 0.12;
      // 气泡
      const bk = Math.max(0, (st.T - 45) / 55);
      bubbles.forEach(b => {
        const ph = (b.userData.ph + performance.now() / 1000 * (0.25 + bk * 0.8)) % 1;
        const h = 0.35 + p.mw * 0.5;
        b.position.set((b.userData.r - 0.5) * 1.0, GY + 0.3 + ph * h, (Math.sin(b.userData.r * 40) - 0.5) * 0.6);
        b.material.opacity = bk * 0.75 * Math.sin(ph * Math.PI);
      });
      // 蒸汽
      const sk = st.T >= 99 ? 1 : 0;
      steams.forEach((s, i) => {
        const ph = (s.userData.ph + performance.now() / 1000 * 0.4) % 1;
        s.position.set(Math.sin(ph * 7 + i * 2) * 0.22, GY + 1.95 + ph * 1.1, 0);
        s.material.opacity = sk * 0.5 * (1 - ph);
      });
      // 温度计
      const hk = (st.T - 20) / 80;
      mcol.scale.y = Math.max(0.04, hk * 1.8);
      mcol.position.y = GY + 0.24 + Math.max(0.02, hk * 0.9);
    },
    reset() { st.T = 20; st.t = 0; st.on = false; },
    isPlaying: () => st.on,
    togglePlay() { st.on = !st.on; },
    energy(p) {
      const q = C * p.mw * Math.max(0, st.T - 20);
      const ein = p.P * st.t;
      return [
        { label: '水吸收热量', value: q, color: ECOL.PE },
        { label: '散失 / 汽化', value: Math.max(0, ein - q), color: ECOL.Q },
      ];
    },
    readouts(p) {
      return [
        { label: '当前水温', val: st.T.toFixed(1), unit: '℃' },
        { label: '已加热时间', val: st.t.toFixed(0), unit: 's' },
        { label: '输入电能', val: (p.P * st.t / 1000).toFixed(1), unit: 'kJ' },
        { label: '水吸收热量', val: (C * p.mw * Math.max(0, st.T - 20) / 1000).toFixed(1), unit: 'kJ' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ L10 综合能效（能量流桑基） ============ */
export function sceneSankey(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const Y = 2.0;
  const XS = [-4.4, -1.5, 1.4, 4.3];
  const stageNames = ['燃料\n化学能', '发电\n电能', '传动\n机械能', '有用功'];
  const stageCols = [ECOL.CHEM, ECOL.E, ECOL.KE, ECOL.PE];

  const nodes = [];
  for (let i = 0; i < 4; i++) {
    const n = box(1.15, 1.15, 1.05, M('#3f3b32', { rough: 0.45 }));
    n.position.set(XS[i], Y, 0); n.castShadow = true; grp.add(n);
    const plate = box(1.17, 0.09, 1.07, M(stageCols[i], { emissive: stageCols[i], ei: 0.55 }));
    plate.position.set(XS[i], Y + 0.62, 0); grp.add(plate);
    const a = new THREE.Object3D(); a.position.set(XS[i], Y + 0.85, 0); grp.add(a);
    addLabel(stageNames[i].replace('\n', ' · '), a, { dy: -12 });
    nodes.push(n);
  }
  // 损失托盘
  const trays = [];
  for (let i = 0; i < 3; i++) {
    const tray = cyl(0.62, 0.62, 0.07, M(ECOL.Q, { emissive: ECOL.Q, ei: 0.35, rough: 0.4 }));
    tray.position.set((XS[i] + XS[i + 1]) / 2, GY + 0.06, 0); grp.add(tray);
    trays.push(tray);
  }
  const trayLab = addLabel('损耗 → 内能', trays[1], { dy: 26, cls: 'dim' });

  const st = { e1: 42, e2: 90, e3: 88, dirty: true, parts: [], tubes: [] };

  function build(p) {
    st.tubes.forEach(t => { grp.remove(t.obj); t.dispose(); });
    st.parts.forEach(f => { grp.remove(f.obj); f.dispose(); });
    st.tubes = []; st.parts = [];
    const flows = [100, 100 * p.e1 / 100, 100 * p.e1 / 100 * p.e2 / 100];
    const losses = [100 - flows[1], flows[1] - flows[2], flows[2] - flows[2] * p.e3 / 100];
    // 主能量管
    for (let i = 0; i < 3; i++) {
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(XS[i] + 0.6, Y, 0),
        new THREE.Vector3((XS[i] + XS[i + 1]) / 2, Y + 0.12, 0),
        new THREE.Vector3(XS[i + 1] - 0.6, Y, 0),
      ]);
      const r = 0.06 + 0.3 * flows[i] / 100;
      const t = glowTube(c, r, i === 0 ? ECOL.CHEM : (i === 1 ? ECOL.E : ECOL.KE), 0.22);
      grp.add(t.obj); st.tubes.push(t);
      const f = makeFlow(c, { count: 30, speed: 0.18 + 0.3 * flows[i] / 100, size: 0.22, color: i === 0 ? '#d8b545' : (i === 1 ? '#a678e8' : '#ff7043'), opacity: 0.35 + 0.6 * flows[i] / 100 });
      grp.add(f.obj); st.parts.push(f);
    }
    // 损耗支流
    for (let i = 0; i < 3; i++) {
      if (losses[i] < 0.5) continue;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(XS[i] + 0.3, Y - 0.55, 0),
        new THREE.Vector3(XS[i] + 0.55, Y - 1.1, 0.1),
        new THREE.Vector3((XS[i] + XS[i + 1]) / 2, GY + 0.15, 0),
      ]);
      const r = 0.04 + 0.26 * losses[i] / 100;
      const t = glowTube(c, r, ECOL.Q, 0.18);
      grp.add(t.obj); st.tubes.push(t);
      const f = makeFlow(c, { count: 18, speed: 0.35, size: 0.17, color: '#ffb35c', opacity: 0.3 + 0.6 * losses[i] / 100 });
      grp.add(f.obj); st.parts.push(f);
      trays[i].scale.setScalar(0.5 + 0.6 * losses[i] / 100);
    }
    st.dirty = false;
  }
  build({ e1: 42, e2: 90, e3: 88 });

  return {
    update(dt, p) {
      if (p.e1 !== st.e1 || p.e2 !== st.e2 || p.e3 !== st.e3) {
        st.e1 = p.e1; st.e2 = p.e2; st.e3 = p.e3;
        st.dirty = true;
      }
      if (st.dirty) build(p);
      st.parts.forEach(f => f.update(dt));
    },
    reset() {},
    isPlaying: () => true,
    energy(p) {
      const f1 = 100 * p.e1 / 100;
      const f2 = f1 * p.e2 / 100;
      const use = f2 * p.e3 / 100;
      return [
        { label: '有用功', value: use, color: ECOL.PE },
        { label: '损耗① 发电', value: 100 - f1, color: ECOL.Q },
        { label: '损耗② 传动', value: f1 - f2, color: '#e8a94a' },
        { label: '损耗③ 做功', value: f2 - use, color: '#d8963a' },
      ];
    },
    readouts(p) {
      const total = p.e1 / 100 * p.e2 / 100 * p.e3 / 100;
      return [
        { label: '总效率 η总', val: (total * 100).toFixed(1), unit: '%' },
        { label: '有用能量', val: total.toFixed(1), unit: 'J / 100J' },
        { label: '总损耗', val: (100 - total * 100).toFixed(1), unit: 'J' },
        { label: '每 100 J 燃料', val: `→ ${total.toFixed(1)} J`, unit: '有用' },
      ];
    },
    dispose() {
      st.tubes.forEach(t => t.dispose());
      st.parts.forEach(f => f.dispose());
      scene.remove(grp);
    },
  };
}
