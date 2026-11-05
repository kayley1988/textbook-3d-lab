/* ============================================================
   黄金样例：动能 Ek = ½mv²（斜面小球撞木块）
   —— 这个文件是「教材 3D 课件」Skill 的写法范本。
   生成新场景时，照抄结构、替换内容，不要改动 create 的返回契约。
   ============================================================ */

export const meta = {
  tag: '物理 · 八年级 · 动能',
  title: '动能：速度翻倍，能量翻四倍',
  lead: '同一辆自行车，骑快一点和骑慢一点，刹车距离差的可不止一点。动能到底和什么有关？用斜面小球把木块撞出去，让"看不见的能量"变成"量得出来的距离"。',

  concept: `
    <p>运动的物体具有<b>动能</b>。小球从斜面滚下，把木块推出去——<em>木块被推得越远，说明小球动能越大</em>。</p>
    <p>这里用了<b>转换法</b>：动能看不见，但木块滑行的距离看得见。距离就是动能的"尺子"。</p>
    <p>改两个量：<em>释放高度</em>（决定到底速度）和<em>小球质量</em>，分别看距离怎么变。</p>`,

  formula: {
    expr: 'E<sub>k</sub> <span class="op">=</span> ½ <span class="var">m</span><span class="var">v</span><sup>2</sup>',
    note: '动能与质量成正比，与速度的平方成正比。速度翻倍 → 动能变 4 倍，所以超速最危险。',
  },

  points: [
    '高度 h 越高 → 到底速度 v 越大 → 木块被推得越远',
    '质量 m 越大 → 同样速度下动能越大 → 推得更远',
    '对照两次实验（淡蓝幽灵块 = 上一次的结果）才能看出"和谁成正比"',
  ],

  question: '同一辆车，40 km/h 和 80 km/h，刹车距离应该是 2 倍还是 4 倍？为什么现实中往往比 4 倍还多？',

  controls: [
    { key: 'h0', label: '释放高度 h', min: 0.2, max: 1.2, step: 0.05, value: 0.6, unit: ' m' },
    { key: 'm', label: '小球质量 m', min: 0.5, max: 4.0, step: 0.1, value: 2.0, unit: ' kg' },
  ],

  cam: { pos: [3.2, 4.6, 11.5], target: [0.2, 1.2, 0] },
};

export function create({ scene, addLabel, setReadouts }) {
  const G = 10;                    // 教学取整，便于口算
  const grp = new THREE.Group();
  scene.add(grp);

  /* ---------- 尺寸基准 ---------- */
  const RAMP_LEN = 2.1;            // 斜面水平投影长度
  const BLOCK_START = 0.35;
  const BALL_R = 0.24;

  /* ---------- 地面与斜面 ---------- */
  const ground = box(7.4, 0.1, 1.4, M('#a67c52', { rough: 0.72 }));
  ground.position.set(0.9, -0.05, 0);
  ground.receiveShadow = true;
  grp.add(ground);

  const rampGrp = new THREE.Group();
  rampGrp.position.set(-2.1, 0, 0);
  grp.add(rampGrp);

  const board = box(RAMP_LEN, 0.09, 1.3, M('#b98d5e', { rough: 0.66 }));
  board.position.y = 0.045;
  rampGrp.add(board);

  // 楔形支撑：随斜面角度拉伸
  const tri = new THREE.Shape();
  tri.moveTo(0, 0);
  tri.lineTo(-RAMP_LEN, 0);
  tri.lineTo(-RAMP_LEN, 1);
  tri.closePath();
  const wedge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tri, { depth: 1.3, bevelEnabled: false }),
    M('#9c7448', { rough: 0.68 }));
  wedge.position.z = -0.65;
  wedge.castShadow = true;
  wedge.receiveShadow = true;
  rampGrp.add(wedge);

  /* ---------- 刻度尺（量木块滑行距离） ---------- */
  const rc = document.createElement('canvas');
  rc.width = 1024; rc.height = 96;
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
  const rulerTex = new THREE.CanvasTexture(rc);
  rulerTex.colorSpace = THREE.SRGBColorSpace;
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.46),
    new THREE.MeshBasicMaterial({ map: rulerTex, transparent: true }));
  ruler.rotation.x = -Math.PI / 2;
  ruler.position.set(1.3, 0.012, 0.78);
  grp.add(ruler);

  /* ---------- 木块与小球 ---------- */
  const block = box(0.62, 0.45, 0.6, M('#c9a35c', { rough: 0.55 }));
  block.position.set(BLOCK_START, 0.28, 0);
  grp.add(block);

  const ball = sph(BALL_R, M(ECOL.KE, { rough: 0.32, emissive: '#7a2408', ei: 0.25 }));
  grp.add(ball);

  // 运动拖尾：让"速度"看得见
  const tail = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.13, 0.5, 4, 10),
    new THREE.MeshBasicMaterial({ color: ECOL.KE, transparent: true, opacity: 0.28 }));
  tail.visible = false;
  grp.add(tail);

  // 幽灵块：上一次实验的终点，用于对照
  const ghost = box(0.62, 0.45, 0.6,
    new THREE.MeshBasicMaterial({ color: '#9db6c4', transparent: true, opacity: 0.34 }));
  ghost.visible = false;
  grp.add(ghost);

  /* ---------- 锚点与标签 ---------- */
  const mk = (x, y, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); grp.add(o); return o; };

  const labH = addLabel('', mk(-2.0, 2.0), { dy: -8 });
  const labW = addLabel('', mk(BLOCK_START, 1.25), { dy: -8 });
  const labS = addLabel('', mk(1.3, 0.6, 0.78), { dy: -8 });
  labH.el.style.cssText += ';background:#2fa36b;color:#fff;border-color:#2fa36b';
  labW.el.style.cssText += ';background:#c2401e;color:#fff;border-color:#c2401e';
  labS.el.style.cssText += ';background:#3f518c;color:#fff;border-color:#3f518c;font-size:13px';

  /* ---------- 物理（示范口径，非严格推导） ---------- */
  const sceneH = p => 0.35 + p.h0 * 1.25;                 // 释放高度（场景单位 = m）
  const rampAng = p => Math.atan2(sceneH(p), RAMP_LEN);
  const vEnd = p => Math.sqrt(2 * G * sceneH(p) * 0.55);  // 到底速度
  const slideOf = (p, v) => 0.09 * p.m * v * v;           // 滑距 ∝ m·v²

  function layout(p) {
    const H = sceneH(p), ang = rampAng(p);
    board.rotation.z = -ang;
    board.position.set(-RAMP_LEN / 2 * Math.cos(ang), H / 2 + 0.05, 0);
    wedge.scale.y = H;
    return ang;
  }

  function placeBall(p, k) {           // k: 0 = 斜顶, 1 = 斜底
    const H = sceneH(p), ang = rampAng(p);
    const len = Math.hypot(H, RAMP_LEN);
    const d = len * (1 - k);
    const topX = rampGrp.position.x - RAMP_LEN * Math.cos(ang);
    ball.position.set(
      topX + d * Math.cos(ang),
      H - d * Math.sin(ang) + BALL_R * Math.cos(ang),
      0);
    ball.rotation.z -= 0.02;
  }

  /* ---------- 状态机 ---------- */
  let phase = 'idle', t = 0, vNow = 0, sNow = 0, lastRun = null;

  function resetScene(p) {
    phase = 'idle'; t = 0; vNow = 0; sNow = 0;
    block.position.x = BLOCK_START;
    ghost.visible = false;
    tail.visible = false;
    placeBall(p, 0);
  }

  return {
    play(p) { phase = 'roll'; t = 0; vNow = 0; ghost.visible = false; },

    update(dt, p) {
      layout(p);
      const v2 = vEnd(p) ** 2;
      const sMax = slideOf(p, vEnd(p));
      const hitX = BLOCK_START + 0.31 + BALL_R;

      if (phase === 'idle') {
        placeBall(p, 0);
        tail.visible = false;
        labH.el.textContent = `① 释放高度 h = ${p.h0.toFixed(2)} m`;
        labW.el.textContent = '② 撞击后木块被推出';
        labS.el.textContent = '▶ 点「开始」让小球滚下来';
        labH.el.style.opacity = 0.9;
        labW.el.style.opacity = 0.45;
        labS.el.style.opacity = 0.9;
      }

      else if (phase === 'roll') {
        t += dt;
        const H = sceneH(p), ang = rampAng(p);
        const len = Math.hypot(H, RAMP_LEN);
        const acc = G * Math.sin(ang) * 0.6;
        const d = Math.min(0.5 * acc * t * t, len);
        placeBall(p, d / len);
        vNow = Math.sqrt(2 * acc * d);
        labH.el.textContent = `① h = ${p.h0.toFixed(2)} m → v = ${vNow.toFixed(1)} m/s`;
        labH.el.style.opacity = 1;
        if (d >= len - 1e-3) { phase = 'flat'; t = 0; }
      }

      else if (phase === 'flat') {
        t += dt;
        vNow = vEnd(p);
        ball.position.x += vNow * dt;
        ball.position.y = BALL_R;
        ball.rotation.z -= vNow * dt / BALL_R;
        tail.visible = true;
        tail.position.copy(ball.position);
        tail.rotation.set(0, 0, Math.PI / 2);
        tail.scale.setScalar(0.7 + vNow * 0.1);
        if (ball.position.x >= hitX) { phase = 'hit'; t = 0; }
      }

      else if (phase === 'hit') {
        t += dt;
        const dec = 4.2;
        const disp = Math.min(sMax * (1 - Math.exp(-dec * t) * (1 + dec * t)), sMax);
        block.position.x = BLOCK_START + disp;
        ball.position.x = Math.max(hitX, block.position.x - 0.55);
        ball.position.y = BALL_R;
        tail.visible = false;
        sNow = disp;

        labW.el.textContent = `② 木块被推出 s = ${disp.toFixed(2)} dm`;
        labW.el.style.opacity = 1;
        labS.el.textContent = `③ 距离 s 越大 ⇒ 动能越大`;
        labS.el.style.opacity = 0.9;

        if (disp >= sMax - 1e-3) {
          phase = 'done'; t = 0;
          lastRun = { h0: p.h0, m: p.m, s: sMax };
        }
      }

      else if (phase === 'done') {
        const Ek = 0.5 * p.m * v2;
        labW.el.textContent = `② W = f·s，木块滑行 s = ${sNow.toFixed(2)} dm`;
        labS.el.textContent = `③ s ∝ m·v²　⇒　Ek = ½mv² = ${Ek.toFixed(1)} J`;
        labS.el.style.opacity = 1;
      }

      // 幽灵块：参数变了就显示上次终点
      if (lastRun && phase !== 'roll' && (Math.abs(lastRun.h0 - p.h0) > 1e-6 || Math.abs(lastRun.m - p.m) > 1e-6)) {
        ghost.visible = true;
        ghost.position.x = BLOCK_START + lastRun.s;
        ghost.position.y = block.position.y;
      }
    },

    reset(p) { resetScene(p); },

    readouts(p) {
      const v = vEnd(p);
      return [
        { label: '释放高度', val: p.h0.toFixed(2), unit: 'm' },
        { label: '到底速度', val: v.toFixed(1), unit: 'm/s' },
        { label: '木块滑距', val: sNow.toFixed(2), unit: 'dm' },
        { label: '动能 Ek', val: (0.5 * p.m * v * v).toFixed(1), unit: 'J' },
      ];
    },
  };
}
