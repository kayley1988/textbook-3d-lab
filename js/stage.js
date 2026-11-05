import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';

/* ---------- 能量配色 ---------- */
export const ECOL = {
  KE:    '#f4511e', // 动能
  PE:    '#2f6fdb', // 重力势能
  EPE:   '#2fa36b', // 弹性势能
  Q:     '#e89b1c', // 内能 / 损耗
  E:     '#8e5bd6', // 电能
  LIGHT: '#e3b93c', // 光能
  CHEM:  '#c9a83a', // 化学能
  REST:  '#b7ad97', // 未完成 / 剩余
};

/* ---------- 程序化环境贴图（柔光箱风格，给材质真实反射） ---------- */
let _envTex = null;
export function getEnvTexture(renderer) {
  if (_envTex) return _envTex;
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // 天空→地平线→地面：上冷蓝（铜匠式清新），下部暖沙（与书页融合）
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#BFD9FF');  // 天顶淡蓝
  sky.addColorStop(0.30, '#DCE9FF');  // 天蓝过渡
  sky.addColorStop(0.48, '#F2F6FF');  // 地平线近白
  sky.addColorStop(0.55, '#F1E9DD');  // 暖沙色（接书页）
  sky.addColorStop(0.80, '#D9CDB4');
  sky.addColorStop(1.00, '#8E8268');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  // 柔光箱：主光（暖白）+ 侧光（冷白）+ 地面反弹
  const blob = (x, y, rx, ry, alp, warm) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, rx);
    rg.addColorStop(0, warm ? `rgba(255,244,222,${alp})` : `rgba(255,255,255,${alp})`);
    rg.addColorStop(0.5, `rgba(255,252,248,${alp * 0.45})`);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore();
  };
  blob(300, 92, 210, 130, 1.0, true);   // 主柔光箱（暖，左上前）
  blob(790, 140, 150, 95, 0.62, false); // 侧补光（冷，右上）
  blob(540, 340, 280, 80, 0.28, true);  // 书页反弹

  const eq = new THREE.CanvasTexture(c);
  eq.mapping = THREE.EquirectangularReflectionMapping;
  eq.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  _envTex = pmrem.fromEquirectangular(eq).texture;
  eq.dispose(); pmrem.dispose();
  return _envTex;
}

/* ---------- 圆角盒（产品级质感，替代硬边 BoxGeometry） ---------- */
export function roundedBoxGeo(w, h, d, r) {
  const rr = Math.min(r ?? Math.min(w, h, d) * 0.10, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  if (!(rr > 0.004)) return new THREE.BoxGeometry(w, h, d);
  const hw = w / 2 - rr, hh = h / 2 - rr, s = new THREE.Shape();
  s.moveTo(-hw, -h / 2);
  s.lineTo(hw, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
  s.lineTo(w / 2, hh);
  s.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
  s.lineTo(-hw, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
  s.lineTo(-w / 2, -hh);
  s.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
  const depth = Math.max(d - 2 * rr, 1e-3);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelSegments: 2,
    bevelSize: rr, bevelThickness: rr, curveSegments: 5, steps: 1,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/* ---------- 基础材质（哑光陶土质感：铜匠式 roughness 主导 + 轻环境反射） ---------- */
export function M(color, o = {}) {
  const rough = o.rough ?? 0.62;   // 默认哑光，避免"油亮塑料感"
  const metal = o.metal ?? 0.0;    // 默认零金属度（教学模型风）
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    metalness: metal,
    // 极薄一层清漆：保留高光条但不油亮
    clearcoat: o.coat ?? (metal > 0.5 ? 0.0 : 0.16),
    clearcoatRoughness: o.coatRough ?? 0.5,
    envMapIntensity: o.env ?? 0.75,
    ior: 1.46,
  });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.opacity != null) {
    m.transparent = true; m.opacity = o.opacity;
    if (o.opacity < 0.85) m.depthWrite = o.depthWrite ?? false;
  }
  if (o.opacity != null && o.opacity < 0.9) m.userData.noShadow = true;
  if (o.flat) m.flatShading = true;
  if (o.side) m.side = o.side;
  return m;
}

function shade(mesh, noShadow) {
  mesh.castShadow = !noShadow;
  mesh.receiveShadow = !noShadow;
  return mesh;
}
export const box = (w, h, d, mat) => shade(new THREE.Mesh(roundedBoxGeo(w, h, d), mat), mat?.userData?.noShadow);
export const cyl = (rt, rb, h, mat, seg = 40) => shade(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1), mat), mat?.userData?.noShadow);
export const sph = (r, mat, seg = 32) => shade(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(16, seg * 0.7 | 0)), mat), mat?.userData?.noShadow);

/* ---------- 柔光贴图（粒子用） ---------- */
let _spriteTex = null;
export function glowSprite() {
  if (_spriteTex) return _spriteTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  _spriteTex = new THREE.CanvasTexture(c);
  return _spriteTex;
}

/* ---------- 能量粒子流 ---------- */
export function makeFlow(curve, { count = 42, speed = 0.22, size = 0.16, colorFn = null, color = '#ff8a2a', opacity = 0.95 }) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, map: glowSprite(), vertexColors: true, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const base = new THREE.Color(color);
  const cTmp = new THREE.Color();
  let t0 = Math.random();
  return {
    obj: points,
    update(dt) {
      t0 = (t0 + dt * speed) % 1;
      const p = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const t = (t0 + i / count) % 1;
        curve.getPointAt(t, p);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        const c = colorFn ? colorFn(t, cTmp) : cTmp.copy(base);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

/* ---------- 发光管（能量管路） ---------- */
export function glowTube(curve, radius, color, opacity = 0.28) {
  const geo = new THREE.TubeGeometry(curve, 48, radius, 10, false);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { obj: mesh, dispose() { geo.dispose(); mat.dispose(); } };
}

/* ---------- 虚线 ---------- */
export function dashedLine(points, color = '#8a8272', dash = 0.18, gap = 0.12) {
  const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...(Array.isArray(p) ? p : [p.x, p.y, p.z]))));
  const mat = new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: true, opacity: 0.7 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}
export function solidLine(points, color = '#8a8272', opacity = 0.8) {
  const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...(Array.isArray(p) ? p : [p.x, p.y, p.z]))));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geo, mat);
}

/* ---------- 阶段（渲染器 + 相机 + 灯光 + 标签） ---------- */
export function createStage(container, labelsEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // 电影级色调映射：高光滚降柔和，不再"死白一片"
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // 环境反射：让金属/玻璃/漆面有真实的高光与倒影
  scene.environment = getEnvTexture(renderer);
  // 淡雾：远处书桌融入背景，消除生硬边界（铜匠式氛围）
  scene.fog = new THREE.Fog(0xf3efe4, 16, 46);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;

  const lightRig = new THREE.Group();

  // 环境已提供基础照明，半球光做天冷/地暖的色彩层次
  const hemi = new THREE.HemisphereLight(0xddebff, 0xf1e9dd, 0.6);
  lightRig.add(hemi);

  // 主光：暖白，投影
  const key = new THREE.DirectionalLight(0xfff2dc, 2.5);
  key.position.set(5.5, 11, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7.5; key.shadow.camera.right = 7.5;
  key.shadow.camera.top = 7.5; key.shadow.camera.bottom = -7.5;
  key.shadow.camera.near = 1; key.shadow.camera.far = 34;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.022;
  lightRig.add(key);

  // 侧补光：冷调，压暗部不死黑
  const fill = new THREE.DirectionalLight(0xdce8ff, 0.85);
  fill.position.set(-8, 4.5, 4);
  lightRig.add(fill);

  // 轮廓光：从背后打，勾出物体边缘高光（"高级感"关键）
  const rim = new THREE.DirectionalLight(0xffffff, 1.35);
  rim.position.set(-3.5, 6.5, -8.5);
  lightRig.add(rim);

  // 底部反弹：模拟书页/桌面把光反上来，托住悬浮装置
  const bounce = new THREE.DirectionalLight(0xffe8c4, 0.35);
  bounce.position.set(0, -6, 2);
  lightRig.add(bounce);

  scene.add(lightRig);

  /* --- 标签 --- */
  const labels = [];
  function addLabel(text, anchor, { dx = 0, dy = 0, cls = '', sub = '' } = {}) {
    const el = document.createElement('div');
    el.className = 'lab3d ' + cls;
    el.innerHTML = text + (sub ? `<span class="sub">${sub}</span>` : '');
    labelsEl.appendChild(el);
    const item = { el, anchor, dx, dy };
    labels.push(item);
    return item;
  }
  const v3 = new THREE.Vector3();
  function updateLabels() {
    const r = renderer.domElement.getBoundingClientRect();
    for (const it of labels) {
      if (!it.anchor.visible) { it.el.style.display = 'none'; continue; }
      it.anchor.getWorldPosition(v3);
      v3.project(camera);
      const x = (v3.x * 0.5 + 0.5) * r.width + it.dx;
      const y = (-v3.y * 0.5 + 0.5) * r.height + it.dy;
      it.el.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`;
      it.el.style.display = v3.z < 1 ? '' : 'none';
    }
  }
  function clearLabels() {
    labels.length = 0;
    labelsEl.innerHTML = '';
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  return { renderer, scene, camera, controls, lightRig, addLabel, updateLabels, clearLabels };
}
