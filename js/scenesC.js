/* ============================================================
   力学篇新场景（第7~12章）：
   弹力/重力/牛顿第一/二力平衡/摩擦/压强/液压/大气压/流体/
   阿基米德/浮沉/杠杆/滑轮/机械效率
   ============================================================ */
import * as THREE from 'three';
import { M, box, cyl, sph, dashedLine, solidLine, glowTube, makeFlow, ECOL } from './stage.js';

const G = 10;
const GY = 0.18;

/* ---------- 本地小工具：力箭头 ---------- */
function mkArrow(color, r = 0.045) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = cyl(r, r, 1, mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(r * 3, r * 7, 12), mat);
  g.add(shaft, head);
  const v = new THREE.Vector3();
  g.userData.set = (from, to) => {
    v.subVectors(to, from); const len = v.length();
    if (len < 1e-3) { g.visible = false; return; }
    g.visible = true;
    const hl = r * 7;
    shaft.scale.y = Math.max(0.01, len - hl);
    shaft.position.copy(from).addScaledVector(v, (len - hl) / 2 / len);
    head.position.copy(to).addScaledVector(v, -hl / 2 / len);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  };
  return g;
}
/* 弹簧：螺旋管，可用 scale.y 拉伸 */
function springMesh(r = 0.16, coils = 7, L0 = 1.2) {
  const pts = [];
  const N = 90;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(new THREE.Vector3(Math.cos(t * coils * Math.PI * 2) * r, t * L0, Math.sin(t * coils * Math.PI * 2) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.022, 8, false), M('#9aa3ad', { metal: 0.6, rough: 0.35 }));
}
const glassMat = () => M('#dfe9f2', { rough: 0.15, opacity: 0.2 });
const waterMat = () => M(ECOL.PE, { rough: 0.2, opacity: 0.55 });

/* ============ 弹力 · 弹簧测力计（P10-11） ============ */
export function sceneElastic(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const BAR = 3.2;
  const bar = box(2.4, 0.16, 0.3, M('#8a6a3f', { rough: 0.6 }));
  bar.position.y = GY + BAR; grp.add(bar);
  for (const s of [-1, 1]) { const leg = box(0.14, BAR, 0.14, M('#6b6558')); leg.position.set(s * 1.05, GY + BAR / 2, 0); grp.add(leg); }
  const sp = springMesh(0.15, 8, 1.3);
  grp.add(sp);
  const pan = cyl(0.34, 0.3, 0.09, M('#c9572a', { metal: 0.3 }));
  grp.add(pan);
  const weight = cyl(0.24, 0.24, 0.36, M('#5a6a8a', { metal: 0.4 }));
  grp.add(weight);
  const labF = addLabel('F = mg', weight, { dy: -50 });
  addLabel('弹簧的伸长与拉力成正比', bar, { dy: 30, cls: 'dim' });
  const L0 = 1.3, baseY = GY + BAR - 0.08;
  const st = { x: 0.5, xv: 0 };
  function place(p) {
    const target = p.m * G / p.k;
    st.xv += (target - st.x) * 60 * 0.016 - st.xv * 6 * 0.016; // 临界阻尼趋近
    st.x += st.xv * 0.016;
    sp.scale.y = (L0 + st.x) / L0;
    sp.position.y = baseY - (L0 + st.x) / 2;
    pan.position.y = baseY - (L0 + st.x) - 0.05;
    weight.position.y = baseY - (L0 + st.x) - 0.28;
  }
  return {
    update(dt, p) { place(p); labF.el.textContent = `F = ${(p.m * G).toFixed(1)} N`; },
    reset() { st.x = 0.5; st.xv = 0; },
    readouts(p) {
      return [
        { label: '拉力 F=mg', val: (p.m * G).toFixed(2), unit: 'N' },
        { label: '伸长 x', val: (p.m * G / p.k * 100).toFixed(1), unit: 'cm' },
        { label: '劲度系数 k', val: p.k.toFixed(0), unit: 'N/m' },
        { label: '胡克定律', val: 'F = kx', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 重力 · 重垂线与 G=mg（P13-15） ============ */
export function sceneGravity(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  // 支架
  const post = box(0.14, 3.4, 0.14, M('#6b6558')); post.position.set(-1.6, GY + 1.7, 0); grp.add(post);
  const arm = box(2.6, 0.12, 0.2, M('#6b6558')); arm.position.set(-0.4, GY + 3.34, 0); grp.add(arm);
  // 重垂线
  const plumbLine = solidLine([[-0.4, GY + 3.28, 0], [-0.4, GY + 0.5, 0]], '#c9572a', 0.9);
  grp.add(plumbLine);
  const plumb = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 16), M('#c9572a', { metal: 0.5 }));
  plumb.rotation.x = Math.PI; plumb.position.set(-0.4, GY + 0.3, 0); grp.add(plumb);
  addLabel('重垂线：竖直向下', plumb, { dy: -40, dx: -70 });
  // 斜面参照（与竖直方向对比）
  const tilted = solidLine([[-0.4, GY + 3.0, 0], [1.2, GY + 2.4, 0]], '#b0a488', 0.7);
  grp.add(tilted);
  addLabel('斜着的支架', tilted, { dy: 24, dx: 60, cls: 'dim' });
  // 下落石块
  const stone = sph(0.22, M('#7d746a', { rough: 0.8 })); stone.castShadow = true; grp.add(stone);
  const labG = addLabel('G = mg', stone, { dy: -54 });
  const H0 = 3.0;
  const st = { y: H0, v: 0, phase: 'idle', t: 0 };
  function place() { stone.position.set(0.9, GY + 0.25 + st.y, 0); }
  place();
  return {
    update(dt, p) {
      if (st.phase === 'fall') {
        st.v += G * dt; st.y -= st.v * dt; st.t += dt;
        if (st.y <= 0) { st.y = 0; st.v = 0; st.phase = 'done'; }
      }
      place();
      labG.el.textContent = `G = ${(p.m * G).toFixed(1)} N`;
    },
    reset() { st.y = H0; st.v = 0; st.t = 0; st.phase = 'idle'; place(); },
    isPlaying: st => st.phase === 'fall',
    start() { if (st.phase !== 'fall') { st.y = H0; st.v = 0; st.t = 0; st.phase = 'fall'; } },
    readouts(p) {
      const Gf = p.m * G;
      const vf = Math.sqrt(2 * G * H0);
      return [
        { label: '重力 G=mg', val: Gf.toFixed(1), unit: 'N' },
        { label: '质量', val: p.m.toFixed(1), unit: 'kg' },
        { label: '落地速度 √(2gh)', val: vf.toFixed(1), unit: 'm/s' },
        { label: '方向', val: '竖直向下', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 牛顿第一定律 · 阻力对运动的影响（P20-22） ============ */
export function sceneNewton(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const ang = 0.32, RAMP_L = 2.6, RH = Math.sin(ang) * RAMP_L;
  // 斜面（高端在左）
  const ramp = box(RAMP_L, 0.12, 1.1, M('#8a6a3f', { rough: 0.6 }));
  ramp.rotation.z = ang;
  ramp.position.set(-3.4 + RAMP_L / 2 * Math.cos(ang), GY + RH / 2 + 0.05, 0);
  ramp.castShadow = true; grp.add(ramp);
  // 轨道（三种粗糙度由滑块连续控制，颜色随之变化）
  const track = box(7.2, 0.1, 1.1, M('#4a463c', { rough: 0.85 }));
  track.position.set(-0.1, GY + 0.05, 0); track.receiveShadow = true; grp.add(track);
  // 小车
  const carGrp = new THREE.Group();
  const body = box(0.55, 0.2, 0.4, M(ECOL.KE, { rough: 0.4 }));
  body.position.y = 0.2; carGrp.add(body); body.castShadow = true;
  for (const wx of [-0.16, 0.16]) for (const wz of [-0.16, 0.16]) {
    const w = cyl(0.09, 0.09, 0.05, M('#2b2a26'));
    w.rotation.x = Math.PI / 2; w.position.set(wx, 0.09, wz); carGrp.add(w);
  }
  grp.add(carGrp);
  // 停止标记（幽灵，保留对比）
  const marks = [];
  for (let i = 0; i < 3; i++) {
    const mk = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 28), M('#7fa8d9', { opacity: 0 }));
    mk.rotation.x = Math.PI / 2; mk.position.y = GY + 0.12; grp.add(mk); marks.push(mk);
  }
  const lab1 = addLabel('① 表面越光滑，滑得越远', track, { dy: -46, dx: 90 });
  const lab2 = addLabel('② 推理：若无摩擦 → 匀速直线运动', track, { dy: -78, dx: 90, cls: 'dim' });
  const TOP = { x: -3.4 + 0.35 * Math.cos(ang), y: RH - 0.25 };
  const st = { phase: 'idle', onRamp: true, x: TOP.x, y: TOP.y, v: 0, s: 0, run: 0 };
  function place() {
    if (st.onRamp) {
      carGrp.position.set(st.x, GY + st.y + 0.1, 0);
      carGrp.rotation.z = ang;
    } else {
      carGrp.position.set(st.x, GY + 0.1, 0);
      carGrp.rotation.z = 0;
    }
  }
  place();
  return {
    update(dt, p) {
      if (st.phase === 'run') {
        if (st.onRamp) {
          st.v += G * Math.sin(ang) * dt;
          const ds = st.v * dt;
          st.x += ds * Math.cos(ang); st.y -= ds * Math.sin(ang);
          if (st.x >= -3.4 + RAMP_L * Math.cos(ang)) { st.onRamp = false; }
        } else {
          st.v = Math.max(0, st.v - p.mu * G * dt);
          st.x += st.v * dt; st.s += st.v * dt;
          if (st.v <= 0.01) {
            st.phase = 'done';
            const mk = marks[st.run % 3];
            mk.position.x = st.x; mk.material.opacity = 0.85; st.run++;
          }
        }
        place();
      }
      // 表面颜色随粗糙度变化：越光滑越浅
      const k = (p.mu - 0.05) / 0.45;
      track.material.color.setHex(0x4a463c).lerp(new THREE.Color(0xb9b2a2), 1 - k);
    },
    reset(p) {
      st.phase = 'idle'; st.onRamp = true; st.x = TOP.x; st.y = TOP.y; st.v = 0; st.s = 0;
      marks.forEach(m => m.material.opacity = 0); place();
    },
    isPlaying: st => st.phase === 'run',
    start() { if (st.phase !== 'run') { st.phase = 'run'; } },
    readouts(p) {
      const s = st.v * st.v / (2 * p.mu * G);
      return [
        { label: '当前速度', val: st.v.toFixed(2), unit: 'm/s' },
        { label: '水平面滑距', val: st.s.toFixed(2), unit: 'm' },
        { label: '理论滑距 v₀²/2μg', val: s.toFixed(2), unit: 'm' },
        { label: '推理', val: 'μ→0 则 s→∞', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); lab1.remove?.(); lab2.remove?.(); },
  };
}

/* ============ 二力平衡（P24-26） ============ */
export function sceneBalance2(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const bar = box(3.6, 0.14, 0.26, M('#8a6a3f')); bar.position.y = GY + 3.1; grp.add(bar);
  for (const s of [-1, 1]) { const leg = box(0.14, 3.1, 0.14, M('#6b6558')); leg.position.set(s * 1.6, GY + 1.55, 0); grp.add(leg); }
  const card = box(1.5, 0.9, 0.06, M('#f5efe0', { rough: 0.7 }));
  card.castShadow = true; grp.add(card);
  // 两根吊绳（斜拉，模拟教材8.2-1的小车卡片）
  const ropeL = solidLine([[-1.5, GY + 3.05, 0], [0, 0, 0]], '#8a8272', 0.8);
  const ropeR = solidLine([[1.5, GY + 3.05, 0], [0, 0, 0]], '#8a8272', 0.8);
  grp.add(ropeL, ropeR);
  const aL = mkArrow('#d94b2a', 0.05); grp.add(aL);
  const aR = mkArrow('#2f6fdb', 0.05); grp.add(aR);
  const labState = addLabel('静止 · 平衡', card, { dy: -66 });
  const st = { x: 0, vx: 0 };
  return {
    update(dt, p) {
      const F1 = p.f1, F2 = p.f2;
      const net = F1 - F2;                    // 正 → 向左加速
      // 平衡判定
      if (Math.abs(net) < 0.05) {
        st.vx += (0 - st.x) * 2 * dt; st.vx *= 0.9; st.x += st.vx * dt;
      } else {
        st.vx += -net * 0.5 * dt; st.x += st.vx * dt;
        st.x = Math.max(-1.8, Math.min(1.8, st.x));
      }
      card.position.set(st.x, 1.55, 0);
      ropeL.geometry.setFromPoints([new THREE.Vector3(-1.5, GY + 3.05, 0), new THREE.Vector3(st.x - 0.3, 1.95, 0)]);
      ropeR.geometry.setFromPoints([new THREE.Vector3(1.5, GY + 3.05, 0), new THREE.Vector3(st.x + 0.3, 1.95, 0)]);
      const top = card.position.clone(); top.y += 0.45;
      const L = top.clone(); L.x -= 0.55 + F1 * 0.09;
      const R = top.clone(); R.x += 0.55 + F2 * 0.09;
      aL.userData.set(top, L);
      aR.userData.set(top, R);
      const bal = Math.abs(net) < 0.05;
      labState.el.textContent = bal ? '✔ 静止 · 二力平衡（等大、反向、共线）' : (net > 0 ? '→ 向左加速（不平衡）' : '← 向右加速（不平衡）');
      labState.el.style.color = bal ? '#2fa36b' : '#d94b2a';
    },
    reset() { st.x = 0; st.vx = 0; },
    readouts(p) {
      return [
        { label: 'F₁（向左）', val: p.f1.toFixed(1), unit: 'N' },
        { label: 'F₂（向右）', val: p.f2.toFixed(1), unit: 'N' },
        { label: '合力', val: (p.f1 - p.f2).toFixed(1), unit: 'N' },
        { label: '状态', val: Math.abs(p.f1 - p.f2) < 0.05 ? '平衡' : '不平衡', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 摩擦力 · 测滑动摩擦力（P27-31） ============ */
export function sceneFrictionS(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const table = box(8, 0.16, 1.9, M('#8a6a3f', { rough: 0.7 }));
  table.position.y = GY + 0.08; table.receiveShadow = true; grp.add(table);
  const blk = box(0.8, 0.6, 0.7, M('#c9a56a', { rough: 0.7 }));
  blk.castShadow = true; grp.add(blk);
  // 弹簧测力计（小盒 + 指针标签）
  const gauge = box(0.62, 0.26, 0.2, M('#f5efe0', { rough: 0.4 }));
  grp.add(gauge);
  const hookL = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9);
  grp.add(hookL);
  const labF = addLabel('示数', gauge, { dy: -56 });
  addLabel('匀速拉动：F拉 = f = μmg', table, { dy: -52, dx: -120, cls: 'dim' });
  const st = { x: -3, phase: 'idle' };
  function place(p) {
    blk.position.set(st.x, GY + 0.16 + 0.3, 0);
    gauge.position.set(st.x + 0.4 + 0.31, GY + 0.16 + 0.55, 0);
    hookL.geometry.setFromPoints([new THREE.Vector3(st.x + 0.4, blk.position.y, 0), new THREE.Vector3(gauge.position.x - 0.31, gauge.position.y, 0)]);
    const f = p.mu * p.m * G;
    labF.el.textContent = `f = ${f.toFixed(1)} N`;
  }
  return {
    update(dt, p) {
      if (st.phase === 'pull') {
        st.x += 0.9 * dt;
        if (st.x > 3) st.phase = 'done';
      }
      place(p);
    },
    reset() { st.x = -3; st.phase = 'idle'; },
    isPlaying: st => st.phase === 'pull',
    start() { if (st.phase !== 'pull') { st.x = -3; st.phase = 'pull'; } },
    readouts(p) {
      return [
        { label: '压力 F=N', val: (p.m * G).toFixed(1), unit: 'N' },
        { label: '滑动摩擦 f=μN', val: (p.mu * p.m * G).toFixed(2), unit: 'N' },
        { label: '接触面粗糙度 μ', val: p.mu.toFixed(2), unit: '' },
        { label: '测量方法', val: '匀速拉动·转换法', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 压强 · 压力的作用效果（P33-36） ============ */
export function scenePressure(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const sponge = box(4.6, 0.9, 1.8, M('#f0d9a8', { rough: 0.9 }));
  sponge.position.y = GY + 0.45; sponge.receiveShadow = true; grp.add(sponge);
  // 压块：接触面积可变（宽度随 S 变化）
  const presser = box(1, 0.7, 1.3, M('#5a6a8a', { metal: 0.3, rough: 0.4 }));
  presser.castShadow = true; grp.add(presser);
  const aF = mkArrow('#d94b2a', 0.06); grp.add(aF);
  const aN = mkArrow('#2f6fdb', 0.06); grp.add(aN);
  const labP = addLabel('p = F/S', presser, { dy: -60 });
  addLabel('同样的力，接触面越小，陷得越深', sponge, { dy: 44, cls: 'dim' });
  const st = { d: 0 };   // 下陷深度
  return {
    update(dt, p) {
      const target = Math.min(0.5, p.F / (p.S * 2.2));
      st.d += (target - st.d) * Math.min(1, dt * 6);
      const sw = 0.6 + p.S * 0.07;
      presser.scale.x = sw;
      presser.position.set(0, GY + 0.9 + 0.35 - st.d, 0);
      const top = presser.position.clone(); top.y += 0.35;
      aF.userData.set(top.clone().add(new THREE.Vector3(0, 1.5 + p.F * 0.04, 0)), top);
      const bot = presser.position.clone(); bot.y -= 0.35;
      aN.userData.set(bot, bot.clone().add(new THREE.Vector3(0, -0.8 - p.F * 0.02, 0)));
      const pv = p.F / (p.S * 0.0001);
      labP.el.textContent = `p = ${pv >= 1000 ? (pv / 1000).toFixed(0) + ' kPa' : pv.toFixed(0) + ' Pa'}`;
    },
    reset() { st.d = 0; },
    readouts(p) {
      const pv = p.F / (p.S * 0.0001);
      return [
        { label: '压力 F', val: p.F.toFixed(1), unit: 'N' },
        { label: '受力面积 S', val: (p.S).toFixed(0), unit: 'cm²' },
        { label: '压强 p=F/S', val: (pv / 1000).toFixed(1), unit: 'kPa' },
        { label: '效果（下陷）', val: (st.d * 100).toFixed(1), unit: 'cm' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 液体压强 · 三孔喷水（P37-42） ============ */
export function sceneLiquidP(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const WH = 2.6, WW = 1.7;
  const tank = box(1.1, WH, WW, glassMat());
  tank.position.y = GY + WH / 2; grp.add(tank);
  for (const e of [[-0.56, WH / 2], [0.56, WH / 2], [0, 0], [0, WH], [0, -WH / 2 + WH]].slice(0, 2)) { /* 边框省略 */ }
  const water = box(1.0, WH - 0.12, WW - 0.1, waterMat());
  grp.add(water);
  const labHead = new THREE.Object3D();
  labHead.position.set(-0.2, GY + WH + 0.35, 0); grp.add(labHead);
  addLabel('水越深，压强越大 → 喷得越远', labHead, { dy: -8 });
  // 三个侧孔 + 水流
  const holes = [0.35, 0.65, 0.95].map((f, i) => ({ y: GY + 0.15 + f * (WH - 0.3), lab: null }));
  const jets = holes.map(h => {
    const depth = GY + WH - h.y;
    const reach = 0.5 + Math.sqrt(depth) * 1.25;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.56, h.y, 0),
      new THREE.Vector3(0.56 + reach * 0.45, h.y - depth * 0.1, 0),
      new THREE.Vector3(0.56 + reach, GY + 0.05, 0),
    ]);
    const t = glowTube(curve, 0.05, ECOL.PE, 0.5); grp.add(t.obj);
    const f = makeFlow(curve, { count: 22, speed: 0.55, size: 0.14, color: '#5aa8f0' }); grp.add(f.obj);
    return { t, f, h };
  });
  // 孔深度标注（锚点挂进 grp 才能正确投影；放左侧避开水流与标题）
  const depths = [0.8, 1.6, 2.4];
  const labDep = holes.map((h, i) => {
    const a = new THREE.Object3D();
    a.position.set(-0.72, h.y, 0); grp.add(a);
    return addLabel(`深度 ${depths[i]} m`, a, { dx: -40, dy: -8 });
  });
  return {
    update(dt, p) {
      jets.forEach(j => j.f.update(dt));
      const wh = (WH - 0.12) * p.lv;
      water.scale.y = p.lv;
      water.position.y = GY + 0.06 + wh / 2;
    },
    reset() {},
    readouts(p) {
      return [
        { label: '液体密度', val: p.rho.toFixed(2), unit: 'g/cm³' },
        { label: '孔1 压强 p=ρgh', val: (p.rho * 1000 * 10 * depths[0] / 1000).toFixed(1), unit: 'kPa' },
        { label: '孔3 压强', val: (p.rho * 1000 * 10 * depths[2] / 1000).toFixed(1), unit: 'kPa' },
        { label: '规律', val: 'p = ρgh（只看深度）', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); jets.forEach(j => { j.t.dispose(); j.f.dispose(); }); },
  };
}

/* ============ 大气压强 · 覆杯实验（P43-47） ============ */
export function sceneAtmos(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const cupGrp = new THREE.Group(); grp.add(cupGrp);
  const cup = cyl(0.42, 0.34, 1.0, glassMat());
  cup.position.y = 0.5; cupGrp.add(cup);
  const wtr = cyl(0.36, 0.3, 0.8, waterMat());
  cupGrp.add(wtr);
  const card = box(1.0, 0.03, 1.0, M('#f5efe0', { rough: 0.7 }));
  cupGrp.add(card);
  card.position.y = 0.06;
  const aUp = mkArrow('#2fa36b', 0.055); grp.add(aUp);
  const aDn = mkArrow('#d94b2a', 0.045); grp.add(aDn);
  const labBig = addLabel('F大气 →', card, { dy: -70, dx: -60 });
  const labFlip = addLabel('倒置 —— 纸片不掉，水不流出', cupGrp, { dy: -104 });
  const st = { t: 0, phase: 'upright' };
  function layout(p) {
    wtr.scale.y = p.h / 0.8;
    wtr.position.y = 0.08 + p.h / 2;
  }
  return {
    update(dt, p) {
      layout(p);
      if (st.phase === 'flip') {
        st.t += dt;
        const k = Math.min(1, st.t / 1.6);
        cupGrp.rotation.z = Math.PI * (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));
        cupGrp.position.y = Math.sin(k * Math.PI) * 0.8;
        if (k >= 1) { st.phase = 'inverted'; }
      }
      const inv = st.phase !== 'upright';
      if (inv) {
        const cb = cupGrp.position.clone(); cb.y -= 0.55;
        aUp.userData.set(cb.clone().add(new THREE.Vector3(0.85, -0.9, 0)), cb);
        aDn.userData.set(cb, cb.clone().add(new THREE.Vector3(-0.5, -0.45, 0)));
        labBig.el.textContent = '↑ F大气（大）';
        labFlip.el.textContent = '大气压 > 水柱压强 → 纸片被托住';
      } else {
        aUp.userData.set(new THREE.Vector3(9, 9, 9), new THREE.Vector3(9, 9, 9));
        aDn.userData.set(new THREE.Vector3(9, 9, 9), new THREE.Vector3(9, 9, 9));
      }
    },
    reset() { st.phase = 'upright'; st.t = 0; cupGrp.rotation.z = 0; cupGrp.position.y = 0; },
    isPlaying: st => st.phase === 'flip',
    start() { if (st.phase === 'upright') { st.phase = 'flip'; st.t = 0; } },
    readouts(p) {
      const pw = 1000 * 10 * p.h / 1000;
      return [
        { label: '水柱压强 ρgh', val: pw.toFixed(2), unit: 'kPa' },
        { label: '大气压 p₀', val: '101', unit: 'kPa' },
        { label: '结论', val: 'p₀ > ρgh', unit: '' },
        { label: '1标准大气压', val: '≈ 10.3 m 水柱', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 流体压强与流速 · 吹纸实验（P48-51） ============ */
export function sceneFluid(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  // 纸条：带横线的纸张纹理（白纸上清晰可见）
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 96;
  const pg = pc.getContext('2d');
  pg.fillStyle = '#f7f2e4'; pg.fillRect(0, 0, 256, 96);
  pg.strokeStyle = '#c8bfa8'; pg.lineWidth = 1.5;
  for (let y = 18; y < 96; y += 16) { pg.beginPath(); pg.moveTo(8, y); pg.lineTo(248, y); pg.stroke(); }
  pg.strokeStyle = '#d98a7a'; pg.beginPath(); pg.moveTo(26, 6); pg.lineTo(26, 92); pg.stroke();
  const paperTex = new THREE.CanvasTexture(pc);
  const paperMat = new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.85 });
  const paper = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.045, 0.9), paperMat);
  paper.castShadow = true;
  paper.geometry.translate(1.4, 0, 0);   // 铰在左端
  paper.position.set(-1.35, 0.95, 0);
  grp.add(paper);
  // 两个立柱把纸端架起来
  const postL = box(0.12, 0.95, 0.12, M('#9c8a6a')); postL.position.set(-1.35, 0.48, 0); grp.add(postL);
  const postR = box(0.12, 0.95, 0.12, M('#9c8a6a')); postR.position.set(1.45, 0.48, 0); grp.add(postR);
  // 吹风机
  const nozzle = cyl(0.22, 0.3, 0.7, M('#5a7aa8', { metal: 0.35, rough: 0.4 }));
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(-2.4, 1.25, 0); grp.add(nozzle);
  // 气流：先贴着纸面上方平吹，过纸端后上扬
  const windCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.0, 1.25, 0), new THREE.Vector3(-0.6, 1.18, 0),
    new THREE.Vector3(0.9, 1.2, 0), new THREE.Vector3(2.1, 1.9, 0),
  ]);
  const flow = makeFlow(windCurve, { count: 36, speed: 0.9, size: 0.15, color: '#6ea8dc', opacity: 0.8 });
  grp.add(flow.obj);
  const aLift = mkArrow('#2fa36b', 0.06); grp.add(aLift);
  const lowP = addLabel('上·低压', new THREE.Object3D(), { dy: -10, cls: 'dim' });
  const lowPAnchor = new THREE.Object3D(); lowPAnchor.position.set(0, 1.75, 0); grp.add(lowPAnchor);
  lowP.anchor = lowPAnchor;
  addLabel('下·高压 → 托起', postR, { dy: 34, cls: 'dim' });
  addLabel('吹气', nozzle, { dy: -40, dx: -26 });
  return {
    update(dt, p) {
      flow.update(dt);
      const k = Math.min(1, p.wind);
      const ang = 1.3 * k;   // 上表面快→压强小→纸向上抬起
      paper.rotation.z += (ang - paper.rotation.z) * Math.min(1, dt * 5);
      const tip = new THREE.Vector3(-1.35 + Math.cos(ang) * 2.8, 0.95 + Math.sin(ang) * 2.8, 0);
      aLift.userData.set(tip.clone().add(new THREE.Vector3(0.5, -1.1, 0)), tip.clone().add(new THREE.Vector3(0, 0.35, 0)));
      flow.obj.visible = p.wind > 0.02;
      flow.obj.material.opacity = 0.35 + 0.5 * k;
    },
    reset() {},
    readouts(p) {
      return [
        { label: '气流速度', val: (p.wind * 8).toFixed(1), unit: 'm/s' },
        { label: '纸上压强', val: (101 - p.wind * 1.2).toFixed(1), unit: 'kPa' },
        { label: '纸下压强', val: '101.0', unit: 'kPa' },
        { label: '规律', val: '流速大 → 压强小', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); flow.dispose(); paperTex.dispose(); },
  };
}

/* ============ 阿基米德原理（P57-60） ============ */
export function sceneArchimedes(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const BAR = 3.0;
  const bar = box(0.16, 0.16, 0.16, M('#6b6558')); bar.position.set(-0.9, GY + BAR, 0); grp.add(bar);
  const arm = box(2.4, 0.1, 0.18, M('#6b6558')); arm.position.set(-1.8, GY + BAR + 0.08, 0); grp.add(arm);
  const leg = box(0.14, BAR + 0.1, 0.14, M('#6b6558')); leg.position.set(-2.9, GY + (BAR + 0.1) / 2, 0); grp.add(leg);
  // 弹簧测力计
  const sp = springMesh(0.12, 6, 0.8); grp.add(sp);
  const obj = box(0.5, 0.5, 0.5, M('#8a8272', { metal: 0.5, rough: 0.4 })); obj.castShadow = true; grp.add(obj);
  // 溢水杯
  const can = cyl(0.55, 0.5, 1.1, glassMat()); can.position.set(1.1, GY + 0.55, 0); grp.add(can);
  const cw = cyl(0.48, 0.44, 0.95, waterMat()); cw.position.set(1.1, GY + 0.5, 0); grp.add(cw);
  // 溢流管 → 小桶
  const spout = solidLine([[1.6, GY + 0.95, 0], [2.2, GY + 0.75, 0]], '#8fc1e8', 0.8); grp.add(spout);
  const bucket = cyl(0.3, 0.26, 0.5, M('#c9a56a', { rough: 0.6 })); bucket.position.set(2.5, GY + 0.25, 0); grp.add(bucket);
  const bw = cyl(0.24, 0.21, 0.01, waterMat()); grp.add(bw);
  const labF = addLabel('示数', obj, { dy: -64 });
  const labEq = addLabel('F浮 = G排', bucket, { dy: -58, dx: 10, cls: 'dim' });
  addLabel('物体浸入 → 排开的水流入小桶', can, { dy: -96 });
  const L0 = 0.8;
  const st = { depth: 0, phase: 'idle', t: 0, Gpail: 0 };
  const V = 0.125; // m³ 缩小模型：按 N 计
  return {
    update(dt, p) {
      if (st.phase === 'lower') { st.t += dt; st.depth = Math.min(1, st.t * 0.7); if (st.depth >= 1) st.phase = 'done'; }
      const disp = V * Math.min(st.depth, 1);            // 排开体积
      const Fb = p.rho * 10 * disp;
      const Gobj = 3.5;                                   // 物重 3.5 N
      const read = Math.max(0, Gobj - Fb);
      const ext = L0 * (read / 3.5);
      sp.scale.y = ext / L0; sp.position.y = GY + BAR - 0.08 - ext / 2;
      obj.position.set(-0.9, GY + BAR - 0.08 - ext - 0.25 - st.depth * 0.75, 0);
      st.Gpail = Fb;
      bw.scale.y = Math.max(0.01, st.Gpail / 1.5);
      bw.position.y = GY + 0.02 + bw.scale.y / 2;
      labF.el.textContent = `示数 ${read.toFixed(2)} N`;
      labEq.el.textContent = st.depth > 0.9 ? `✔ F浮 = ${Fb.toFixed(2)} N = G排` : 'F浮 = G排';
    },
    reset() { st.depth = 0; st.phase = 'idle'; st.t = 0; },
    isPlaying: st => st.phase === 'lower',
    start() { if (st.phase !== 'lower') { st.t = 0; st.phase = 'lower'; } },
    readouts(p) {
      const disp = V * Math.min(st.depth, 1);
      const Fb = p.rho * 10 * disp;
      return [
        { label: '物重 G', val: '3.50', unit: 'N' },
        { label: '浮力 F浮', val: Fb.toFixed(2), unit: 'N' },
        { label: '排开液重 G排', val: Fb.toFixed(2), unit: 'N' },
        { label: '结论', val: 'F浮 = G排', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 物体的浮沉条件（P61-64） ============ */
export function sceneFloatSink(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const beaker = cyl(0.75, 0.65, 2.2, glassMat()); beaker.position.y = GY + 1.1; grp.add(beaker);
  const wtr = cyl(0.66, 0.57, 1.7, waterMat()); grp.add(wtr);
  const egg = sph(0.28, M('#f0e0c0', { rough: 0.5 })); egg.castShadow = true; grp.add(egg);
  const labState = addLabel('下沉', egg, { dy: -58 });
  const aF = mkArrow('#2fa36b', 0.05); grp.add(aF);
  const aG = mkArrow('#d94b2a', 0.05); grp.add(aG);
  addLabel('调液体密度，看蛋的浮与沉', beaker, { dy: -96 });
  const st = { y: 1.3, v: 0, phase: 'idle' };
  function layout(p) {
    wtr.scale.y = p.lv; wtr.position.y = GY + 0.08 + 1.7 * p.lv / 2;
  }
  return {
    update(dt, p) {
      layout(p);
      const Gf = p.rhoO * 10 * 0.09;   // V=0.09
      const TOP = GY + 0.08 + 1.7 * p.lv;
      if (st.phase === 'moving') {
        const ratio = Math.min(1, p.rhoL / p.rhoO);
        const Fb = p.rhoL * 10 * 0.09 * ratio;
        const acc = (Fb - Gf) / (p.rhoO * 0.09);
        st.v += acc * dt; st.y += st.v * dt;
        st.v *= 0.985;
        // 底/面约束
        const bot = GY + 0.32, surfLimit = TOP - 0.28 * ratio - 0.05;
        if (st.y < bot) { st.y = bot; st.v = 0; }
        if (st.y > surfLimit) { st.y = surfLimit; st.v = Math.min(0, st.v); }
      }
      egg.position.set(0, st.y, 0);
      const floatR = Math.min(1, p.rhoL / p.rhoO);
      // 状态与箭头
      let state = '下沉';
      if (p.rhoL > p.rhoO + 0.01) state = '漂浮';
      else if (Math.abs(p.rhoL - p.rhoO) <= 0.01) state = '悬浮';
      labState.el.textContent = state;
      labState.el.style.color = state === '漂浮' ? '#2fa36b' : (state === '悬浮' ? '#e8a94a' : '#d94b2a');
      const FbShow = state === '漂浮' ? Gf : p.rhoL * 10 * 0.09;
      const top = egg.position.clone(); top.y += 0.28;
      aF.userData.set(top, top.clone().add(new THREE.Vector3(0, 0.35 + FbShow * 0.1, 0)));
      aG.userData.set(top, top.clone().add(new THREE.Vector3(0, -0.35 - Gf * 0.1, 0)));
    },
    reset() { st.y = 1.3; st.v = 0; st.phase = 'idle'; },
    isPlaying: st => st.phase === 'moving',
    start() { if (st.phase !== 'moving') { st.y = 1.3; st.v = 0; st.phase = 'moving'; } },
    readouts(p) {
      const Gf = p.rhoO * 10 * 0.09;
      let state = p.rhoL > p.rhoO + 0.01 ? '漂浮' : (Math.abs(p.rhoL - p.rhoO) <= 0.01 ? '悬浮' : '下沉');
      const Fb = state === '漂浮' ? Gf : p.rhoL * 10 * 0.09;
      return [
        { label: '物重 G', val: Gf.toFixed(2), unit: 'N' },
        { label: '浮力 F浮', val: Fb.toFixed(2), unit: 'N' },
        { label: 'ρ物 / ρ液', val: (p.rhoO / p.rhoL).toFixed(2), unit: '' },
        { label: '状态', val: state, unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 杠杆 · 平衡条件（P80-84） ============ */
export function sceneLever(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const BAR_Y = GY + 2.26;               // 杠杆高度（支点尖端之上）
  const post = box(0.16, 1.5, 0.16, M('#6b6558')); post.position.y = GY + 0.75; grp.add(post);
  // 支点三角（底 GY+1.5，尖 GY+2.2）
  const tri = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 3), M('#c9572a', { metal: 0.3 }));
  tri.rotation.y = Math.PI; tri.position.y = GY + 1.85; grp.add(tri);
  const bar = box(6.4, 0.12, 0.24, M('#8a6a3f', { rough: 0.55 }));
  bar.position.y = BAR_Y;
  bar.castShadow = true; grp.add(bar);
  // 刻度
  for (let i = -3; i <= 3; i++) {
    if (!i) continue;
    const t = box(0.03, 0.14, 0.26, M('#3f3b32')); t.position.set(i, 0, 0); bar.add(t);
  }
  // 两侧吊挂砝码组
  const hookL = new THREE.Group(), hookR = new THREE.Group();
  grp.add(hookL, hookR);
  const labL = addLabel('F₁L₁', hookL, { dy: -60 });
  const labR = addLabel('F₂L₂', hookR, { dy: -60 });
  const labEq = addLabel('F₁L₁ = F₂L₂ ?', bar, { dy: 40 });
  const st = { ang: 0 };
  function weights(m) {
    const g2 = new THREE.Group();
    for (let i = 0; i < m; i++) {
      const w = cyl(0.16, 0.16, 0.14, M('#5a6a8a', { metal: 0.4 }));
      w.position.y = -0.3 - i * 0.16; g2.add(w);
    }
    const rope = solidLine([[0, 0, 0], [0, -0.22, 0]], '#8a8272', 0.9); g2.add(rope);
    return g2;
  }
  return {
    update(dt, p) {
      const M1 = p.m1 * p.l1, M2 = p.m2 * p.l2;
      const target = Math.max(-0.3, Math.min(0.3, (M2 - M1) * 0.06));
      st.ang += (target - st.ang) * Math.min(1, dt * 4);
      bar.rotation.z = st.ang;
      // 吊点世界位置 = 杠杆中心(BAR_Y) + 局部(±l,0) 旋转 st.ang
      hookL.position.set(-p.l1 * Math.cos(st.ang), BAR_Y - p.l1 * Math.sin(st.ang) - 0.06, 0);
      hookR.position.set(p.l2 * Math.cos(st.ang), BAR_Y + p.l2 * Math.sin(st.ang) - 0.06, 0);
      // 重建砝码
      if (hookL.children.length !== p.m1 + 1) { hookL.clear(); hookL.add(weights(p.m1)); }
      if (hookR.children.length !== p.m2 + 1) { hookR.clear(); hookR.add(weights(p.m2)); }
      labL.el.textContent = `F₁L₁ = ${M1.toFixed(1)} N·m`;
      labR.el.textContent = `F₂L₂ = ${M2.toFixed(1)} N·m`;
      const bal = Math.abs(M1 - M2) < 0.05;
      labEq.el.textContent = bal ? '✔ 杠杆平衡：F₁L₁ = F₂L₂' : (M1 > M2 ? '左端下沉' : '右端下沉');
      labEq.el.style.color = bal ? '#2fa36b' : '#d94b2a';
    },
    reset() { st.ang = 0; },
    readouts(p) {
      return [
        { label: 'F₁L₁', val: (p.m1 * p.l1 * 10 / 10).toFixed(2), unit: 'N·m' },
        { label: 'F₂L₂', val: (p.m2 * p.l2 * 10 / 10).toFixed(2), unit: 'N·m' },
        { label: '状态', val: Math.abs(p.m1 * p.l1 - p.m2 * p.l2) < 0.05 ? '平衡' : '失衡', unit: '' },
        { label: '平衡条件', val: 'F₁L₁ = F₂L₂', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 滑轮 · 定滑轮/动滑轮（P85-88） ============ */
export function scenePulley(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const frame = box(0.2, 4.2, 0.2, M('#6b6558')); frame.position.set(-2.4, GY + 2.1, 0); grp.add(frame);
  const beam = box(6.4, 0.16, 0.3, M('#6b6558')); beam.position.set(0.8, GY + 4.1, 0); grp.add(beam);
  // —— 定滑轮（左） ——
  const mkPulley = r => {
    const g = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 10, 32), M('#9aa3ad', { metal: 0.6, rough: 0.3 }));
    const hub = cyl(r * 0.25, r * 0.25, 0.1, M('#5a6a8a', { metal: 0.5 })); hub.rotation.x = Math.PI / 2;
    g.add(wheel, hub);
    const spoke = box(r * 1.7, 0.03, 0.03, M('#5a6a8a')); g.add(spoke);
    return g;
  };
  const pFix = mkPulley(0.32); pFix.position.set(-1.4, GY + 3.8, 0); grp.add(pFix);
  const wFix = box(0.5, 0.5, 0.5, M('#c9a56a', { rough: 0.6 })); wFix.castShadow = true; grp.add(wFix);
  const ropeF1 = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9); grp.add(ropeF1);
  const ropeF2 = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9); grp.add(ropeF2);
  const labFix = addLabel('定滑轮 F = G', wFix, { dy: -58 });
  // —— 动滑轮（右） ——
  const pMov = mkPulley(0.32); grp.add(pMov);
  const wMov = box(0.5, 0.5, 0.5, M('#c9a56a', { rough: 0.6 })); wMov.castShadow = true; grp.add(wMov);
  const ropeM1 = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9); grp.add(ropeM1);
  const ropeM2 = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9); grp.add(ropeM2);
  const labMov = addLabel('动滑轮 F = G/2', wMov, { dy: -58 });
  const st = { t: 0, phase: 'idle' };
  const HMAX = 1.8;
  return {
    update(dt, p) {
      if (st.phase === 'lift') { st.t += dt; if (st.t > 3.4) st.phase = 'done'; }
      const k = Math.min(1, st.t / 3);
      const h = k * HMAX;
      // 定滑轮：绳一端挂重物直上直下
      const ax = -1.4;
      wFix.position.set(ax, GY + 0.3 + h, 0);
      ropeF1.geometry.setFromPoints([new THREE.Vector3(ax - 0.32, GY + 3.8, 0), new THREE.Vector3(ax, wFix.position.y + 0.25, 0)]);
      ropeF2.geometry.setFromPoints([new THREE.Vector3(ax + 0.32, GY + 3.8, 0), new THREE.Vector3(ax + 0.32, GY + 3.8 - 2.2 + h, 0)]);
      // 动滑轮：轮随重物走，两段绳
      const bx = 2.4;
      pMov.position.set(bx, GY + 0.75 + h, 0);
      wMov.position.set(bx, GY + 0.35 + h, 0);
      ropeM1.geometry.setFromPoints([new THREE.Vector3(bx - 0.32, GY + 4.02, 0), new THREE.Vector3(bx - 0.28, pMov.position.y + 0.3, 0)]);
      ropeM2.geometry.setFromPoints([new THREE.Vector3(bx + 0.32, GY + 4.02, 0), new THREE.Vector3(bx + 0.28, pMov.position.y + 0.3, 0)]);
      const Gf = p.m * G;
      labFix.el.textContent = `定滑轮：F = ${Gf.toFixed(0)} N（不省力，改变方向）`;
      labMov.el.textContent = `动滑轮：F = ${(Gf / 2).toFixed(0)} N（省一半力，费距离）`;
    },
    reset() { st.t = 0; st.phase = 'idle'; },
    isPlaying: st => st.phase === 'lift',
    start() { if (st.phase !== 'lift') { st.t = 0; st.phase = 'lift'; } },
    readouts(p) {
      const Gf = p.m * G;
      return [
        { label: '物重 G', val: Gf.toFixed(0), unit: 'N' },
        { label: '定滑轮拉力', val: Gf.toFixed(0), unit: 'N' },
        { label: '动滑轮拉力', val: (Gf / 2).toFixed(0), unit: 'N' },
        { label: '绳端移动', val: '动滑轮 s = 2h', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 机械效率 · 斜面（P89-93） ============ */
export function sceneMechEff(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const ang = 0.42, L = 4.2, H = Math.sin(ang) * L;
  const ramp = box(L, 0.14, 1.3, M('#8a6a3f', { rough: 0.65 }));
  ramp.rotation.z = ang;
  ramp.position.set(-2.1 + L / 2 * Math.cos(ang), GY + H / 2 + 0.05, 0);
  ramp.castShadow = true; ramp.receiveShadow = true; grp.add(ramp);
  const crate = box(0.6, 0.5, 0.6, M('#c9a56a', { rough: 0.6 })); crate.castShadow = true; grp.add(crate);
  const rope = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9); grp.add(rope);
  const gauge = box(0.5, 0.22, 0.18, M('#f5efe0', { rough: 0.4 })); grp.add(gauge);
  const labF = addLabel('F', gauge, { dy: -48 });
  const labW = addLabel('W有用 = Gh', ramp, { dy: -84, dx: -30, cls: 'dim' });
  addLabel('斜面：省力但费距离，还有摩擦损耗', ramp, { dy: -118, dx: 60, cls: 'dim' });
  const st = { s: 0, phase: 'idle' };
  return {
    update(dt, p) {
      const Hh = p.h / 1 * (H / (Math.sin(ang) * L)) ; // 以斜面全长换算
      if (st.phase === 'pull') { st.s += dt * 0.8; if (st.s > L - 0.7) { st.s = L - 0.7; st.phase = 'done'; } }
      const d = st.s;
      const cx = -2.1 + (d + 0.35) * Math.cos(ang);
      const cy = GY + (d + 0.35) * Math.sin(ang) + 0.35;
      crate.position.set(cx, cy, 0);
      crate.rotation.z = ang;
      const gx = cx + 0.45 * Math.cos(ang), gy = cy + 0.45 * Math.sin(ang);
      gauge.position.set(gx, gy + 0.28, 0); gauge.rotation.z = ang;
      rope.geometry.setFromPoints([
        new THREE.Vector3(cx + 0.3 * Math.cos(ang), cy + 0.3 * Math.sin(ang), 0),
        new THREE.Vector3(gx - 0.25 * Math.cos(ang), gy - 0.0 * Math.sin(ang), 0)]);
      const Gf = p.m * G;
      const Fpull = Gf * Math.sin(ang) + p.mu * Gf * Math.cos(ang);
      labF.el.textContent = `F = ${Fpull.toFixed(1)} N`;
      const Wuseful = Gf * Math.sin(ang) * d / 1;
      const Wtotal = Fpull * d;
      labW.el.textContent = `η = ${d > 0.1 ? (Wuseful / Math.max(Wtotal, 1e-6) * 100).toFixed(0) : '--'}%`;
    },
    reset() { st.s = 0; st.phase = 'idle'; },
    isPlaying: st => st.phase === 'pull',
    start() { if (st.phase !== 'pull') { st.s = 0; st.phase = 'pull'; } },
    readouts(p) {
      const Gf = p.m * G;
      const Fpull = Gf * Math.sin(ang) + p.mu * Gf * Math.cos(ang);
      const Wuseful = Gf * Math.sin(ang) * st.s;
      const Wtotal = Fpull * st.s;
      return [
        { label: '拉力 F', val: Fpull.toFixed(1), unit: 'N' },
        { label: '有用功 W=Gh', val: Wuseful.toFixed(1), unit: 'J' },
        { label: '总功 W=Fs', val: Wtotal.toFixed(1), unit: 'J' },
        { label: '机械效率 η', val: st.s > 0.1 ? (Wuseful / Math.max(Wtotal, 1e-6) * 100).toFixed(0) : '--', unit: '%' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}
