/* ============================================================
   语文 · 一年级上册 · 课文《乌鸦喝水》
   ------------------------------------------------------------
   过程剧场：乌鸦把石子一颗颗投进瓶子里，水位真实上升——
   石子占了瓶子里的空间（体积），水被挤上来。
   这是课文里少见的"可以量"的内容。
   ============================================================ */

export const meta = {
  tag: '语文 · 一年级上册 · 课文',
  title: '乌鸦喝水：石子占的地方，就是水升上来的地方',
  lead: '瓶子里的水太少，乌鸦喝不着。它把小石子一颗一颗放进瓶子——水为什么就升高了？拖动滑块数一数，答案就在水位线上。',

  concept: `
    <p>石子看着小，但每颗都<b>占着瓶子里的空间</b>。石子进去多少，水就被挤上来多少。</p>
    <p>看右边的读数：<em>水位跟着石子数一格一格涨</em>。等水位升到瓶口附近，乌鸦就喝着水了。</p>
    <p>这其实是数学课的"体积"：占的地方越多，挤上来的水越多。</p>`,

  formula: {
    label: '道理',
    expr: '石子 <span class="op">→</span> 占空间 <span class="op">→</span> 水升高',
    note: '石子越多，占的地方越大，水面升得越高。',
  },

  points: [
    '瓶子没变、水没加——水是自己"升"上去的',
    '每投一颗石子，水位就涨一格',
    '石子放得越多，乌鸦越容易喝到水',
  ],

  question: '如果乌鸦放进的是沙子，水会升得更快还是更慢？如果放的是大石块呢？',

  controls: [
    { key: 'stones', label: '石子数量', min: 0, max: 14, step: 1, value: 0, unit: '颗' },
  ],

  controlsLabel: '投石子',
  playLabel: '演一遍',
  readoutLabel: '瓶子里的情况',
  tts: true,
  ttsLabel: '读一遍',

  cam: { pos: [1.5, 3.0, 6.6], target: [-0.25, 2.1, 0] },
};

export function create({ scene, camera, controls, addLabel }) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  /* ================= 一、场景：石台与瓶子 ================= */
  const ground = box(8.5, 0.3, 6, M('#b9b0a0', { rough: 0.9, env: 0.25 }));
  ground.position.y = -0.15;
  ground.receiveShadow = true;
  scene.add(ground);

  // 瓶子参数（加高瓶身，让"升到瓶口"有过程感）
  const BOT_R = 0.68, BOT_H = 4.2;
  const BOT_Y = BOT_H / 2 + 0.02;

  const glassEdge = M('#5a7a8a', { rough: 0.3, transparent: true, opacity: 0.85 });
  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(BOT_R * 0.99, 0.03, 8, 44), glassEdge);
  ringTop.rotation.x = Math.PI / 2; ringTop.position.set(-0.6, BOT_H, 0); scene.add(ringTop);
  const ringBot = new THREE.Mesh(new THREE.TorusGeometry(BOT_R * 1.05, 0.03, 8, 44), glassEdge);
  ringBot.rotation.x = Math.PI / 2; ringBot.position.set(-0.6, 0.08, 0); scene.add(ringBot);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, BOT_H - 0.1, 0.03), glassEdge);
    v.position.set(-0.6 + Math.cos(a) * BOT_R * 1.0, BOT_H / 2, Math.sin(a) * BOT_R * 1.0);
    v.visible = i % 2 === 0;   // 只留 4 条竖棱，避免太乱
    scene.add(v);
  }
  // 瓶身侧壁（让玻璃更可见）
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(BOT_R, BOT_R * 1.06, BOT_H, 44, 1, true),
    glassMat('#dceef5', 0.26));
  bottle.position.set(-0.6, BOT_H / 2 + 0.02, 0);
  scene.add(bottle);
  // 瓶底
  const botBase = cyl(BOT_R * 1.02, BOT_R * 1.06, 0.06, glassMat('#dceef5', 0.25));
  botBase.position.set(-0.6, 0.05, 0);
  scene.add(botBase);
  // 瓶口
  const rim = new THREE.Mesh(new THREE.TorusGeometry(BOT_R * 0.98, 0.055, 10, 40), M('#8a7f6c', { rough: 0.5 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(-0.6, BOT_H + 0.02, 0);
  scene.add(rim);

  // 瓶内水：圆柱，高度动态（底部固定瓶底，scale.y 放大高度）
  const WAT_R = BOT_R - 0.045;
  const waterGeo = new THREE.CylinderGeometry(WAT_R, WAT_R, 1, 40);
  waterGeo.translate(0, 0.5, 0);           // 原点在底部，scale.y = 水位
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: '#3f8ec6', transparent: true, opacity: 0.85,
    roughness: 0.1, metalness: 0, clearcoat: 0.7, envMapIntensity: 0.9,
    emissive: '#3f8ec6', emissiveIntensity: 0.08,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.set(-0.6, 0.06, 0);       // 底部固定在瓶底上方一点
  scene.add(water);

  /* ================= 二、乌鸦 ================= */
  const crow = new THREE.Group();
  const bodyMat = M('#26221e', { rough: 0.55, env: 0.7 });
  const body = sph(0.34, bodyMat); body.scale.set(1.15, 0.9, 0.8);
  crow.add(body);
  const head = sph(0.2, bodyMat); head.position.set(0.34, 0.3, 0);
  crow.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 10), M('#d9a13c', { rough: 0.4 }));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.58, 0.26, 0);
  crow.add(beak);
  const tail = box(0.42, 0.08, 0.2, bodyMat);
  tail.position.set(-0.42, 0.08, 0); tail.rotation.z = 0.35;
  crow.add(tail);
  const wingL = box(0.5, 0.05, 0.26, M('#332e28', { rough: 0.6 }));
  wingL.position.set(0, 0.16, 0.3); crow.add(wingL);
  const wingR = wingL.clone(); wingR.position.z = -0.3; crow.add(wingR);
  const legL = box(0.035, 0.3, 0.035, M('#8a6a30', { rough: 0.5 }));
  legL.position.set(0.05, -0.5, 0.06); crow.add(legL);
  const legR = legL.clone(); legR.position.z = -0.06; crow.add(legR);
  crow.position.set(0.9, BOT_H + 0.55, 0);
  scene.add(crow);

  /* ================= 三、石子 ================= */
  const STONES = [];
  const stoneMats = [M('#8d8577', { rough: 0.85 }), M('#9a9284', { rough: 0.85 }), M('#7c7468', { rough: 0.85 })];
  for (let i = 0; i < 14; i++) {
    const r = 0.14 + (i * 37 % 5) * 0.018;
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), stoneMats[i % 3]);
    s.castShadow = true;
    s.visible = false;
    scene.add(s);
    STONES.push(s);
  }

  /* ================= 四、标签 ================= */
  const ancMouth = new THREE.Object3D(), ancWater = new THREE.Object3D(), ancCrow = new THREE.Object3D();
  scene.add(ancMouth, ancWater, ancCrow);
  ancMouth.position.set(-0.6, BOT_H + 0.42, 0);
  ancWater.position.set(-1.85, 1.9, 0);
  ancCrow.position.set(0.9, BOT_H + 1.35, 0);
  const labMouth = addLabel('瓶口', ancMouth, { sub: '水面够到这里才喝得着' });
  const labWater = addLabel('水面', ancWater, { sub: '水太少' });
  const labCrow = addLabel('乌鸦', ancCrow, { sub: '喝不着，怎么办？' });

  /* 水位目标线（瓶口虚线） */
  const mouthLine = dashedLine(
    [new THREE.Vector3(-0.6 - BOT_R - 0.35, BOT_H - 0.12, 0), new THREE.Vector3(-0.6 + BOT_R + 0.35, BOT_H - 0.12, 0)],
    '#c2401e', 0.09, 0.07);
  scene.add(mouthLine);

  /* ================= 五、TTS ================= */
  let voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const zh = (speechSynthesis.getVoices() || []).filter(v => /^zh/i.test(v.lang));
    voice = zh.find(v => /xiaoxiao/i.test(v.name)) || zh.find(v => /natural|online/i.test(v.name))
      || zh.find(v => /female|yaoyao|huihui/i.test(v.name)) || zh[0] || null;
  }
  pickVoice();
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = pickVoice;
  let ttsTimer = null;
  function ttsSay(text) {
    if (!window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = 'zh-CN'; u.rate = 0.88; u.pitch = 1.06;
      clearTimeout(ttsTimer);
      ttsTimer = setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 90);
    } catch (e) {}
  }

  /* ================= 六、物理与状态 ================= */
  // 每颗石子置换体积 → 水位上升
  const STONE_VOL = 0.0125;                 // 单颗置换（世界单位³，调出来的教学值）
  const BOTTLE_AREA = Math.PI * WAT_R * WAT_R;
  const RISE_PER_STONE = STONE_VOL / BOTTLE_AREA * 5.2;  // 视觉可读的放大系数
  const W0 = 1.1;                          // 初始水位（约瓶高1/4，喝不着）
  const state = { n: 0, disp: 0, tgtN: 0, phase: 'idle', t: 0, dropT: 0, spokenN: -1 };

  function waterLevel(n) { return W0 + n * RISE_PER_STONE; }

  function placeSettled(i) {
    // 石子落底后的堆叠位（近似：瓶底两层）
    const s = STONES[i];
    const row = i < 8 ? 0 : 1;
    const ang = (i * 2.399) % (Math.PI * 2);          // 黄金角散布
    const rad = row === 0 ? (i % 3) * 0.16 : 0.24;
    s.position.set(
      -0.6 + Math.cos(ang) * rad,
      0.14 + row * 0.2 + (i % 2) * 0.04,
      Math.sin(ang) * rad * 1.4);
    s.rotation.set(i * 1.1, i * 0.7, i * 0.5);
  }

  function applyState(dt) {
    const k = Math.min(1, dt * 4);
    state.disp = lerp(state.disp, state.tgtN, k);

    // 水位
    const lv = waterLevel(state.disp);
    water.scale.y = lv;
    water.position.y = 0.06;

    // 石子：已投下的可见并落位
    STONES.forEach((s, i) => {
      if (i < Math.round(state.disp)) {
        s.visible = true;
        if (i !== state.falling || state.phase === 'idle') placeSettled(i);
      } else if (state.phase !== 'drop') {
        s.visible = false;
      }
    });

    // 水面标签跟随
    ancWater.position.set(-1.78, 0.08 + lv + 0.18, 0);
    labWater.el.innerHTML = lv > BOT_H - 0.75
      ? '水面<span class="sub">够到瓶口啦！</span>'
      : `水面<span class="sub">升到 ${(lv * 10).toFixed(0)} 格</span>`;

    // 乌鸦姿态：喝不着时抬头张望，够着了低头
    const reach = lv > BOT_H - 0.7;
    crow.rotation.z = lerp(crow.rotation.z, reach ? 0.55 : -0.06, k);
    crow.position.y = lerp(crow.position.y, BOT_H + 0.55, k);
  }

  function startShow() {
    state.phase = 'drop'; state.t = 0; state.dropT = 0;
    state.tgtN = 12; state.spokenN = -1;
    STONES.forEach(s => { s.visible = false; });
  }

  try {
    if (new URLSearchParams(location.search).get('auto')) setTimeout(startShow, 700);
  } catch (e) {}

  return {
    play() { startShow(); },

    speak() {
      const n = Math.round(state.disp);
      if (waterLevel(n) > BOT_H - 0.7) ttsSay('水升到瓶口了，乌鸦喝着水啦！');
      else ttsSay(n === 0
        ? '瓶子里有水，可是水太少，瓶口又小，乌鸦喝不着。'
        : `已经放进${n}颗石子，水位升到 ${(waterLevel(n) * 10).toFixed(0)} 格。石子越多，水升得越高。`);
    },

    __dbgState() { return state; },

    update(dt, p) {
      state.t += dt;

      if (state.phase === 'drop') {
        // 逐颗投石：每 0.55s 一颗
        state.dropT += dt;
        const idx = Math.floor(state.dropT / 0.55);
        if (idx > state.falling || (state.falling === undefined && idx === 0)) {
          state.falling = Math.min(idx, 13);
          state.tgtN = Math.min(idx + 1, 12);
        }
        if (idx <= 13 && STONES[idx]) {
          const s = STONES[idx];
          const ph = (state.dropT % 0.55) / 0.55;
          const target = new THREE.Vector3();
          placeSettled(idx); target.copy(s.position);
          s.visible = true;
          // 从乌鸦嘴抛物线落进瓶口
          s.position.set(
            lerp(0.9, target.x, smooth(ph)),
            lerp(BOT_H + 0.5, target.y, ph * ph) + Math.sin(ph * Math.PI) * 0.9,
            lerp(0, target.z, smooth(ph)));
          s.rotation.x += dt * 6; s.rotation.z += dt * 4;
        }
        if (state.dropT > 12 * 0.55 + 0.8) {
          state.phase = 'idle'; state.falling = undefined;
          STONES.forEach((s, i) => placeSettled(i));
        }
      } else {
        state.falling = undefined;
        // 滑块模式：直接设置数量，石子已落底的显示
        state.tgtN = Math.round(p.stones);
      }

      // 到位播报一次
      const lv = waterLevel(state.disp);
      if (lv > BOT_H - 0.7 && state.spokenN !== state.tgtN && state.phase === 'idle' && state.tgtN > 0) {
        state.spokenN = state.tgtN;
        ttsSay('一颗一颗石子放进去，水慢慢升高了。乌鸦把嘴伸进瓶子里，喝着水啦！');
      }

      applyState(dt);
    },

    reset(p) {
      state.phase = 'idle'; state.t = 0; state.tgtN = 0; state.disp = 0;
      state.falling = undefined; state.spokenN = -1;
      STONES.forEach(s => { s.visible = false; });
    },

    readouts() {
      const n = Math.round(state.disp);
      const lv = waterLevel(n);
      const toMouth = Math.max(0, (BOT_H - 0.12 - lv) * 10).toFixed(0);
      return [
        { label: '石子', val: String(n), unit: '颗' },
        { label: '水位', val: (lv * 10).toFixed(0), unit: '格' },
        { label: '离瓶口', val: toMouth, unit: '格' },
        { label: '乌鸦', val: lv > BOT_H - 0.7 ? '喝着啦' : '还够不着', unit: '' },
      ];
    },
  };
}
