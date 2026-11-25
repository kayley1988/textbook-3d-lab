/* ============================================================
   数学 · 一年级上册 · 准备课《数一数》
   ------------------------------------------------------------
   以教材学校场景图为底座，3D 展示"数一数"：国旗/花朵/小朋友
   等可计数的元素，逐个点亮，孩子数一个亮一个。
   ============================================================ */

export const meta = {
  tag: '数学 · 一年级上册 · 准备课',
  title: '数一数：校园里有多少？',
  lead: '开学啦！数一数校园里的东西：几面旗、几朵花、几个小朋友。点一个数一个，数清楚了才叫"会数数"。',

  concept: `
    <p>数学的第一步是<b>数数</b>。数数要<b>指着点着数</b>，一个一个数，不重复不漏掉。</p>
    <p>看 3D 校园：<em>国旗 1 面、红花 8 盆、小朋友 7 个</em>。点"数一数"，从 1 数到 8，每数一个就亮一个。</p>
    <p>想一想：数完 8 盆花，第 9 个是什么？数数时最后数到的数，就是一共有多少个。</p>`,

  formula: {
    label: '数的含义',
    expr: '最后数到的数 <span class="op">=</span> 一共有多少个',
    note: '1、2、3……数到几，就是几个。',
  },

  points: [
    '数数要一个一个数，不跳不漏',
    '国旗 1 面，红花 8 盆，小朋友 7 个',
    '最后数到的数，就是总数',
  ],

  question: '校园里还有哪些可以数？数一数树有几棵、垃圾箱有几个。',

  controls: [
    { key: 'count', label: '数到几', min: 0, max: 8, step: 1, value: 0, unit: '' },
  ],

  controlsLabel: '数一数',
  playLabel: '自动数',
  readoutLabel: '校园里',
  tts: true,
  ttsLabel: '读一遍',

  cam: { pos: [0, 4.2, 10.5], target: [0, 2.2, 0] },
};

export function create({ scene, camera, controls, addLabel }) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  /* ================= 一、纸面（教材学校图） ================= */
  const pageGeo = new THREE.PlaneGeometry(5.2, 7.3);
  pageGeo.rotateX(-Math.PI / 2);
  const pageMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.95, metalness: 0, envMapIntensity: 0.15,
  });
  const page = new THREE.Mesh(pageGeo, pageMat);
  page.position.y = 0.02;
  page.receiveShadow = true;
  scene.add(page);

  const board = box(5.2, 0.08, 7.3, M('#dcd2b8', { rough: 0.85, env: 0.3 }));
  board.position.y = -0.04;
  board.receiveShadow = true;
  scene.add(board);

  (function tryBookTex() {
    if (window.__BOOKTEX) {
      pageMat.map = window.__BOOKTEX;
      pageMat.needsUpdate = true;
    } else setTimeout(tryBookTex, 120);
  })();

  /* ================= 二、可数元素（3D 悬空展示） ================= */
  const GROUP = new THREE.Group();
  scene.add(GROUP);

  // 三组元素：国旗(1)、红花(8)、小朋友(7) —— 用球/花/人形表示
  const ITEMS = [];
  const COLORS = { flag: '#e04b2f', flower: '#e86a2a', kid: '#2f6fdb' };

  function makeFlag() {
    const g = new THREE.Group();
    const pole = cyl(0.03, 0.03, 2.2, M('#8a8a8a', { rough: 0.5 }), 8);
    pole.position.y = 1.1; g.add(pole);
    const flag = box(0.9, 0.55, 0.03, M('#e04b2f', { rough: 0.5, emissive: '#e04b2f', ei: 0.15 }));
    flag.position.set(0.47, 1.9, 0); g.add(flag);
    return g;
  }
  function makeFlower() {
    const g = new THREE.Group();
    const stem = cyl(0.02, 0.03, 0.6, M('#2fa36b', { rough: 0.6 }), 6);
    stem.position.y = 0.3; g.add(stem);
    const petal = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 8, 20), M('#e86a2a', { rough: 0.5, emissive: '#e86a2a', ei: 0.2 }));
    petal.position.y = 0.65; g.add(petal);
    return g;
  }
  function makeKid() {
    const g = new THREE.Group();
    const body = sph(0.22, M('#2f6fdb', { rough: 0.6 }));
    body.scale.set(0.8, 1, 0.7); body.position.y = 0.5; g.add(body);
    const head = sph(0.14, M('#f0c8a0', { rough: 0.5 }));
    head.position.y = 0.92; g.add(head);
    return g;
  }

  const builders = { flag: makeFlag, flower: makeFlower, kid: makeKid };

  function addGroup(kind, count, x0, z0, spread) {
    for (let i = 0; i < count; i++) {
      const g = builders[kind]();
      const ang = (i / Math.max(1, count)) * Math.PI * 2;
      const rad = spread * (0.3 + (i % 3) * 0.25);
      g.position.set(x0 + Math.cos(ang) * rad, 0, z0 + Math.sin(ang) * rad * 0.7);
      g.rotation.y = ang;
      GROUP.add(g);
      ITEMS.push({ g, kind, idx: i });
    }
  }

  // 国旗1、红花8、小朋友7 —— 排成三组，放在页面上半部
  addGroup('flag', 1, -1.6, 2.6, 0.3);
  addGroup('flower', 8, 1.6, 2.2, 0.55);
  addGroup('kid', 7, 0, 0.6, 0.75);

  /* ================= 三、标签 ================= */
  const anchors = {
    flag: new THREE.Object3D(), flower: new THREE.Object3D(), kid: new THREE.Object3D(),
  };
  Object.values(anchors).forEach(o => scene.add(o));
  anchors.flag.position.set(-1.6, 2.8, 2.6);
  anchors.flower.position.set(1.6, 2.5, 2.2);
  anchors.kid.position.set(0, 2.1, 0.6);
  const labFlag = addLabel('国旗', anchors.flag, { sub: '1 面' });
  const labFlower = addLabel('红花', anchors.flower, { sub: '8 盆' });
  const labKid = addLabel('小朋友', anchors.kid, { sub: '7 个' });

  /* ================= 四、TTS ================= */
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
      u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1.05;
      clearTimeout(ttsTimer);
      ttsTimer = setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 90);
    } catch (e) {}
  }

  /* ================= 五、状态 ================= */
  const state = { n: 0, phase: 'idle', t: 0, spoken: -1 };

  function applyCount() {
    // 按"红旗→红花→小朋友"顺序点亮（共16个元素）
    ITEMS.forEach((it, i) => {
      const on = i < state.n;
      it.g.visible = on;
      it.g.scale.setScalar(on ? 1 : 0.001);
      // 点亮瞬间弹一下
      if (on && it.idx === state.n - 1) it.g.scale.setScalar(1.2);
    });
    // 标签更新
    labFlag.el.innerHTML = `国旗<span class="sub">${state.n >= 1 ? '1 面 ✓' : '1 面'}</span>`;
    labFlower.el.innerHTML = `红花<span class="sub">${Math.max(0, Math.min(8, state.n - 1))} / 8 盆</span>`;
    labKid.el.innerHTML = `小朋友<span class="sub">${Math.max(0, Math.min(7, state.n - 9))} / 7 个</span>`;
  }

  function startShow() {
    state.phase = 'count'; state.t = 0; state.n = 0;
    ITEMS.forEach(it => { it.g.visible = false; });
  }

  try {
    if (new URLSearchParams(location.search).get('auto')) setTimeout(startShow, 700);
  } catch (e) {}

  applyCount();

  return {
    play() { startShow(); },
    speak() {
      const n = state.n;
      if (n === 0) ttsSay('校园里有 1 面国旗，8 盆红花，7 个小朋友。我们一起数一数。');
      else ttsSay(`已经数到 ${n}。`);
    },
    __dbgState() { return state; },

    update(dt, p) {
      state.t += dt;
      if (state.phase === 'count') {
        // 每0.7s亮一个
        state.n = Math.min(16, Math.floor(state.t / 0.7) + 1);
        if (state.n !== state.spoken && state.n <= 16) {
          state.spoken = state.n;
          const names = ['国旗', '红花', '红花', '红花', '红花', '红花', '红花', '红花', '红花', '小朋友', '小朋友', '小朋友', '小朋友', '小朋友', '小朋友', '小朋友'];
          ttsSay(names[state.n - 1] + '，' + state.n);
        }
        if (state.t > 16 * 0.7 + 0.5) { state.phase = 'idle'; state.t = 0; }
      } else {
        state.n = Math.round(p.count);
      }
      applyCount();
    },

    reset(p) {
      state.phase = 'idle'; state.t = 0; state.n = 0; state.spoken = -1;
      applyCount();
    },

    readouts() {
      return [
        { label: '国旗', val: String(state.n >= 1 ? 1 : 0), unit: '面' },
        { label: '红花', val: String(Math.max(0, Math.min(8, state.n - 1))), unit: '盆' },
        { label: '小朋友', val: String(Math.max(0, Math.min(7, state.n - 9))), unit: '个' },
      ];
    },
  };
}
