/* ============================================================
   想想做做 / 演示 专场（12 个）
   7.1 推门 · 7.3 甩橡皮 · 9.2 压强计/池底拔塞 · 9.3 托里拆利/气压计
   9.4 硬币跳高/机翼 · 10.3 橡皮泥船/热气球 · 11.4 滚摆 · 12.3 动滑轮省功
   ============================================================ */
import * as THREE from 'three';
import { M, box, cyl, sph, dashedLine, solidLine, glowTube, makeFlow, ECOL } from './stage.js';

const G = 10;
const GY = 0.18;
const RHO = 1000;

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
const glass = () => M('#dfe9f2', { rough: 0.15, opacity: 0.2 });
const water = () => M(ECOL.PE, { rough: 0.2, opacity: 0.55 });

/* ============ 7.1 力 · 想想做做：A/B/C 推门 ============ */
export function sceneForceDoor(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  // 门框
  const frame = box(2.1, 2.7, 0.14, M('#8a6a3f', { rough: 0.65 }));
  frame.position.set(1.15, GY + 1.5, -0.02); grp.add(frame);
  // 门（铰链在左边缘）
  const door = new THREE.Group();
  door.position.set(0.12, GY + 1.5, 0.1); grp.add(door);
  const panel = box(1.9, 2.3, 0.08, M('#c9a56a', { rough: 0.55 }));
  panel.position.x = 0.95; panel.castShadow = true; door.add(panel);
  const knob = sph(0.07, M('#5a6a8a', { metal: 0.7 })); knob.position.set(1.76, 0, 0.1); door.add(knob);
  // A/B/C 三个作用点
  const POINTS = [
    { x: 0.28, name: 'A · 靠门轴' },
    { x: 0.95, name: 'B · 门中间' },
    { x: 1.72, name: 'C · 把手处' },
  ];
  const marks = POINTS.map(p => {
    const m = cyl(0.075, 0.075, 0.03, M('#d94b2a', { emissive: '#d94b2a', ei: 0.3 }));
    m.rotation.x = Math.PI / 2; m.position.set(p.x, -0.2, 0.07); door.add(m);
    return m;
  });
  const aF = mkArrow('#d94b2a', 0.055); grp.add(aF);
  const labA = addLabel('A', new THREE.Object3D(), { dy: -14 }); grp.add(labA.anchor || new THREE.Object3D());
  const st = { ang: 0 };
  return {
    update(dt, p, L) {
      const idx = Math.round(p.point);
      const arm = POINTS[idx].x;
      const F = p.F * (p.pull ? -1 : 1);
      const target = Math.max(-0.95, Math.min(0.95, F * arm * 0.02));
      st.ang += (target - st.ang) * Math.min(1, dt * 5);
      door.rotation.y = -st.ang;
      // 箭头：推力作用在所选点，方向与门面垂直
      const world = new THREE.Vector3(arm, -0.2, 0.12).applyEuler(new THREE.Euler(0, -st.ang, 0)).add(door.position);
      aF.userData.set(world, world.clone().add(new THREE.Vector3(0, 0, (p.pull ? -1 : 1) * (0.5 + p.F * 0.03))));
      marks.forEach((m, i) => m.material.emissiveIntensity = i === idx ? 0.9 : 0.15);
      // 力臂标注跟随
      labA.anchor.position.copy(world);
      labA.el.textContent = '力臂 ' + (arm * 100).toFixed(0) + ' cm';
    },
    reset() { st.ang = 0; door.rotation.y = 0; },
    readouts(p) {
      const idx = Math.round(p.point);
      const arm = [0.28, 0.95, 1.72][idx];
      return [
        { label: '作用点', val: ['A 靠轴', 'B 中间', 'C 把手'][idx], unit: '' },
        { label: '力臂 L', val: (arm * 100).toFixed(0), unit: 'cm' },
        { label: '力 F', val: p.F.toFixed(0), unit: 'N' },
        { label: '转动效果 F·L', val: (p.F * arm * 100).toFixed(0), unit: 'N·cm' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 7.3 想想做做：甩橡皮（圆周运动） ============ */
export function sceneCircular(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const stand = box(0.3, 1.6, 0.3, M('#6b6558')); stand.position.y = GY + 0.8; grp.add(stand);
  const hand = sph(0.16, M('#e8c9a0', { rough: 0.7 })); hand.position.y = GY + 1.55; grp.add(hand);
  const rub = sph(0.13, M('#d94b2a', { rough: 0.6 })); rub.castShadow = true; grp.add(rub);
  const stringLine = solidLine([[0, 0, 0], [0, 0, 0]], '#f2ead8', 0.95); grp.add(stringLine);
  const aT = mkArrow('#2fa36b', 0.04); grp.add(aT);
  const labF = addLabel('线拉力指向手', rub, { dy: -44 });
  addLabel('匀速圆周运动靠"指向圆心的拉力"', hand, { dy: -46, cls: 'dim' });
  const st = { th: 0, rel: false, pos: new THREE.Vector3(), vel: new THREE.Vector3() };
  const CY = GY + 1.55;
  return {
    update(dt, p) {
      const R = p.L;
      if (!st.rel) {
        st.th += p.w * dt;
        rub.position.set(Math.cos(st.th) * R, CY, Math.sin(st.th) * R);
        stringLine.geometry.setFromPoints([new THREE.Vector3(0, CY, 0), rub.position.clone()]);
        const out = rub.position.clone().setY(0).normalize();
        aT.userData.set(rub.position.clone(), rub.position.clone().addScaledVector(out.negate(), 0.5));
      } else {
        st.pos.addScaledVector(st.vel, dt);
        if (st.pos.y > GY + 0.13) st.vel.y -= G * dt;
        else { st.pos.y = GY + 0.13; st.vel.set(0, 0, 0); }
        rub.position.copy(st.pos);
        stringLine.geometry.setFromPoints([new THREE.Vector3(0, CY, 0), rub.position.clone()]);
        aT.visible = false;
      }
      const v = p.w * R;
      labF.el.textContent = `v = ${v.toFixed(2)} m/s · F = ${(0.05 * v * v / R).toFixed(2)} N`;
    },
    reset() { st.th = 0; st.rel = false; },
    isPlaying: () => !st.rel,
    togglePlay(p) {
      if (!st.rel) {
        st.rel = true;
        const R = p.L, v = p.w * R;
        st.pos.copy(rub.position);
        st.vel.set(-Math.sin(st.th) * v, 0, Math.cos(st.th) * v);
      } else {
        st.rel = false;
      }
    },
    readouts(p) {
      const v = p.w * p.L;
      return [
        { label: '绳长 R', val: p.L.toFixed(1), unit: 'm' },
        { label: '角速度 ω', val: p.w.toFixed(1), unit: 'rad/s' },
        { label: '线速度 v=ωR', val: v.toFixed(2), unit: 'm/s' },
        { label: '向心力 mv²/R', val: (0.05 * v * v / p.L).toFixed(2), unit: 'N' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 9.2 演示：U 形管压强计 ============ */
export function sceneManometer(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  // 水槽
  const tank = cyl(0.85, 0.75, 1.9, glass()); tank.position.set(-1.5, GY + 0.95, 0); grp.add(tank);
  const wtr = cyl(0.76, 0.68, 1.6, water()); wtr.position.set(-1.5, GY + 0.1 + 0.8, 0); grp.add(wtr);
  // 探头
  const probe = cyl(0.19, 0.19, 0.1, M('#c9572a', { metal: 0.4 }));
  grp.add(probe);
  const rod = cyl(0.035, 0.035, 1, M('#8a8272')); grp.add(rod);
  const hose = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.5, GY + 2.1, 0), new THREE.Vector3(-0.4, GY + 2.4, 0),
    new THREE.Vector3(1.0, GY + 1.6, 0), new THREE.Vector3(1.35, GY + 0.55, 0),
  ]);
  grp.add(glowTube(hose, 0.045, '#8a8272', 0.5).obj);
  // U 形管（两支 + 底）
  const lT = cyl(0.09, 0.09, 2.2, glass()); lT.position.set(1.35, GY + 1.15, 0); grp.add(lT);
  const rT = cyl(0.09, 0.09, 2.2, glass()); rT.position.set(1.85, GY + 1.15, 0); grp.add(rT);
  const bottom = box(0.6, 0.14, 0.16, glass()); bottom.position.set(1.6, GY + 0.08, 0); grp.add(bottom);
  const lq = cyl(0.075, 0.075, 1, water()); grp.add(lq);
  const rq = cyl(0.075, 0.075, 1, water()); grp.add(rq);
  const labH = addLabel('Δh', new THREE.Object3D(), { dy: -18 });
  const an = new THREE.Object3D(); an.position.set(1.6, GY + 2.55, 0); grp.add(an);
  addLabel('U 形管压强计：Δh 越大 → 压强越大', an, { dy: -8, cls: 'dim' });
  return {
    update(dt, p) {
      const depth = p.depth / 100;                    // cm → m
      const press = RHO * G * depth;                  // Pa
      const dh = Math.min(1.75, p.depth * 0.085);     // 视觉放大
      // 探头
      probe.position.set(-1.5, GY + 0.1 + 1.6 - p.depth / 100 * 1.2, 0);
      probe.rotation.z = p.dir * 0.8;
      rod.geometry.dispose();
      rod.geometry = new THREE.CylinderGeometry(0.035, 0.035, GY + 2.2 - probe.position.y, 12);
      rod.position.set(-1.5, (GY + 2.2 + probe.position.y) / 2, 0);
      // 液柱：左高右低（探头受压实到右臂）
      const baseH = 0.95;
      const lh = baseH + dh / 2, rh = Math.max(0.12, baseH - dh / 2 + 0.02);
      lq.scale.y = lh / 1; lq.position.set(1.35, GY + 0.15 + lh / 2, 0);
      rq.scale.y = rh / 1; rq.position.set(1.85, GY + 0.15 + rh / 2, 0);
      labH.anchor.position.set(2.02, GY + 0.15 + lh, 0);
      labH.el.textContent = `Δh ≈ ${(dh * 100).toFixed(1)} cm`;
    },
    reset() {},
    readouts(p) {
      const depth = p.depth / 100;
      return [
        { label: '探头深度 h', val: p.depth.toFixed(0), unit: 'cm' },
        { label: '压强 p=ρgh', val: (RHO * G * depth).toFixed(0), unit: 'Pa' },
        { label: 'U 形管高度差', val: (RHO * G * depth / (RHO * G) * 100).toFixed(1), unit: 'cm' },
        { label: '探头朝向', val: ['朝上', '朝侧面', '朝下'][Math.round(p.dir) + 1] || '朝侧面', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 9.2 想想做做：池底拔塞 ============ */
export function sceneSinkPlug(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const basin = box(3.4, 1.5, 2.0, glass()); basin.position.y = GY + 0.75; grp.add(basin);
  const wtr = box(3.25, 1.3, 1.9, water()); grp.add(wtr);
  // 排水口
  const hole = cyl(0.16, 0.16, 0.06, M('#3f3b32')); hole.position.set(0, GY + 0.05, 0); grp.add(hole);
  const plug = cyl(0.17, 0.15, 0.16, M('#c9572a', { rough: 0.6 })); grp.add(plug);
  const chain = solidLine([[0, 0, 0], [0, 0, 0]], '#b0a488', 0.9); grp.add(chain);
  const aP = mkArrow('#2f6fdb', 0.045); grp.add(aP);
  const aF = mkArrow('#d94b2a', 0.045); grp.add(aF);
  const lab = addLabel('水对塞子的压力', plug, { dy: -46 });
  addLabel('池里的水越深，拔塞越费力', basin, { dy: -80, cls: 'dim' });
  const st = { lift: 0, open: false };
  const S = 0.002;   // 塞子面积 20 cm²
  return {
    update(dt, p) {
      const H = p.h;                     // m
      const pv = RHO * G * H;
      const need = pv * S + 1;           // 水压 + 塞重力 1N
      const wh = H / 0.45 * 1.28;
      wtr.scale.y = H / 0.45; wtr.position.y = GY + 0.07 + wh / 2;
      if (!st.open && p.F >= need) st.open = true;
      if (st.open) st.lift = Math.min(0.7, st.lift + dt * 0.8);
      const py = GY + 0.14 + st.lift;
      plug.position.set(0, py, 0);
      chain.geometry.setFromPoints([new THREE.Vector3(0, py + 0.08, 0), new THREE.Vector3(0, py + 1.5, 0)]);
      aP.userData.set(new THREE.Vector3(0.28, py, 0), new THREE.Vector3(0.28, py + 0.35 + pv * S * 0.02, 0));
      aF.userData.set(new THREE.Vector3(-0.28, py + 0.7, 0), new THREE.Vector3(-0.28, py + 0.7 - p.F * 0.02, 0));
      lab.el.textContent = st.open ? '✔ 塞子被拔起，水排走了' : `需要 ≥ ${need.toFixed(1)} N 才拔得动`;
      lab.el.style.color = st.open ? '#2fa36b' : '#c2401e';
    },
    reset() { st.open = false; st.lift = 0; },
    readouts(p) {
      const pv = RHO * G * p.h;
      return [
        { label: '水深 h', val: p.h.toFixed(2), unit: 'm' },
        { label: '水压 p=ρgh', val: (pv / 1000).toFixed(1), unit: 'kPa' },
        { label: '压力 F=pS', val: (pv * S).toFixed(1), unit: 'N' },
        { label: '需要提力', val: (pv * S + 1).toFixed(1), unit: 'N' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 9.3 演示：托里拆利实验 ============ */
export function sceneTorricelli(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const trough = box(2.2, 0.55, 1.2, glass()); trough.position.y = GY + 0.28; grp.add(trough);
  const hg = box(2.1, 0.42, 1.1, M('#9aa3ad', { metal: 0.85, rough: 0.2, opacity: 0.95 }));
  hg.position.y = GY + 0.24; grp.add(hg);
  addLabel('水银槽', trough, { dy: 34 });
  const tube = cyl(0.14, 0.14, 4.0, glass()); tube.position.set(0, GY + 2.2, 0); grp.add(tube);
  const col = cyl(0.115, 0.115, 1, M('#9aa3ad', { metal: 0.9, rough: 0.15 })); grp.add(col);
  const vac = addLabel('真空', new THREE.Object3D(), { dy: -8 });
  const an = new THREE.Object3D(); an.position.set(0, GY + 4.0, 0); grp.add(an);
  addLabel('760 mm 水银柱 = 1 标准大气压', an, { dy: -26 });
  // 刻度
  for (const mm of [0, 400, 760]) {
    const a = new THREE.Object3D(); a.position.set(-0.35, GY + 0.45 + mm / 760 * 3.4, 0); grp.add(a);
    addLabel(mm + ' mm', a, { dy: -6, dx: -30, cls: 'dim' });
  }
  return {
    update(dt, p) {
      const frac = p.p0 / 760;
      const h = 3.4 * frac;
      col.scale.y = h; col.position.set(0, GY + 0.45 + h / 2, 0);
      vac.anchor.position.set(0, GY + 0.45 + h + 0.12, 0);
      vac.el.textContent = `真空（${(760 - p.p0).toFixed(0)} mm 空段）`;
    },
    reset() {},
    readouts(p) {
      return [
        { label: '外界气压', val: p.p0.toFixed(0), unit: 'mmHg' },
        { label: '折算', val: (p.p0 * 133.3 / 1000).toFixed(1), unit: 'kPa' },
        { label: '水银柱高', val: p.p0.toFixed(0), unit: 'mm' },
        { label: '能托水柱', val: (p.p0 / 760 * 10.3).toFixed(2), unit: 'm' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 9.3 想想做做：自制气压计 ============ */
export function sceneBaroMeter(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const bottle = cyl(0.5, 0.44, 1.0, glass()); bottle.position.y = GY + 0.5; grp.add(bottle);
  const bw = cyl(0.42, 0.38, 0.72, M(ECOL.PE, { rough: 0.2, opacity: 0.65 }));
  bw.position.y = GY + 0.4; grp.add(bw);
  const cap = cyl(0.3, 0.3, 0.12, M('#c9572a')); cap.position.y = GY + 1.04; grp.add(cap);
  const tube = cyl(0.05, 0.05, 2.0, glass()); tube.position.y = GY + 1.95; grp.add(tube);
  const col = cyl(0.035, 0.035, 1, M(ECOL.KE, { emissive: ECOL.KE, ei: 0.25 })); grp.add(col);
  const labH = addLabel('液柱', tube, { dy: -26, dx: 40 });
  addLabel('外界气压降低 → 瓶内气压把液柱顶高', bottle, { dy: -70, cls: 'dim' });
  return {
    update(dt, p) {
      const h = 0.25 + (104 - p.p) / 14 * 1.45;     // p 小 → 柱高
      col.scale.y = h; col.position.set(0, GY + 1.0 + h / 2, 0);
      labH.el.textContent = `液柱 ${(h * 10).toFixed(1)} cm`;
    },
    reset() {},
    readouts(p) {
      const h = 0.25 + (104 - p.p) / 14 * 1.45;
      return [
        { label: '外界气压', val: p.p.toFixed(0), unit: 'kPa' },
        { label: '液柱高度', val: (h * 10).toFixed(1), unit: 'cm' },
        { label: '山顶 vs 山脚', val: p.p < 100 ? '气压低·柱更高' : '气压高·柱更低', unit: '' },
        { label: '原理', val: 'p内 = p外 + ρgh', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 9.4 想想做做：硬币跳高 ============ */
export function sceneCoinJump(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const table = box(4.6, 0.16, 1.6, M('#8a6a3f', { rough: 0.7 }));
  table.position.set(0.3, GY + 0.08, 0); table.receiveShadow = true; grp.add(table);
  const block = box(0.8, 0.36, 0.7, M('#c9a56a', { rough: 0.6 }));
  block.position.set(1.15, GY + 0.16 + 0.18, 0); block.castShadow = true; grp.add(block);
  const coin = cyl(0.26, 0.26, 0.035, M('#d8c26a', { metal: 0.7, rough: 0.3 }));
  grp.add(coin);
  // 吹气管
  const nozzle = cyl(0.1, 0.12, 0.32, M('#5a6a8a', { metal: 0.4 }));
  nozzle.rotation.z = -Math.PI / 2.4; nozzle.position.set(-1.5, GY + 0.62, 0); grp.add(nozzle);
  const jetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.35, GY + 0.6, 0), new THREE.Vector3(-0.6, GY + 0.34, 0), new THREE.Vector3(0.1, GY + 0.3, 0),
  ]);
  const jet = makeFlow(jetCurve, { count: 26, speed: 1.0, size: 0.12, color: '#9fd0ea', opacity: 0.75 });
  grp.add(jet.obj);
  addLabel('吹硬币上方：上方流速大→压强小→硬币被"抬"起来', table, { dy: -76 });
  const st = { x: -0.35, y: 0, vy: 0, phase: 'idle', t: 0 };
  function place() { coin.position.set(st.x, GY + 0.2 + st.y + 0.017, 0); }
  place();
  return {
    update(dt, p) {
      jet.update(dt);
      jet.obj.visible = p.blow > 0.02;
      if (st.phase === 'fly') {
        st.t += dt;
        st.vy -= G * 0.55 * dt;
        st.y += st.vy * dt;
        st.x += (0.9 + p.blow * 1.4) * dt;
        if (st.y <= 0 && st.t > 0.2) { st.y = 0; st.vy = 0; st.phase = st.x > 1.15 ? 'over' : 'done'; }
      }
      place();
    },
    reset() { st.x = -0.35; st.y = 0; st.vy = 0; st.t = 0; st.phase = 'idle'; place(); },
    isPlaying: st => st.phase === 'fly',
    start(p) {
      if (st.phase === 'fly') return;
      st.x = -0.35; st.y = 0; st.t = 0;
      if (p.blow < 0.45) { st.phase = 'done'; st.vy = 0; st.y = 0; return; }   // 气太弱，抬不动
      st.vy = 1.6 + p.blow * 1.5; st.phase = 'fly';
    },
    readouts(p) {
      return [
        { label: '吹气强度', val: (p.blow * 100).toFixed(0), unit: '%' },
        { label: '硬币上方压强', val: (101.3 - p.blow * 1.4).toFixed(1), unit: 'kPa' },
        { label: '硬币下方压强', val: '101.3', unit: 'kPa' },
        { label: '状态', val: st.phase === 'over' ? '跳过木块 ✔' : (st.phase === 'fly' ? '腾空中' : '静止'), unit: '' },
      ];
    },
    dispose() { scene.remove(grp); jet.dispose(); },
  };
}

/* ============ 9.4 想想做做：机翼模型 ============ */
export function sceneWing(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  // 机翼剖面（上凸下平）
  const shape = new THREE.Shape();
  shape.moveTo(-1.1, 0);
  shape.bezierCurveTo(-0.6, 0.42, 0.4, 0.5, 1.1, 0.04);
  shape.lineTo(1.1, -0.02);
  shape.bezierCurveTo(0.3, -0.1, -0.6, -0.1, -1.1, 0);
  const wing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: false }),
    M('#e9e2d0', { rough: 0.45, metal: 0.15 }));
  wing.rotation.x = 0; wing.position.set(0, GY + 1.5, -0.45);
  wing.castShadow = true; grp.add(wing);
  // 前端细线 + 支架
  const post = cyl(0.05, 0.05, 2.2, M('#8a8272')); post.position.set(0, GY + 1.1, -0.8); grp.add(post);
  const strM = solidLine([[-1.1, GY + 1.55, 0.2], [-1.9, GY + 1.55, 0.2]], '#8a8272', 0.9); grp.add(strM);
  // 气流：上快下慢
  const upCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, GY + 1.72, 0), new THREE.Vector3(-0.4, GY + 2.05, 0), new THREE.Vector3(1.8, GY + 1.62, 0),
  ]);
  const dnCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, GY + 1.38, 0), new THREE.Vector3(-0.4, GY + 1.34, 0), new THREE.Vector3(1.8, GY + 1.36, 0),
  ]);
  const fu = makeFlow(upCurve, { count: 34, speed: 1.4, size: 0.13, color: '#9fd0ea' });
  const fd = makeFlow(dnCurve, { count: 16, speed: 0.55, size: 0.13, color: '#7fb8dd' });
  grp.add(fu.obj, fd.obj);
  const aLift = mkArrow('#2fa36b', 0.06); grp.add(aLift);
  const labUp = addLabel('上方：流速大 → 压强小', new THREE.Object3D(), { dy: 0 });
  labUp.anchor.position.set(-0.3, GY + 2.15, 0); grp.add(labUp.anchor);
  const labDn = addLabel('下方：流速小 → 压强大 → 升力', new THREE.Object3D(), { dy: 0 });
  labDn.anchor.position.set(0.6, GY + 1.1, 0); grp.add(labDn.anchor);
  return {
    update(dt, p) {
      fu.update(dt); fd.update(dt);
      const k = p.v / 12;
      const lift = k * k * 0.55;
      wing.position.y = GY + 1.5 + lift;
      const tip = new THREE.Vector3(0, wing.position.y + 0.05, 0);
      aLift.userData.set(tip, tip.clone().add(new THREE.Vector3(0, 0.3 + lift * 1.4, 0)));
      fu.obj.visible = fd.obj.visible = p.v > 0.3;
    },
    reset() {},
    readouts(p) {
      return [
        { label: '风速', val: p.v.toFixed(1), unit: 'm/s' },
        { label: '上方压强', val: (101.3 - p.v * 0.22).toFixed(1), unit: 'kPa' },
        { label: '下方压强', val: '101.3', unit: 'kPa' },
        { label: '升力趋势', val: p.v > 3 ? '能托起机翼' : '托不住', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); fu.dispose(); fd.dispose(); },
  };
}

/* ============ 10.3 想想做做：橡皮泥小船 ============ */
export function sceneClayBoat(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const tank = box(3.2, 1.6, 1.8, glass()); tank.position.y = GY + 0.8; grp.add(tank);
  const wtr = box(3.05, 1.34, 1.7, water()); wtr.position.y = GY + 0.08 + 0.67; grp.add(wtr);
  const surf = GY + 0.08 + 1.34;
  // 球（实心，沉底）
  const ball = sph(0.3, M('#8a6a3f', { rough: 0.85 })); ball.castShadow = true; grp.add(ball);
  // 船（空心方槽）
  const boat = new THREE.Group();
  const hull = box(1.5, 0.42, 0.9, M('#8a6a3f', { rough: 0.8 }));
  const inner = box(1.3, 0.3, 0.7, M('#6b5330', { rough: 0.9 }));
  inner.position.y = 0.12;
  boat.add(hull, inner); grp.add(boat);
  const coins = [];
  for (let i = 0; i < 6; i++) {
    const c = cyl(0.13, 0.13, 0.03, M('#d8c26a', { metal: 0.7 }));
    c.position.set(-0.5 + (i % 3) * 0.5, 0.24, i < 3 ? -0.2 : 0.2);
    boat.add(c); coins.push(c);
  }
  const aF = mkArrow('#2fa36b', 0.05); grp.add(aF);
  const lab = addLabel('实心橡皮泥：ρ物 > ρ水 → 下沉', ball, { dy: -50 });
  addLabel('捏成小船：空心 → V排变大 → 漂浮', tank, { dy: -96, cls: 'dim' });
  return {
    update(dt, p) {
      const isBoat = !!p.boat;
      ball.visible = !isBoat; boat.visible = isBoat;
      const n = Math.round(p.load);
      coins.forEach((c, i) => c.visible = i < n);
      if (!isBoat) {
        ball.position.set(-1.1, GY + 0.4, 0);
        aF.visible = false;
        lab.el.textContent = '实心橡皮泥：ρ物 > ρ水 → 下沉';
        lab.el.style.color = '#c2401e';
        lab.anchor = ball;
      } else {
        // 载重越多吃水越深；超过 6 枚就翻沉
        const sink = 0.12 + n * 0.045;
        const sinkCap = n > 5 ? 1.0 : sink;
        boat.position.set(0.5, surf - 0.42 + (n > 5 ? -0.5 : 0) + 0.1 - sinkCap * 0.2, 0);
        aF.userData.set(new THREE.Vector3(0.5, boat.position.y + 0.2, 0), new THREE.Vector3(0.5, boat.position.y + 1.1, 0));
        lab.el.textContent = n > 5 ? '超载：船翻了！' : `橡皮泥船漂浮 · 载 ${n} 枚硬币`;
        lab.el.style.color = n > 5 ? '#c2401e' : '#2fa36b';
      }
    },
    reset() {},
    readouts(p) {
      const isBoat = !!p.boat;
      const n = Math.round(p.load);
      return [
        { label: '形状', val: isBoat ? '船形（空心）' : '实心球', unit: '' },
        { label: '排开水量', val: isBoat ? (55 + n * 7).toFixed(0) : '30', unit: 'cm³' },
        { label: '浮力 F浮', val: isBoat ? ((55 + n * 7) / 1000 * 10).toFixed(2) : '0.30', unit: 'N' },
        { label: '状态', val: isBoat ? (n > 5 ? '翻沉' : '漂浮') : '下沉', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 10.3 想想做做：塑料袋热气球 ============ */
export function sceneBalloon(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  // 塑料气球（倒扣的锥+圆口）
  const bag = new THREE.Group();
  const body = cyl(0.18, 0.85, 1.5, M('#e8eef5', { opacity: 0.42, rough: 0.3, metal: 0 }));
  body.position.y = 0.75; bag.add(body);
  const roof = sph(0.85, M('#e8eef5', { opacity: 0.42, rough: 0.3 }));
  roof.scale.y = 0.45; roof.position.y = 1.5; bag.add(roof);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 24), M('#c9572a'));
  ring.rotation.x = Math.PI / 2; bag.add(ring);
  grp.add(bag);
  // 吹风机
  const dryer = box(0.5, 0.22, 0.22, M('#5a6a8a', { metal: 0.4 }));
  dryer.position.set(0, GY + 0.2, 0.55); grp.add(dryer);
  // 热空气粒子
  const ps = [];
  for (let i = 0; i < 14; i++) {
    const s = sph(0.06, M('#ffb35c', { emissive: '#ff8a1a', ei: 1.2, opacity: 0 }));
    s.userData.ph = i / 14; grp.add(s); ps.push(s);
  }
  const aB = mkArrow('#2fa36b', 0.05); grp.add(aB);
  const aG = mkArrow('#d94b2a', 0.045); grp.add(aG);
  const lab = addLabel('加热 → 袋内空气变稀 → 浮力 > 重力', bag, { dy: -80 });
  const st = { y: 0, v: 0 };
  return {
    update(dt, p) {
      const hot = p.heat;
      const net = hot * 1.1 - 0.55;              // 净升力（任意单位）
      st.v += net * dt; st.v *= 0.94;
      st.y += st.v * dt;
      if (st.y < 0) { st.y = 0; st.v = 0; }
      if (st.y > 1.6) { st.y = 1.6; st.v = Math.min(0, st.v); }
      bag.position.set(0, GY + 0.35 + st.y, 0);
      ps.forEach((s, i) => {
        const ph = (s.userData.ph + performance.now() / 1000 * (0.3 + hot * 0.8)) % 1;
        s.position.set(Math.sin(i * 2.1) * 0.55 * ph, GY + 0.5 + ph * 1.4, Math.cos(i * 1.7) * 0.5 * ph);
        s.material.opacity = hot > 0.05 ? (1 - ph) * 0.7 * hot : 0;
      });
      const c = bag.position.clone();
      aB.userData.set(c.clone().add(new THREE.Vector3(0.75, 0.55, 0)), c.clone().add(new THREE.Vector3(0.75, 1.35, 0)));
      aG.userData.set(c.clone().add(new THREE.Vector3(-0.75, 0.9, 0)), c.clone().add(new THREE.Vector3(-0.75, 0.2, 0)));
      lab.el.textContent = net > 0.05 ? '浮力 > 重力 → 上升' : (net < -0.05 ? '浮力 < 重力 → 落下' : '接近悬浮');
      lab.el.style.color = net > 0.05 ? '#2fa36b' : '#c2401e';
    },
    reset() { st.y = 0; st.v = 0; },
    readouts(p) {
      return [
        { label: '加热强度', val: (p.heat * 100).toFixed(0), unit: '%' },
        { label: '袋内空气密度', val: (1.29 - p.heat * 0.35).toFixed(2), unit: 'kg/m³' },
        { label: '浮力', val: (0.55 + p.heat * 1.1).toFixed(2), unit: 'N' },
        { label: '状态', val: p.heat > 0.52 ? '上升' : '落下', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 11.4 想想做做：滚摆 ============ */
export function sceneRoller(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const top = box(2.4, 0.14, 0.24, M('#6b6558')); top.position.y = GY + 3.3; grp.add(top);
  for (const s of [-1, 1]) { const leg = box(0.14, 3.3, 0.14, M('#6b6558')); leg.position.set(s * 1.1, GY + 1.65, 0); grp.add(leg); }
  const disk = cyl(0.55, 0.55, 0.16, M('#c9a56a', { rough: 0.5 }));
  disk.rotation.x = Math.PI / 2; disk.castShadow = true; grp.add(disk);
  const axle = cyl(0.06, 0.06, 1.2, M('#5a6a8a', { metal: 0.6 })); axle.rotation.z = Math.PI / 2; grp.add(axle);
  const sL = solidLine([[0, 0, 0], [0, 0, 0]], '#e8e2d2', 0.9);
  const sR = solidLine([[0, 0, 0], [0, 0, 0]], '#e8e2d2', 0.9);
  grp.add(sL, sR);
  const labE = addLabel('Ep → Ek+E转', disk, { dy: -70 });
  addLabel('滚下：重力势能 → 动能 + 转动动能；滚上再变回去', top, { dy: -26, cls: 'dim' });
  const st = { t: 0, run: false };
  const AMAX = 1.25;
  return {
    update(dt, p) {
      if (st.run) st.t += dt;
      const A = Math.min(AMAX, p.h0 * 1.3);
      const y = A * (1 - Math.cos(st.t * 2.2)) / 2;      // 0..A
      const drop = A - y;
      disk.position.set(0, GY + 3.3 - 0.75 - drop, 0);
      axle.position.copy(disk.position);
      const ang = -drop / 0.55 * 2.2;
      disk.rotation.z = ang;
      sL.geometry.setFromPoints([new THREE.Vector3(-0.55, GY + 3.28, 0), new THREE.Vector3(-0.55, disk.position.y, 0)]);
      sR.geometry.setFromPoints([new THREE.Vector3(0.55, GY + 3.28, 0), new THREE.Vector3(0.55, disk.position.y, 0)]);
      const v = 2.2 * A * Math.sin(st.t * 2.2) / 2;
      const m = 0.6, I = 0.5 * m * 0.55 * 0.55;
      const Ek = 0.5 * m * v * v, Er = 0.5 * I * (v / 0.55) * (v / 0.55);
      labE.el.textContent = `Ek ${Ek.toFixed(2)} J · E转 ${Er.toFixed(2)} J · Ep ${(m * G * drop).toFixed(2)} J`;
    },
    reset() { st.t = 0; st.run = false; },
    isPlaying: () => st.run,
    togglePlay() { st.run = !st.run; },
    energy(p) {
      const A = Math.min(AMAX, p.h0 * 1.3);
      const y = A * (1 - Math.cos(st.t * 2.2)) / 2;
      const drop = A - y;
      const m = 0.6;
      const v = 2.2 * A * Math.sin(st.t * 2.2) / 2;
      const I = 0.5 * m * 0.55 * 0.55;
      return [
        { label: '重力势能', value: m * G * drop, color: ECOL.PE },
        { label: '动能（平动）', value: 0.5 * m * v * v, color: ECOL.KE },
        { label: '转动动能', value: 0.5 * I * (v / 0.55) * (v / 0.55), color: ECOL.EPE },
      ];
    },
    readouts(p) {
      const A = Math.min(AMAX, p.h0 * 1.3);
      const y = A * (1 - Math.cos(st.t * 2.2)) / 2;
      return [
        { label: '下降高度', val: (A - y).toFixed(2), unit: 'm' },
        { label: '初始高度', val: p.h0.toFixed(2), unit: 'm' },
        { label: '转动角速度', val: (2.2 * A * Math.sin(st.t * 2.2) / 2 / 0.55).toFixed(1), unit: 'rad/s' },
        { label: '机械能', val: (0.6 * G * A).toFixed(2), unit: 'J' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}

/* ============ 12.3 演示：使用动滑轮是否省功 ============ */
export function scenePulleyWork(ctx) {
  const { scene, addLabel } = ctx;
  const grp = new THREE.Group(); scene.add(grp);
  const beam = box(6.6, 0.16, 0.3, M('#6b6558')); beam.position.set(0, GY + 4.0, 0); grp.add(beam);
  for (const s of [-1, 1]) { const leg = box(0.16, 4.0, 0.16, M('#6b6558')); leg.position.set(s * 3.1, GY + 2.0, 0); grp.add(leg); }
  // 左：直接用手提
  const w1 = box(0.55, 0.55, 0.55, M('#c9a56a', { rough: 0.6 })); w1.castShadow = true; grp.add(w1);
  const hand = sph(0.14, M('#e8c9a0')); grp.add(hand);
  const r1 = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9); grp.add(r1);
  // 右：动滑轮
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 10, 30), M('#9aa3ad', { metal: 0.6 }));
  grp.add(wheel);
  const w2 = box(0.55, 0.55, 0.55, M('#c9a56a', { rough: 0.6 })); w2.castShadow = true; grp.add(w2);
  const r2a = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9);
  const r2b = solidLine([[0, 0, 0], [0, 0, 0]], '#8a8272', 0.9);
  grp.add(r2a, r2b);
  const lab1 = addLabel('直接提升：s = h', w1, { dy: -56 });
  const lab2 = addLabel('动滑轮：s = 2h', w2, { dy: -56 });
  const labW = addLabel('W相同 → 省力不省功', beam, { dy: -26 });
  const st = { t: 0, run: false };
  return {
    update(dt, p) {
      if (st.run) st.t += dt;
      const k = Math.min(1, st.t / 3);
      const h = k * p.h;
      // 左：手直接提
      w1.position.set(-2.0, GY + 0.3 + h, 0);
      hand.position.set(-2.0, GY + 0.85 + h, 0);
      r1.geometry.setFromPoints([new THREE.Vector3(-2.0, hand.position.y, 0), new THREE.Vector3(-2.0, w1.position.y + 0.28, 0)]);
      // 右：动滑轮，绳端下移 2h
      const by = GY + 0.55 + h;
      wheel.position.set(2.2, by + 0.3, 0); wheel.rotation.z = -h / 0.3;
      w2.position.set(2.2, by - 0.05, 0);
      r2a.geometry.setFromPoints([new THREE.Vector3(1.9, GY + 3.98, 0), new THREE.Vector3(1.95, by + 0.3, 0)]);
      r2b.geometry.setFromPoints([new THREE.Vector3(2.5, GY + 3.98, 0), new THREE.Vector3(2.45, by + 0.3, 0)]);
      const Gf = p.m * G;
      lab1.el.textContent = `直接提升：F=${Gf.toFixed(0)}N，s=${h.toFixed(2)}m，W=${(Gf * h).toFixed(1)}J`;
      lab2.el.textContent = `动滑轮：F=${(Gf / 2).toFixed(0)}N，s=${(2 * h).toFixed(2)}m，W=${(Gf * h).toFixed(1)}J`;
    },
    reset() { st.t = 0; st.run = false; },
    isPlaying: () => st.run,
    togglePlay() { st.run = !st.run; },
    readouts(p) {
      const k = Math.min(1, st.t / 3), h = k * p.h;
      const Gf = p.m * G;
      return [
        { label: '重物 G', val: Gf.toFixed(0), unit: 'N' },
        { label: '直接提升做功', val: (Gf * h).toFixed(1), unit: 'J' },
        { label: '动滑轮做功', val: (Gf / 2 * 2 * h).toFixed(1), unit: 'J' },
        { label: '结论', val: '省力不省功', unit: '' },
      ];
    },
    dispose() { scene.remove(grp); },
  };
}
