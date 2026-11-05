import * as THREE from 'three';

/* ============================================================
   一本摊开的物理手册：印刷页 + 图注 + 可翻开的封面
   ============================================================ */

const SERIF = '"Songti SC","SimSun","Noto Serif SC",Georgia,serif';
const plain = s => String(s).replace(/<[^>]+>/g, '');

function wrapText(g, text, x, y, maxW, lh, maxLines = 99) {
  let line = '', n = 0;
  for (const ch of text) {
    if (ch === '\n') { g.fillText(line, x, y); y += lh; line = ''; n++; continue; }
    const test = line + ch;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y); y += lh; line = ch; n++;
      if (n >= maxLines) return y;
    } else line = test;
  }
  if (line) { g.fillText(line, x, y); y += lh; }
  return y;
}

function paperBase(g, W, H) {
  g.fillStyle = '#fbf5e6';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(168,146,104,${Math.random() * 0.045})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
}

function drawLeft(g, x0, w, H, lesson, idx, m) {
  g.save();
  g.beginPath(); g.rect(x0, 0, w, H); g.clip();
  g.fillStyle = '#a2937a';
  g.font = `600 20px Georgia,serif`;
  g.fillText(`LESSON  ${String(idx + 1).padStart(2, '0')}`, x0 + m, 128);
  g.strokeStyle = 'rgba(140,120,86,.5)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(x0 + m, 148); g.lineTo(x0 + w - m, 148); g.stroke();

  g.fillStyle = '#3b3830';
  g.font = `700 46px ${SERIF}`;
  let y = wrapText(g, lesson.title, x0 + m, 216, w - m * 2, 62, 2);

  g.fillStyle = '#8d8474';
  g.font = `italic 20px Georgia,serif`;
  g.fillText('Physics Notebook · Energy', x0 + m, y + 18);
  y += 62;

  g.strokeStyle = 'rgba(140,120,86,.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0 + m, y); g.lineTo(x0 + m + 120, y); g.stroke();
  y += 46;

  g.fillStyle = '#5f5849';
  g.font = `21px ${SERIF}`;
  y = wrapText(g, plain(lesson.concept[0]), x0 + m, y, w - m * 2 - 10, 38, 9);

  g.fillStyle = '#9a8f77';
  g.font = `17px Georgia,serif`;
  g.fillText(`— ${idx + 1} —`, x0 + w / 2 - 24, H - 56);
  g.restore();
}

function drawRight(g, x0, w, H, lesson, idx, m) {
  g.save();
  g.beginPath(); g.rect(x0, 0, w, H); g.clip();
  g.fillStyle = '#a2937a';
  g.font = `600 20px Georgia,serif`;
  const hd = '纸上实验 · 能量篇';
  g.fillText(hd, x0 + w - m - g.measureText(hd).width, 128);

  // 印刷小插图（墨线草图）
  g.save();
  g.translate(x0 + w - m - 110, 250);
  g.strokeStyle = 'rgba(90,78,58,.42)'; g.lineWidth = 1.6;
  g.beginPath(); g.arc(0, 0, 42, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(-58, 0); g.lineTo(58, 0); g.stroke();
  g.beginPath(); g.moveTo(0, -58); g.lineTo(0, 58); g.stroke();
  g.beginPath(); g.moveTo(30, -30); g.lineTo(58, -58); g.stroke();
  g.beginPath(); g.moveTo(58, -58); g.lineTo(44, -54); g.stroke();
  g.beginPath(); g.moveTo(58, -58); g.lineTo(54, -44); g.stroke();
  g.font = 'italic 15px Georgia,serif'; g.fillStyle = 'rgba(90,78,58,.5)';
  g.fillText('fig.', -46, 74);
  g.restore();

  g.fillStyle = '#5f5849';
  g.font = `21px ${SERIF}`;
  let y = wrapText(g, plain(lesson.concept[1] || ''), x0 + m, 220, w - m * 2 - 150, 38, 6);

  // 公式印刷版
  y = Math.max(y + 30, 560);
  g.fillStyle = 'rgba(217,111,30,.10)';
  g.fillRect(x0 + m - 14, y - 34, w - m * 2 + 28, 96);
  g.fillStyle = '#8a4a1c';
  g.font = `600 34px ${SERIF}`;
  g.fillText(lesson.formulaText || '', x0 + m, y + 26);

  // 图注
  g.fillStyle = '#3b3830';
  g.font = `600 26px ${SERIF}`;
  g.fillText(`图 ${idx + 1}　${lesson.title.split('：')[0]}`, x0 + m, H - 150);
  g.fillStyle = '#8d8474';
  g.font = `italic 18px Georgia,serif`;
  g.fillText(`Fig. ${idx + 1}  Three-dimensional experiment on paper`, x0 + m, H - 116);

  g.fillStyle = '#9a8f77';
  g.font = `17px Georgia,serif`;
  g.fillText(`— ${idx + 2} —`, x0 + w / 2 - 24, H - 56);
  g.restore();
}

function drawPages(canvas, lesson, idx) {
  const W = canvas.width, H = canvas.height, half = W / 2, m = 92;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, W, H);
  paperBase(g, W, H);

  drawLeft(g, 0, half, H, lesson, idx, m);
  drawRight(g, half, half, H, lesson, idx, m);

  // 中缝阴影
  const grad = g.createLinearGradient(half - 100, 0, half + 100, 0);
  grad.addColorStop(0, 'rgba(120,98,64,0)');
  grad.addColorStop(0.5, 'rgba(120,98,64,.22)');
  grad.addColorStop(1, 'rgba(120,98,64,0)');
  g.fillStyle = grad;
  g.fillRect(half - 100, 0, 200, H);

  // 外缘微暗
  const el = g.createLinearGradient(0, 0, 60, 0);
  el.addColorStop(0, 'rgba(120,98,64,.16)'); el.addColorStop(1, 'rgba(120,98,64,0)');
  g.fillStyle = el; g.fillRect(0, 0, 60, H);
  const er = g.createLinearGradient(W, 0, W - 60, 0);
  er.addColorStop(0, 'rgba(120,98,64,.16)'); er.addColorStop(1, 'rgba(120,98,64,0)');
  g.fillStyle = er; g.fillRect(W - 60, 0, 60, H);
}

function coverTexture(W = 1024, H = 740) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  paintCover(c.getContext('2d'), W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { t, c };
}

function paintCover(g, W, H) {
  g.save();
  g.fillStyle = '#6b3821'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  // 布纹
  g.strokeStyle = 'rgba(255,220,180,.03)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  // 烫金框
  g.strokeStyle = 'rgba(201,163,92,.75)'; g.lineWidth = 2.5;
  g.strokeRect(56, 56, W - 112, H - 112);
  g.strokeStyle = 'rgba(201,163,92,.35)'; g.lineWidth = 1;
  g.strokeRect(70, 70, W - 140, H - 140);

  g.fillStyle = '#e8c889';
  g.textAlign = 'center';
  g.font = `700 84px ${SERIF}`;
  g.fillText('纸上实验', W / 2, 300);
  g.font = `400 28px ${SERIF}`;
  g.fillStyle = 'rgba(232,200,137,.85)';
  g.fillText('教 材 · 3D 互 动 实 验 室', W / 2, 360);
  g.font = 'italic 18px Georgia,serif';
  g.fillStyle = 'rgba(232,200,137,.55)';
  g.fillText('Textbook as the base · 3D on the page', W / 2, 400);
  g.strokeStyle = 'rgba(201,163,92,.5)';
  g.beginPath(); g.moveTo(W / 2 - 120, 440); g.lineTo(W / 2 + 120, 440); g.stroke();
  g.font = '400 20px Georgia,serif';
  g.fillStyle = 'rgba(232,200,137,.7)';
  g.fillText('OPEN  THE  BOOK', W / 2, H - 110);
  g.textAlign = 'left';
  g.restore();
}

export function createBook(scene, size = 12) {
  const W = size, D = size / 1.43, pageY = 0.26;   // 双页比例贴合 A4 教材（1.43:1）
  const group = new THREE.Group();
  scene.add(group);

  // 桌面
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 46),
    new THREE.MeshStandardMaterial({ color: '#eee4cc', roughness: 1 })
  );
  desk.rotation.x = -Math.PI / 2;
  desk.position.y = -0.36;
  desk.receiveShadow = true;
  group.add(desk);

  // 页面贴图
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = Math.round(2048 * D / W);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // 纸张表面（中缝下凹）
  const pageGeo = new THREE.PlaneGeometry(W, D, 80, 12);
  const pos = pageGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + W / 2) / W;
    const gutter = -0.20 * Math.exp(-Math.pow((u - 0.5) / 0.042, 2));
    const lift = 0.045 * Math.pow(Math.abs(u - 0.5) * 2, 4);
    pos.setZ(i, gutter + lift);
  }
  pageGeo.computeVertexNormals();
  const page = new THREE.Mesh(pageGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94 }));
  page.rotation.x = -Math.PI / 2;
  page.position.y = pageY;
  page.receiveShadow = true;
  group.add(page);

  // 书页厚度
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.06, 0.22, D - 0.06),
    new THREE.MeshStandardMaterial({ color: '#f4ead4', roughness: 0.96 })
  );
  block.position.y = pageY - 0.12;
  block.receiveShadow = true; block.castShadow = true;
  group.add(block);

  // 页口线（模拟一叠纸）
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const l = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.006, D - 0.1),
        new THREE.MeshStandardMaterial({ color: '#dccfae', roughness: 1 })
      );
      l.position.set(s * (W / 2 - 0.03), pageY - 0.22 + i * 0.045, 0);
      group.add(l);
    }
  }

  // 硬底封
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.6, 0.14, D + 0.6),
    new THREE.MeshStandardMaterial({ color: '#5c2f1b', roughness: 0.88 })
  );
  board.position.y = pageY - 0.29;
  board.receiveShadow = true; board.castShadow = true;
  group.add(board);

  // 书签带
  const ribbon = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 1.0),
    new THREE.MeshStandardMaterial({ color: '#b23a1e', roughness: 0.8, side: THREE.DoubleSide })
  );
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.position.set(0.18, pageY + 0.012, D / 2 + 0.18);
  group.add(ribbon);

  // 封面（绕左侧书脊翻开）
  const coverTex = coverTexture();
  const sideMat = new THREE.MeshStandardMaterial({ color: '#5c2f1b', roughness: 0.92, transparent: true });
  const topMat = new THREE.MeshStandardMaterial({ map: coverTex.t, roughness: 0.88, transparent: true });
  const hinge = new THREE.Group();
  hinge.position.set(-(W / 2 + 0.3), pageY + 0.075, 0);
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.6, 0.12, D + 0.6),
    [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
  );
  cover.position.set((W + 0.6) / 2, 0, 0);
  cover.castShadow = true;
  hinge.add(cover);
  group.add(hinge);

  const st = { opening: false, opened: false, t: 0, flip: null };
  if (new URLSearchParams(location.search).has('open')) {
    hinge.visible = false;
    st.opened = true;
  }

  // 翻页薄片（懒创建）
  let flipPivot = null, flipSheet = null;
  function ensureFlip() {
    if (flipPivot) return;
    flipPivot = new THREE.Group();
    flipPivot.position.y = pageY + 0.015;
    flipSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(W / 2 + 0.34, D),
      new THREE.MeshStandardMaterial({ color: '#f5eedd', roughness: 0.95, side: THREE.DoubleSide })
    );
    flipSheet.rotation.x = -Math.PI / 2;
    flipSheet.castShadow = true;
    flipSheet.position.x = (W / 2 + 0.34) / 2;
    flipPivot.add(flipSheet);
    flipPivot.visible = false;
    group.add(flipPivot);
  }

  return {
    group, pageY, W, D, canvas, tex,
    /* 把外部渲染好的跨页位图贴到书页 */
    blit() { tex.needsUpdate = true; },
    /* 在封面上叠加教材封面位图 */
    setCoverImage(src) {
      const g = coverTex.c.getContext('2d');
      g.save();
      g.globalAlpha = 0.94;
      const pad = 60;
      const cw = coverTex.c.width - pad * 2, ch = coverTex.c.height - pad * 2;
      const s = Math.min(cw / src.width, ch / src.height);
      const dw = src.width * s, dh = src.height * s;
      g.fillStyle = '#5c2f1b'; g.fillRect(pad - 6, pad - 6, cw + 12, ch + 12);
      g.drawImage(src, pad + (cw - dw) / 2, pad + (ch - dh) / 2, dw, dh);
      g.restore();
      coverTex.t.needsUpdate = true;
    },
    /* 翻页：dir=1 前进（右→左），dir=-1 后退；midCb 在页片立直时调用（换纹理），endCb 在落定时调用 */
    flipTo(dir, midCb, endCb) {
      if (st.flip) return false;
      ensureFlip();
      flipSheet.position.x = dir > 0 ? (W / 2 + 0.34) / 2 : -(W / 2 + 0.34) / 2;
      flipPivot.rotation.z = 0;
      flipPivot.visible = true;
      st.flip = { dir, t: 0, midDone: false, midCb, endCb };
      return true;
    },
    open() { if (!st.opened && !st.opening) { st.opening = true; st.t = 0; } },
    isOpen: () => st.opened,
    update(dt) {
      if (st.flip) {
        const f = st.flip;
        f.t += dt / 0.9;
        const k = Math.min(1, f.t);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        flipPivot.rotation.z = (f.dir > 0 ? 1 : -1) * Math.PI * e;
        if (k >= 0.5 && !f.midDone) { f.midDone = true; f.midCb && f.midCb(); }
        if (k >= 1) { flipPivot.visible = false; st.flip = null; f.endCb && f.endCb(); }
      }
      if (!st.opening) return;
      st.t += dt;
      const k = Math.min(1, st.t / 1.2);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      hinge.rotation.z = -Math.PI * e;
      const op = k < 0.72 ? 1 : Math.max(0, 1 - (k - 0.72) / 0.28);
      sideMat.opacity = op; topMat.opacity = op;
      if (k >= 1) { st.opening = false; st.opened = true; hinge.visible = false; }
    },
  };
}
