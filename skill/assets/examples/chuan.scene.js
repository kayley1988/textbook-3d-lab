/* ============================================================
   语文 · 一年级上册 · 课文《小小的船》
   ------------------------------------------------------------
   诗境箱：夜空、弯月、小船、星星。诗句逐句浮现锚定在对应
   景物上——月儿弯弯像小船，星星闪闪像宝石。可拖月船旋转，
   星星可调。
   ============================================================ */

export const meta = {
  tag: '语文 · 一年级上册 · 课文',
  title: '小小的船：弯月像小船',
  lead: '"弯弯的月儿小小的船，小小的船儿两头尖。"夜空里，月牙像一只小船，我坐在上面看星星——星星眨着眼，像宝石一样闪。',

  concept: `
    <p>这是一首<span class="var">比喻</span>的诗：<em>月牙</em>被比作<em>小船</em>（都弯弯、都两头尖），<em>星星</em>被比作<em>宝石</em>（都亮闪闪）。</p>
    <p>看 3D 场景：夜空里一只月牙船悬着，周围星星闪烁。点"演一遍"，诗句一句句浮现，锚定在它写的东西上。</p>
    <p>拖动月亮滑块，可以调整月牙的"弯"——越弯越像船。</p>`,

  formula: {
    label: '比喻',
    expr: '月牙 <span class="op">≈</span> 小船　·　星星 <span class="op">≈</span> 宝石',
    note: '弯弯 + 两头尖 → 小船；亮 + 闪 → 宝石',
  },

  points: [
    '月儿弯弯像小船（形状像）',
    '小船两头尖（月牙的两个尖角）',
    '星星闪闪像宝石（光亮像）',
    '我在小小的船里坐——想象里坐的是月亮船',
  ],

  question: '晚上抬头看天，你还能把月亮想成什么？把云想成什么？',

  controls: [
    { key: 'bend', label: '月牙弯度', min: 0.15, max: 0.6, step: 0.01, value: 0.34, unit: '' },
    { key: 'stars', label: '星星数量', min: 6, max: 40, step: 1, value: 18, unit: '颗' },
  ],

  controlsLabel: '调一调夜空',
  playLabel: '赏一赏',
  readoutLabel: '夜空',
  tts: true,
  ttsLabel: '读一遍',

  cam: { pos: [0, 3.2, 9.5], target: [0, 2.6, 0] },
};

export function create({ scene, camera, controls, addLabel }) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  /* ================= 一、夜空背景 ================= */
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshBasicMaterial({ color: '#0d1830', fog: false }));
  bg.position.set(0, 6, -14);
  scene.add(bg);

  // 地面（水面，月牙倒影用）
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 6),
    new THREE.MeshPhysicalMaterial({ color: '#0e2440', roughness: 0.15, metalness: 0.1, envMapIntensity: 0.4 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.02;
  sea.receiveShadow = true;
  scene.add(sea);

  /* ================= 二、月牙船 ================= */
  const MOON_GROUP = new THREE.Group();
  scene.add(MOON_GROUP);
  let moonMesh, moonHalo;

  function buildMoon(bend) {
    // 弯月：大圆减去偏移小圆
    const R = 1.5;
    const sh = new THREE.Shape();
    sh.absarc(0, 0, R, Math.PI * 0.35, Math.PI * 1.65, false);
    sh.absarc(R * (1 - bend * 1.6), 0, R * (1 - bend * 1.15), Math.PI * 1.65, Math.PI * 0.35, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 48 });
    geo.translate(0, 0, -0.15);
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#fdf3c0', roughness: 0.3, metalness: 0,
      emissive: '#f2d878', emissiveIntensity: 0.9, clearcoat: 0.5, envMapIntensity: 0.6,
    });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    MOON_GROUP.add(m);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite(), color: '#fdf0b0', transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(5.2);
    MOON_GROUP.add(halo);
    moonMesh = m; moonHalo = halo;
  }

  // 初始
  buildMoon(0.34);
  MOON_GROUP.position.set(-0.4, 3.6, 0);
  MOON_GROUP.rotation.z = 0.35;

  /* ================= 三、星星 ================= */
  const STAR_GROUP = new THREE.Group();
  scene.add(STAR_GROUP);
  const stars = [];

  function rebuildStars(n) {
    // 清掉旧的
    stars.forEach(s => { s.m.geometry.dispose(); s.m.material.dispose(); STAR_GROUP.remove(s.m); });
    stars.length = 0;
    for (let i = 0; i < n; i++) {
      const r = 0.08 + Math.random() * 0.09;
      const geo = new THREE.SphereGeometry(r, 10, 8);
      const mat = new THREE.MeshBasicMaterial({ color: '#fffbe8', transparent: true, opacity: 1, fog: false });
      const m = new THREE.Mesh(geo, mat);
      const ang = Math.random() * Math.PI * 2;
      const rad = 3.2 + Math.random() * 5;
      m.position.set(Math.cos(ang) * rad * 0.9, 3.4 + Math.sin(ang) * rad * 0.5, -1.5 - Math.random() * 2);
      m.userData.ph = Math.random() * Math.PI * 2;
      STAR_GROUP.add(m);
      stars.push({ m, ph: m.userData.ph });
    }
  }
  rebuildStars(30);

  /* ================= 四、诗句标签 ================= */
  const POEMS = [
    { text: '弯弯的月儿', sub: '小小的船', anchor: [1.6, 4.3, 0.2] },
    { text: '小小的船儿', sub: '两头尖', anchor: [2.2, 3.4, 0.4] },
    { text: '我在小小的船里坐', sub: '只看见闪闪的星星', anchor: [-2.6, 2.4, 0.3] },
    { text: '蓝蓝的天', sub: '星星眨着眼', anchor: [2.8, 2.0, -0.3] },
  ];
  const labAnchors = POEMS.map(p => {
    const o = new THREE.Object3D();
    o.position.set(...p.anchor);
    scene.add(o);
    return o;
  });
  const labs = POEMS.map((p, i) => {
    const l = addLabel(p.text, labAnchors[i], { sub: p.sub, show: false });
    l.el.style.opacity = 0;   // 初始隐藏，演一遍时逐句浮现
    return l;
  });

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

  /* ================= 六、状态 ================= */
  const state = { phase: 'idle', t: 0, bend: 0.34, spoken: false };

  function startShow() {
    state.phase = 'show'; state.t = 0; state.spoken = false;
    labs.forEach(l => { l.el.style.opacity = 0; });
  }

  try {
    if (new URLSearchParams(location.search).get('auto')) setTimeout(startShow, 700);
  } catch (e) {}

  return {
    play() { startShow(); },
    speak() { ttsSay('弯弯的月儿小小的船。小小的船儿两头尖。我在小小的船里坐，只看见闪闪的星星蓝蓝的天。'); },
    __dbgState() { return state; },

    update(dt, p) {
      state.t += dt;

      // 星星闪烁
      stars.forEach(s => {
        const tw = 0.55 + 0.45 * Math.sin(state.t * 2.2 + s.ph);
        s.m.material.opacity = tw;
        s.m.scale.setScalar(0.8 + tw * 0.4);
      });

      // 月牙浮动
      MOON_GROUP.position.y = 3.6 + Math.sin(state.t * 0.7) * 0.12;
      MOON_GROUP.rotation.z = 0.35 + Math.sin(state.t * 0.5) * 0.03;

      // 弯度调节（重建几何）
      if (Math.abs(p.bend - state.bend) > 0.004) {
        state.bend = p.bend;
        MOON_GROUP.remove(moonMesh);
        moonMesh.geometry.dispose();
        moonMesh.material.dispose();
        buildMoon(state.bend);
      }

      // 诗句浮现（演一遍时）
      if (state.phase === 'show') {
        POEMS.forEach((po, i) => {
          const appear = smooth(Math.max(0, Math.min(1, (state.t - 0.6 - i * 1.1) / 0.6)));
          labs[i].el.style.opacity = appear;
        });
        if (state.t > 0.6 + POEMS.length * 1.1 + 0.5 && !state.spoken) {
          state.spoken = true;
          ttsSay('弯弯的月儿小小的船。小小的船儿两头尖。');
        }
      }
    },

    reset(p) {
      state.phase = 'idle'; state.t = 0; state.spoken = false;
      labs.forEach(l => { l.el.style.opacity = 0; });
    },

    readouts() {
      const n = stars.length;
      return [
        { label: '月牙', val: state.bend < 0.25 ? '很弯' : state.bend < 0.45 ? '弯弯的' : '月牙胖胖', unit: '' },
        { label: '星星', val: String(n), unit: '颗' },
        { label: '比喻', val: '月牙像小船', unit: '' },
      ];
    },
  };
}
