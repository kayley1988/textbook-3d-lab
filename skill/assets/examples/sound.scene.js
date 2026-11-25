/* ============================================================
   《声音的传播》逼真版 —— 物理八上 P34
   鼓面真实振动（简谐振子） + 空气分子 GPU 粒子（疏密波）
   + 声波光晕（发光 sprite + 波前扩散）
   + Studio 软阴影（VSM + 接触阴影，对标 Machine Skill LabKit）
   ============================================================ */
import { M, box, cyl, sph, createStage, autoFrame, makeParticles, Phys, enableStudio, glowSprite } from '../runtime/lab.js';
import * as THREE from 'three';

export const meta = {
  tag: '物理 · 八年级 · 声现象',
  title: '声音的传播：看不见的波',
  lead: '鼓面一敲，周围空气跟着振动，形成疏密相间的波，向远处传。',
  concept: '<p>以击鼓为例：<b>鼓面振动</b>带动周围的空气振动，形成了<b>疏密相间的波动</b>，向远处传播。这个过程跟<b>水波</b>相似——用铅笔轻点水面，水面形成一圈圈水波。</p><p>声音以<b>波</b>的形式传播，我们把它叫做<b>声波</b>。真空不能传声，传声需要<b>介质</b>。</p>',
  formula: { expr: 'v = f · λ', note: '波速 = 频率 × 波长（f 越高、λ 越短）' },
  points: ['鼓面振动 → 空气分子疏密交替 → 声波向远处传', '声音需要介质（气/固/液），真空不能传声', '声波跟水波一样，都是机械波'],
  question: '为什么太空中两位宇航员离得很近也要靠无线电交谈？',
  controls: [
    { key: 'freq', label: '振动频率 f', min: 1, max: 8, step: 0.1, value: 3, unit: 'Hz' },
    { key: 'amp', label: '振幅 A', min: 0.2, max: 2, step: 0.05, value: 1.0, unit: '' },
  ],
  cam: { pos: [0, 2.8, 10.5], target: [0, 1.0, 0] },
};

export function create({ scene, camera, controls, addLabel, setReadouts }) {
  const Y0 = 1.35;   // 鼓立在书页上方（纸面 y=0，鼓面高约 1.35）
  const grp = new THREE.Group();
  scene.add(grp);

  /* ============ 〇、教材底座：课本打开到 P34，模型悬浮其上 ============ */
  // 纸面（承载教材页）：足够大，让鼓与粒子浮在书页上方
  const pageGeo = new THREE.PlaneGeometry(14, 9);
  pageGeo.rotateX(-Math.PI / 2);
  const pageMat = new THREE.MeshPhysicalMaterial({
    color: '#a39277', roughness: 0.94, metalness: 0, clearcoat: 0, envMapIntensity: 0.22,
  });
  const page = new THREE.Mesh(pageGeo, pageMat);
  page.position.y = 0.02;
  page.receiveShadow = true;
  scene.add(page);
  // 教材底图就绪后替换纸面（build.py 带 --book-page 时注入 window.__BOOKTEX）
  (function tryBookTex(){
    if (window.__BOOKTEX) {
      pageMat.map = window.__BOOKTEX;
      pageMat.color.set('#ffffff');   // 教材页本身有底色，不再压暗
      pageMat.needsUpdate = true;
    } else {
      setTimeout(tryBookTex, 120);
    }
  })();
  // 课本厚度（纸面下的硬纸板书页）
  const board = box(14, 0.1, 9, M('#e2d5b8', { rough: 0.85, env: 0.3 }));
  board.position.y = -0.05;
  board.receiveShadow = true;
  scene.add(board);

  /* ============ 一、鼓（振子） ============ */
  const drum = new THREE.Group();
  const drumBody = cyl(1.35, 1.35, 0.42, M('#8a4a2b', { rough: 0.55 }), 48);
  drum.add(drumBody);
  const skin = new THREE.Mesh(
    new THREE.CircleGeometry(1.32, 48),
    M('#e8d9b8', { rough: 0.6, env: 0.4 })
  );
  skin.rotation.x = -Math.PI / 2;
  skin.position.y = 0.22;
  drum.add(skin);
  // 鼓面边缘环
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.33, 0.05, 10, 48),
    M('#a8623a', { rough: 0.5, coat: 0.2 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  drum.add(rim);
  // 鼓槌
  const stick = cyl(0.055, 0.055, 1.5, M('#7a5230', { rough: 0.6 }), 16);
  stick.rotation.z = Math.PI / 2.4;
  stick.position.set(1.6, 0.9, 0.6);
  grp.add(stick);
  const knob = sph(0.12, M('#c8b088', { rough: 0.5 }));
  knob.position.set(2.1, 1.15, 0.6);
  grp.add(knob);

  drum.position.set(0, Y0 + 0.2, 0);
  grp.add(drum);

  /* ============ 二、空气分子（GPU 粒子：疏密波） ============ */
  const molCount = 260;
  const mols = makeParticles(scene, {
    count: molCount, size: 0.16, color: '#4a90d9', opacity: 0.95, drag: 0.0,
    life: 9999, additive: false,
  });
  // 初始：粒子分布在鼓右方，x 方向成排，但每颗粒子加随机抖动（热运动感，不再是"点阵图"）
  const molData = [];
  for (let i = 0; i < molCount; i++) {
    const row = Math.floor(i / 20);
    const col = i % 20;
    // 基准网格位置：粒子集中在鼓面高度附近的空气中（纸面上方），不沉到书页下
    const bx = 1.4 + col * 0.42;          // 从鼓面往右
    const by = Y0 + 0.2 + (row - 6.5) * 0.20;   // 竖直散布收窄（±1.3），悬浮在纸面上方
    // 随机抖动：x/y 各 ±0.09，让粒子不排成整齐方阵
    const jx = (Math.random() - 0.5) * 0.18;
    const jy = (Math.random() - 0.5) * 0.18;
    const x = bx + jx, y = by + jy;
    const z = (Math.random() - 0.5) * 0.1;
    molData.push({ x, y0: y, z, base: bx, jy });
    mols.points.geometry.attributes.position.array[i * 3] = x;
    mols.points.geometry.attributes.position.array[i * 3 + 1] = y;
    mols.points.geometry.attributes.position.array[i * 3 + 2] = z;
  }
  // 关键：初始化后标记更新 + 重算包围球 + 关视锥裁剪（否则被 cull 掉）
  mols.points.geometry.attributes.position.needsUpdate = true;
  mols.points.geometry.computeBoundingSphere();
  mols.points.frustumCulled = false;

  /* ============ 三、声波光晕（bloom 触发物） ============ */
  // 从鼓面向右的声波波前（半透明球壳，随振动向外扩）
  const waveFronts = [];
  for (let i = 0; i < 3; i++) {
    const wf = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({
        color: '#7fd0ff', transparent: true, opacity: 0.0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    wf.position.copy(drum.position);
    wf.visible = false;
    grp.add(wf);
    waveFronts.push(wf);
  }

  // 发光点（在鼓面中心，bloom 触发）
  const glowCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffe9b0' })
  );
  glowCore.position.set(0, Y0 + 0.22, 0);
  grp.add(glowCore);
  // 光晕 sprite
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowSprite(), color: '#ffe9b0', transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  halo.scale.setScalar(2.2);
  halo.position.set(0, Y0 + 0.22, 0);
  grp.add(halo);

  /* ============ 四、标签 ============ */
  const labDrum = addLabel('鼓面振动', new THREE.Object3D(), { dx: 0, dy: -40 });
  labDrum.anchor.position.set(0, Y0 + 0.8, 0);
  labDrum.anchor.visible = true;
  grp.add(labDrum.anchor);

  const labWave = addLabel('疏密波 → 向右传', new THREE.Object3D(), { dx: 0, dy: -18 });
  labWave.anchor.position.set(4.6, Y0 + 0.2, 0);
  labWave.anchor.visible = true;
  grp.add(labWave.anchor);

  /* ============ 五、状态机 ============ */
  const state = { phase: 'idle', t: 0, freq: 3, amp: 1, written: 0 };
  let bloom = null;

  function apply(dt) {
    const f = state.freq, A = state.amp;
    const om = f * 2 * Math.PI;
    // 鼓面振动（真实简谐振子）
    const disp = Phys.oscillator(A * 0.09, om, state.t);
    skin.position.y = 0.22 + disp;
    // 空气分子：每个粒子 x 方向受鼓面振动影响，形成疏密波（纵波）
    const arr = mols.points.geometry.attributes.position.array;
    for (let i = 0; i < molCount; i++) {
      const m = molData[i];
      // 声波传播：x 位置 = 基准 + 随距离衰减的振动
      const dx = m.base - 1.4;                       // 距鼓面距离
      const phase = om * (state.t - dx / 6.5);       // 波速 6.5 单位/s
      const damp = Math.exp(-dx * 0.07);             // 距离衰减
      // 纵波：沿传播方向（x）来回推拉，幅度随振幅 A 放大（A=1 时 ±0.30）
      const wiggle = A * 0.30 * Math.sin(phase) * damp;
      // y 向微抖：保持"空气分子"的弥漫感，不是纯一维排列
      const ywig = A * 0.05 * Math.sin(phase * 0.5 + m.jy * 7) * damp;
      arr[i * 3] = m.base + wiggle;
      arr[i * 3 + 1] = m.y0 + ywig;
    }
    mols.points.geometry.attributes.position.needsUpdate = true;

    // 波前光晕：每 0.5s 从鼓面发出一个向外扩的球壳
    state.t += dt;
    if (state.phase !== 'idle') {
      const cyc = state.t % 0.6;
      const prog = cyc / 0.6;
      for (let i = 0; i < waveFronts.length; i++) {
        const wf = waveFronts[i];
        const p = (prog + i * 0.33) % 1;
        wf.visible = p < 0.9;
        const r = 0.5 + p * 7.5;
        wf.scale.setScalar(r);
        wf.material.opacity = 0.35 * (1 - p) * (state.amp * 0.6 + 0.4);
      }
    }
    // glow 呼吸
    glowCore.material.color.setHSL(0.11, 0.9, 0.6 + 0.1 * Math.sin(state.t * 6));
    halo.material.opacity = 0.4 + 0.15 * Math.sin(state.t * 6);

    // 读数
    setReadouts([
      { label: '频率 f', val: state.freq.toFixed(1), unit: 'Hz' },
      { label: '振幅 A', val: state.amp.toFixed(1), unit: '' },
      { label: '波长 λ', val: (6.5 / state.freq).toFixed(2), unit: '单位' },
      { label: '波速 v', val: 6.5, unit: '单位/s' },
    ]);
  }

  /* ============ 六、初始化 ============ */
  apply(0);
  autoFrame(camera, controls, grp, { pad: 1.22 });

  return {
    update(dt, p) {
      state.freq = p.freq; state.amp = p.amp;
      apply(dt);
    },
    play(p) {
      state.phase = 'running';
      state.t = 0;
      apply(0.016);
    },
    reset(p) {
      state.phase = 'idle';
      state.t = 0;
      apply(0);
      autoFrame(camera, controls, grp, { pad: 1.22, force: true });
    },
    ready(stage) {
      // 逼真模式：VSM 软阴影 + 接触阴影盘（对标 Machine Skill LabKit）
      // 不依赖 RT 后处理，SwiftShader 下也稳定
      try {
        if (!window.__studio) {
          window.__studio = enableStudio(stage, { shadowRadius: 7, blurSamples: 16, contactShadow: true });
          window.__studio.enable();
        }
      } catch (e) { console.warn('studio:', e.message); }
    },
    speak() {
      try {
        const u = new SpeechSynthesisUtterance('声音以波的形式传播，鼓面振动带动空气形成疏密相间的波。');
        u.lang = 'zh-CN';
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {}
    },
  };
}
