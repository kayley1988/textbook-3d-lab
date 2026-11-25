/* ============================================================
   语文 · 一年级上册 · 课文《雪地里的小画家》
   ------------------------------------------------------------
   脚印剧场：小鸡、小狗、小鸭、小马踩过雪地，留下四种不同
   形状的脚印——竹叶、梅花、枫叶、月牙。播放时脚印沿路径
   逐串出现，诗句逐句浮现锚定在对应动物身上。
   ============================================================ */

export const meta = {
  tag: '语文 · 一年级上册 · 课文',
  title: '雪地里的小画家：脚印里有秘密',
  lead: '下雪啦！小鸡、小狗、小鸭、小马跑出来，雪地上留下一串串脚印。不看动物，只看脚印——你能猜出是谁吗？',

  concept: `
    <p>每种动物的脚长得不一样，踩出来的脚印就不一样：</p>
    <p><b>小鸡 → 竹叶</b>（脚趾分叉，像竹叶尖尖）</p>
    <p><b>小狗 → 梅花</b>（脚掌圆，带四个趾垫，像梅花瓣）</p>
    <p><b>小鸭 → 枫叶</b>（脚掌带蹼，像枫叶一片）</p>
    <p><b>小马 → 月牙</b>（蹄子弯弯，像月牙）</p>
    <p>按下播放，看它们一路踩过去；也可以切换只看某一只。</p>`,

  formula: {
    label: '猜一猜',
    expr: '脚印 <span class="op">→</span> 脚的主人',
    note: '竹叶、梅花、枫叶、月牙——四种脚印，四个小画家。',
  },

  points: [
    '小鸡脚印像竹叶',
    '小狗脚印像梅花',
    '小鸭脚印像枫叶',
    '小马脚印像月牙',
  ],

  question: '青蛙为什么没来？因为它冬眠啦。你还知道谁冬天不出来？',

  controls: [
    { key: 'play', label: '脚印进度', min: 0, max: 1, step: 0.01, value: 0, unit: '' },
  ],

  controlsLabel: '踩雪',
  playLabel: '走一遍',
  readoutLabel: '雪地里',
  tts: true,
  ttsLabel: '读一遍',

  actions: [
    { key: 'ji', label: '小鸡·竹叶', on: true },
    { key: 'gou', label: '小狗·梅花' },
    { key: 'ya', label: '小鸭·枫叶' },
    { key: 'ma', label: '小马·月牙' },
    { key: 'all', label: '全部' },
  ],

  cam: { pos: [0, 4.6, 9.6], target: [0, 1.0, 0] },
};

export function create({ scene, camera, controls, addLabel }) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  /* ================= 一、雪地 ================= */
  const ground = box(9.5, 0.35, 6.5, M('#eef2f4', { rough: 0.95, env: 0.2 }));
  ground.position.y = -0.175;
  ground.receiveShadow = true;
  scene.add(ground);

  // 雪地表面（带噪点）
  const snowTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f8fa'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * 512, y = Math.random() * 512;
      g.fillStyle = `rgba(${200 + Math.random() * 40},${210 + Math.random() * 30},${225 + Math.random() * 25},${0.05 + Math.random() * 0.06})`;
      g.beginPath(); g.arc(x, y, 0.5 + Math.random() * 1.4, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const snowTop = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 6.5), new THREE.MeshPhysicalMaterial({
    map: snowTex, color: '#b9c2c6', roughness: 0.95, envMapIntensity: 0.2,
  }));
  snowTop.rotation.x = -Math.PI / 2;
  snowTop.position.y = 0.005;
  snowTop.receiveShadow = true;
  scene.add(snowTop);

  /* ================= 二、四只动物 ================= */
  const ANIMALS = {
    ji:  { name: '小鸡', color: '#f2d24b', foot: '竹叶', path: [-3.4, 2.3], dir: 1 },
    gou: { name: '小狗', color: '#c98f52', foot: '梅花', path: [-3.0, 0.6], dir: 1 },
    ya:  { name: '小鸭', color: '#e8e0d0', foot: '枫叶', path: [-2.6, -1.1], dir: -1 },
    ma:  { name: '小马', color: '#9a7a54', foot: '月牙', path: [-2.2, -2.6], dir: -1 },
  };
  const ORDER = ['ji', 'gou', 'ya', 'ma'];
  const ANIM = {};

  function makeBody(key, color) {
    const g = new THREE.Group();
    const m = M(color, { rough: 0.6, env: 0.6 });
    const r = key === 'ma' ? 0.42 : key === 'gou' ? 0.34 : key === 'ya' ? 0.32 : 0.27;
    const body = sph(r, m); body.scale.set(1.25, 0.92, 0.9); g.add(body);
    const head = sph(r * 0.62, m); head.position.set(r * 0.95, r * 0.72, 0); g.add(head);
    if (key === 'ji') {
      const comb = box(0.1, 0.14, 0.04, M('#d94a2a', { rough: 0.5 }));
      comb.position.set(r * 0.7, r * 1.28, 0); g.add(comb);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), M('#e8a020', { rough: 0.4 }));
      beak.rotation.z = -Math.PI / 2; beak.position.set(r * 1.5, r * 0.62, 0); g.add(beak);
    } else if (key === 'ya') {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 8), M('#e09030', { rough: 0.4 }));
      beak.rotation.z = -Math.PI / 2; beak.position.set(r * 1.55, r * 0.5, 0); g.add(beak);
    } else if (key === 'gou') {
      const ear = box(0.12, 0.18, 0.04, M('#7a5230', { rough: 0.6 }));
      ear.position.set(r * 0.6, r * 1.2, 0.1); ear.rotation.z = 0.3; g.add(ear);
    } else {
      const mane = box(0.2, 0.5, 0.12, M('#5a4028', { rough: 0.7 }));
      mane.position.set(-r * 0.8, r * 0.3, 0); mane.rotation.z = 0.5; g.add(mane);
      const legMat = M('#7a5a38', { rough: 0.6 });
      [[0.25, 0.12], [-0.25, 0.12], [0.25, -0.12], [-0.25, -0.12]].forEach(([lx, lz]) => {
        const leg = box(0.08, 0.5, 0.08, legMat);
        leg.position.set(lx, -r * 0.9, lz); g.add(leg);
      });
    }
    if (key !== 'ma') {
      const legMat = M('#5a4a30', { rough: 0.6 });
      [[0.15, 0.1], [-0.15, 0.1], [0.15, -0.1], [-0.15, -0.1]].forEach(([lx, lz]) => {
        const leg = box(0.05, 0.35, 0.05, legMat);
        leg.position.set(lx, -r * 0.85, lz); g.add(leg);
      });
    }
    return g;
  }

  ORDER.forEach(k => {
    const a = ANIMALS[k];
    const g = makeBody(k, a.color);
    g.position.set(a.path[0], 0.28, a.path[1]);
    if (a.dir < 0) g.rotation.y = Math.PI;
    scene.add(g);
    ANIM[k] = { grp: g };
  });

  /* ================= 三、脚印 ================= */
  // 每种脚印做一簇形状，复制排列
  function footGeo(key) {
    if (key === 'ji') {   // 竹叶：三片细长
      const sh = new THREE.Shape();
      sh.moveTo(0, 0.42); sh.lineTo(-0.09, 0.1); sh.lineTo(-0.02, 0); sh.lineTo(0.02, 0); sh.lineTo(0.09, 0.1);
      sh.closePath();
      return [sh];
    }
    if (key === 'gou') {  // 梅花：圆掌+四瓣
      const shs = [];
      const c = new THREE.Shape(); c.absarc(0, 0, 0.16, 0, 7, false); shs.push(c);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4;
        const p = new THREE.Shape(); p.absarc(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.1, 0, 7, false);
        shs.push(p);
      }
      return shs;
    }
    if (key === 'ya') {   // 枫叶：三瓣蹼
      const shs = [];
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * 0.7;
        const p = new THREE.Shape();
        p.moveTo(0, 0);
        p.quadraticCurveTo(Math.cos(a) * 0.3 - 0.12, Math.sin(a) * 0.3 + 0.25, Math.cos(a) * 0.34, Math.sin(a) * 0.42);
        p.quadraticCurveTo(Math.cos(a) * 0.3 + 0.12, Math.sin(a) * 0.25, 0, 0);
        shs.push(p);
      }
      return shs;
    }
    // 月牙
    const sh = new THREE.Shape();
    sh.absarc(0, 0, 0.24, Math.PI * 0.15, Math.PI * 0.85, false);
    sh.absarc(0.09, 0, 0.2, Math.PI * 0.85, Math.PI * 0.15, true);
    return [sh];
  }

  const FOOT_COLOR = '#8aa4b8';
  const footprints = {};   // key -> [{mesh, t}] 沿路径
  ORDER.forEach(k => {
    const a = ANIMALS[k];
    const list = [];
    const shapes = footGeo(k);
    const N = 9;
    for (let i = 0; i < N; i++) {
      const s = i < shapes.length ? shapes[i] : shapes[0];
      const geo = new THREE.ExtrudeGeometry([s], { depth: 0.02, bevelEnabled: false, curveSegments: 8 });
      geo.rotateX(-Math.PI / 2);
      geo.rotateY(a.dir < 0 ? Math.PI : 0);
      const m = new THREE.Mesh(geo, M(FOOT_COLOR, { rough: 0.7, env: 0.3 }));
      m.visible = false;
      m.position.set(a.path[0], 0.02, a.path[1]);
      scene.add(m);
      list.push({ mesh: m, t: i / (N - 1) });
    }
    footprints[k] = list;
  });

  /* ================= 四、标签 ================= */
  const labelAnchors = {};
  ORDER.forEach(k => {
    const o = new THREE.Object3D();
    scene.add(o);
    const a = ANIMALS[k];
    o.position.set(a.path[0], 1.15, a.path[1]);
    labelAnchors[k] = o;
  });
  const labJi = addLabel('小鸡', labelAnchors.ji, { sub: '竹叶' });
  const labGou = addLabel('小狗', labelAnchors.gou, { sub: '梅花' });
  const labYa = addLabel('小鸭', labelAnchors.ya, { sub: '枫叶' });
  const labMa = addLabel('小马', labelAnchors.ma, { sub: '月牙' });
  const labs = { ji: labJi, gou: labGou, ya: labYa, ma: labMa };

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
  const state = { mode: 'all', show: { ji: true, gou: true, ya: true, ma: true }, phase: 'idle', t: 0, prog: 0, spoken: false };

  function setMode(mode) {
    state.mode = mode;
    state.phase = 'idle'; state.t = 0; state.prog = 0; state.spoken = false;
    if (mode === 'all') state.show = { ji: true, gou: true, ya: true, ma: true };
    else state.show = { ji: false, gou: false, ya: false, ma: false, [mode]: true };
    ORDER.forEach(k => {
      ANIM[k].grp.visible = state.show[k];
      labelAnchors[k].visible = state.show[k];
      footprints[k].forEach(f => { f.mesh.visible = false; });
    });
    autoFrame(camera, controls, scene, { pad: 1.12, force: true });
  }

  function startShow() {
    state.phase = 'walk'; state.t = 0; state.spoken = false;
    ORDER.forEach(k => footprints[k].forEach(f => { f.mesh.visible = false; }));
  }

  try {
    if (new URLSearchParams(location.search).get('auto')) setTimeout(startShow, 700);
  } catch (e) {}

  setMode('all');

  return {
    play() { startShow(); },
    act(key) { if (ANIMALS[key] || key === 'all') setMode(key); },
    speak() { ttsSay('小鸡画竹叶，小狗画梅花，小鸭画枫叶，小马画月牙。青蛙呢？它冬眠啦！'); },
    __dbgState() { return state; },

    update(dt, p) {
      state.t += dt;
      if (state.phase === 'walk') state.prog = Math.min(1, state.t / 5.2);
      else state.prog = p.play;

      // 脚印出现：按模式过滤
      ORDER.forEach(k => {
        if (!state.show[k]) { footprints[k].forEach(f => { f.mesh.visible = false; }); return; }
        footprints[k].forEach(f => {
          const appear = smooth(Math.max(0, Math.min(1, (state.prog * 1.15 - f.t) / 0.18)));
          f.mesh.visible = appear > 0.02;
          const s = 0.5 + 0.5 * appear;
          f.mesh.scale.set(s, 1, s);
        });
        // 动物位置沿路径轻微前进
        const a = ANIMALS[k];
        const base = ANIM[k].grp;
        const start = a.path[0], end = a.path[0] + a.dir * 2.6;
        base.position.x = lerp(start, end, smooth(state.prog));
      });

      if (state.phase === 'walk' && state.prog >= 1 && !state.spoken) {
        state.spoken = true;
        ttsSay('小鸡画竹叶，小狗画梅花，小鸭画枫叶，小马画月牙。');
      }
    },

    reset(p) {
      state.phase = 'idle'; state.t = 0; state.prog = 0; state.spoken = false;
      ORDER.forEach(k => footprints[k].forEach(f => { f.mesh.visible = false; }));
      ORDER.forEach(k => {
        const a = ANIMALS[k];
        ANIM[k].grp.position.x = a.path[0];
      });
    },

    readouts() {
      const shown = ORDER.filter(k => state.show[k]).map(k => ANIMALS[k].foot);
      return [
        { label: '脚印', val: shown.length === 4 ? '四种' : shown.join('·'), unit: '' },
        { label: '进度', val: (state.prog * 100).toFixed(0), unit: '%' },
        { label: '雪地', val: state.phase === 'walk' ? '正在踩' : '安静', unit: '' },
      ];
    },
  };
}
