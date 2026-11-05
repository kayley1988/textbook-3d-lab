// ============================================================
// 纸上实验 · 3D 课件运行时（Single-File Lab Runtime）
// 依赖：three（ESM）。构建时由 build.py 内联为单 HTML。
// 设计目标：不依赖服务器、不依赖教材 PDF，双击 HTML 即可运行。
// ============================================================
import * as THREE from 'three';

/* ---------- 能量配色（跨学科通用） ---------- */
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

export const G = 9.8;   // 重力加速度（教学默认 9.8，部分实验用 10 便于口算）

/* ---------- 程序化环境贴图：冷天光 + 暖地光，给材质真实反射 ---------- */
let _envTex = null;
export function getEnvTexture(renderer) {
  if (_envTex) return _envTex;
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#BFD9FF');
  sky.addColorStop(0.30, '#DCE9FF');
  sky.addColorStop(0.48, '#F2F6FF');
  sky.addColorStop(0.55, '#F1E9DD');
  sky.addColorStop(0.80, '#D9CDB4');
  sky.addColorStop(1.00, '#8E8268');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  const blob = (x, y, rx, ry, alp, warm) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, rx);
    rg.addColorStop(0, warm ? `rgba(255,244,222,${alp})` : `rgba(255,255,255,${alp})`);
    rg.addColorStop(0.5, 'rgba(255,252,248,' + (alp * 0.45) + ')');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore();
  };
  blob(300, 92, 210, 130, 1.0, true);
  blob(790, 140, 150, 95, 0.62, false);
  blob(540, 340, 280, 80, 0.28, true);

  const eq = new THREE.CanvasTexture(c);
  eq.mapping = THREE.EquirectangularReflectionMapping;
  eq.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  _envTex = pmrem.fromEquirectangular(eq).texture;
  eq.dispose(); pmrem.dispose();
  return _envTex;
}

/* ---------- 圆角盒：把硬边变成产品级圆角，质感提升最明显的一步 ---------- */
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

/* ---------- 材质：哑光陶土风（metalness 默认 0，避免"塑料玩具感"） ---------- */
export function M(color, o = {}) {
  const rough = o.rough ?? 0.62;
  const metal = o.metal ?? 0.0;
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    metalness: metal,
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
/** 圆角盒（默认） */
export const box = (w, h, d, mat) => shade(new THREE.Mesh(roundedBoxGeo(w, h, d), mat), mat?.userData?.noShadow);
export const cyl = (rt, rb, h, mat, seg = 40) => shade(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1), mat), mat?.userData?.noShadow);
export const sph = (r, mat, seg = 32) => shade(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(16, seg * 0.7 | 0)), mat), mat?.userData?.noShadow);
/** 玻璃/水：透明 + 不写深度，避免遮挡背后的物体 */
export const glassMat = (color = '#cfe6f2', opacity = 0.18) =>
  M(color, { opacity, rough: 0.08, metal: 0, depthWrite: false, env: 1.4 });

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

/* ---------- 粒子流：让"看不见的流动"可见（能量、电流、水流、气流） ---------- */
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

export function glowTube(curve, radius, color, opacity = 0.28) {
  const geo = new THREE.TubeGeometry(curve, 48, radius, 10, false);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { obj: mesh, dispose() { geo.dispose(); mat.dispose(); } };
}

export function dashedLine(points, color = '#8a8272', dash = 0.18, gap = 0.12) {
  const geo = new THREE.BufferGeometry().setFromPoints(
    points.map(p => new THREE.Vector3(...(Array.isArray(p) ? p : [p.x, p.y, p.z]))));
  const mat = new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: true, opacity: 0.7 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

export function solidLine(points, color = '#8a8272', opacity = 0.8) {
  const geo = new THREE.BufferGeometry().setFromPoints(
    points.map(p => new THREE.Vector3(...(Array.isArray(p) ? p : [p.x, p.y, p.z]))));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geo, mat);
}

/** 箭头：力、速度、压强方向都用它 */
export function arrow(from, to, color = '#e04b2f', { head = 0.22, shaft = 0.045 } = {}) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length() || 1e-6;
  const geo = new THREE.CylinderGeometry(shaft, shaft, Math.max(len - head * 1.6, 1e-4), 10);
  const mat = M(color, { rough: 0.5, emissive: color, ei: 0.15 });
  const shaftMesh = new THREE.Mesh(geo, mat);
  shaftMesh.position.copy(from).addScaledVector(dir, 0.5);
  shaftMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const headMesh = new THREE.Mesh(new THREE.ConeGeometry(head, head * 1.7, 14), mat);
  headMesh.position.copy(to).addScaledVector(dir.clone().normalize(), -head * 0.85);
  headMesh.quaternion.copy(shaftMesh.quaternion);
  const g = new THREE.Group();
  g.add(shaftMesh, headMesh);
  g.userData.set = (a, b) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const l = d.length() || 1e-6;
    shaftMesh.scale.set(1, Math.max(l - head * 1.6, 1e-4) / Math.max(len - head * 1.6, 1e-4), 1);
    g.position.set(0, 0, 0);
    shaftMesh.position.copy(a).addScaledVector(d, 0.5);
    shaftMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    headMesh.position.copy(b).addScaledVector(d.clone().normalize(), -head * 0.85);
    headMesh.quaternion.copy(shaftMesh.quaternion);
  };
  return g;
}

/* ---------- 轻量轨道控制（自带，不依赖 addons） ---------- */
class Orbit {
  constructor(camera, dom, target = new THREE.Vector3()) {
    this.camera = camera;
    this.dom = dom;
    this.target = target.clone();
    this.enabled = true;
    this.enableDamping = true;
    this.dampingFactor = 0.09;
    this.minDistance = 1.5;
    this.maxDistance = 70;
    this.minPolarAngle = 0.08;
    this.maxPolarAngle = Math.PI * 0.495;
    this.spherical = new THREE.Spherical().setFromVector3(
      camera.position.clone().sub(this.target));
    this._dTheta = 0; this._dPhi = 0;
    this._pan = new THREE.Vector3();
    this._mode = null;
    this._last = { x: 0, y: 0 };
    this._bind();
  }
  _bind() {
    const d = this.dom;
    d.style.touchAction = 'none';
    d.addEventListener('contextmenu', e => e.preventDefault());
    d.addEventListener('pointerdown', e => {
      if (!this.enabled) return;
      try { d.setPointerCapture(e.pointerId); } catch (_) {}
      this._mode = (e.button === 0 && !e.shiftKey) ? 'rotate' : 'pan';
      this._last = { x: e.clientX, y: e.clientY };
    });
    d.addEventListener('pointermove', e => {
      if (!this._mode || !this.enabled) return;
      const dx = e.clientX - this._last.x;
      const dy = e.clientY - this._last.y;
      this._last = { x: e.clientX, y: e.clientY };
      if (this._mode === 'rotate') {
        this._dTheta -= dx * 0.0055;
        this._dPhi -= dy * 0.0055;
      } else {
        const fov = this.camera.fov * Math.PI / 180;
        const h = 2 * Math.tan(fov / 2) * this.spherical.radius;
        const per = h / Math.max(this.dom.clientHeight, 1);
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
        this._pan.addScaledVector(right, -dx * per).addScaledVector(up, dy * per);
      }
    });
    const end = e => {
      if (this._mode) { try { d.releasePointerCapture(e.pointerId); } catch (_) {} }
      this._mode = null;
    };
    d.addEventListener('pointerup', end);
    d.addEventListener('pointercancel', end);
    d.addEventListener('wheel', e => {
      if (!this.enabled) return;
      e.preventDefault();
      const k = Math.exp(e.deltaY * 0.0012);
      this.spherical.radius = THREE.MathUtils.clamp(
        this.spherical.radius * k, this.minDistance, this.maxDistance);
    }, { passive: false });
  }
  /** 外部直接改了 camera.position / target 之后调用，重新同步球坐标 */
  sync() {
    const off = this.camera.position.clone().sub(this.target);
    this.spherical.setFromVector3(off);
  }
  update() {
    const f = this.enableDamping ? this.dampingFactor : 1;
    this.spherical.theta += this._dTheta * f;
    this.spherical.phi = THREE.MathUtils.clamp(
      this.spherical.phi + this._dPhi * f, this.minPolarAngle, this.maxPolarAngle);
    this.target.addScaledVector(this._pan, f);
    if (this.enableDamping) {
      this._dTheta *= (1 - f);
      this._dPhi *= (1 - f);
      this._pan.multiplyScalar(1 - f);
    } else {
      this._dTheta = 0; this._dPhi = 0; this._pan.set(0, 0, 0);
    }
    this.spherical.makeSafe();
    const off = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(off);
    this.camera.lookAt(this.target);
  }
}

/* ---------- 舞台：渲染器 + 相机 + 五灯布光 + 标签系统 ---------- */
export function createStage(container, labelsEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = getEnvTexture(renderer);
  scene.fog = new THREE.Fog(0xf3efe4, 16, 46);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const controls = new Orbit(camera, renderer.domElement);

  const rig = new THREE.Group();
  rig.add(new THREE.HemisphereLight(0xddebff, 0xf1e9dd, 0.6));

  const key = new THREE.DirectionalLight(0xfff2dc, 2.5);
  key.position.set(5.5, 11, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7.5; key.shadow.camera.right = 7.5;
  key.shadow.camera.top = 7.5; key.shadow.camera.bottom = -7.5;
  key.shadow.camera.near = 1; key.shadow.camera.far = 34;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.022;
  rig.add(key);

  const fill = new THREE.DirectionalLight(0xdce8ff, 0.85);
  fill.position.set(-8, 4.5, 4);
  rig.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.35);
  rim.position.set(-3.5, 6.5, -8.5);
  rig.add(rim);

  const bounce = new THREE.DirectionalLight(0xffe8c4, 0.35);
  bounce.position.set(0, -6, 2);
  rig.add(bounce);
  scene.add(rig);

  /* --- 标签（HTML 覆盖层，始终朝向屏幕、清晰可读） --- */
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
  function clearLabels() { labels.length = 0; labelsEl.innerHTML = ''; }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  return { renderer, scene, camera, controls, lightRig: rig, addLabel, updateLabels, clearLabels, resize };
}

/* ---------- 自动取景：把装置完整装进画面 ---------- */
export function autoFrame(camera, controls, group, { pad = 1.18, force = false } = {}) {
  const box3 = new THREE.Box3().setFromObject(group);
  if (box3.isEmpty()) return;
  const min = box3.min, max = box3.max;
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return;

  camera.updateMatrixWorld();
  const corner = new THREE.Vector3();
  let inside = true;
  for (let i = 0; i < 8 && inside; i++) {
    corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).project(camera);
    if (corner.x < -0.96 || corner.x > 0.96 || corner.y < -0.94 || corner.y > 0.94 || corner.z > 1) inside = false;
  }
  if (inside && !force) return;

  const sph = new THREE.Sphere();
  box3.getBoundingSphere(sph);
  const vFov = camera.fov * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = (sph.radius / Math.sin(Math.min(vFov, hFov) / 2)) * pad;

  const dir = camera.position.clone().sub(controls.target);
  if (dir.length() < 1e-6) dir.set(0, 0.4, 1);
  dir.normalize();
  controls.target.copy(sph.center);
  camera.position.copy(sph.center).addScaledVector(dir, dist);
  camera.lookAt(sph.center);
  controls.sync();
}

/* ---------- 读数面板（右侧实时数据） ---------- */
export function createReadouts(el) {
  return function setReadouts(items) {
    el.innerHTML = items.map(it =>
      `<div class="ro"><span class="ro-l">${it.label}</span>
       <span class="ro-v">${it.val}<i>${it.unit || ''}</i></span></div>`).join('');
  };
}
