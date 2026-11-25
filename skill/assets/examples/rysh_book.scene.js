/* ============================================================
   语文 · 一年级上册 · 识字4《日月水火》
   ------------------------------------------------------------
   象形字演变：左边是真实世界的 3D 物象（太阳/月牙/水波/火焰），
   右边是笔画挤出的立体汉字。拖"演变"滑块，物象淡去、笔画
   一根根立起来——古人就是把图简化成字的。
   ============================================================ */

const GLYPHS = {
  "日": { s: ["M 349 664 Q 348 665 347 666 Q 322 687 292 696 Q 282 697 274 689 Q 270 682 279 670 Q 331 531 294 261 Q 287 216 271 169 Q 262 141 267 118 Q 277 81 291 65 Q 304 50 314 66 Q 324 79 332 102 L 339 137 Q 349 186 350 238 Q 350 316 351 391 L 352 420 Q 353 576 361 626 C 364 652 364 652 349 664 Z","M 608 120 Q 641 78 665 39 Q 675 18 688 19 Q 707 20 724 59 Q 745 104 740 157 Q 728 310 721 593 Q 720 629 738 654 Q 748 669 738 681 Q 716 703 656 730 Q 635 740 617 729 Q 512 684 349 664 C 319 660 332 620 361 626 Q 410 635 590 672 Q 624 679 640 666 Q 691 615 658 164 Q 657 163 657 159 Q 653 143 640 144 C 621 121 602 128 608 120 Z","M 351 391 Q 390 378 433 387 Q 493 399 554 411 Q 582 417 587 421 Q 596 428 591 437 Q 584 447 556 455 Q 531 461 450 435 Q 375 423 352 420 C 322 416 322 400 351 391 Z","M 332 102 Q 345 98 361 100 Q 440 115 608 120 C 638 121 661 122 640 144 Q 633 153 614 166 Q 596 178 561 170 Q 438 146 339 137 C 309 134 303 108 332 102 Z"], m: [[[284,684],[321,646],[328,617],[332,516],[323,261],[302,136],[302,70]],[[359,660],[374,648],[388,650],[635,703],[668,687],[690,665],[699,450],[699,159],[685,105],[688,37]],[[357,413],[369,404],[398,404],[534,432],[581,431]],[[340,106],[355,119],[432,130],[585,147],[632,143]]] },
  "月": { s: ["M 398 390 Q 410 502 412 535 L 414 566 Q 417 717 420 735 C 422 758 422 758 405 766 Q 405 767 404 767 Q 353 791 337 787 Q 316 783 334 760 Q 373 697 357 455 Q 353 356 304 239 Q 271 154 155 37 Q 140 24 137 16 Q 136 9 148 10 Q 164 11 186 26 Q 246 69 281 112 Q 333 173 363 244 Q 382 296 394 361 L 398 390 Z","M 420 735 Q 429 735 609 769 Q 631 773 637 762 Q 656 713 657 390 Q 657 128 640 101 Q 634 94 612 99 Q 581 105 549 111 Q 527 117 528 107 Q 595 55 633 16 Q 649 -3 665 -9 Q 675 -13 685 -2 Q 730 53 725 113 Q 712 321 709 657 Q 708 721 723 750 Q 736 772 723 783 Q 698 804 658 820 Q 639 827 621 820 Q 569 793 536 785 Q 493 773 405 766 C 375 763 390 730 420 735 Z","M 412 535 Q 442 529 533 542 Q 587 551 594 554 Q 603 561 599 569 Q 592 579 566 587 Q 538 594 511 583 Q 487 576 462 572 Q 440 568 414 566 C 384 564 382 540 412 535 Z","M 394 361 Q 428 351 561 374 Q 564 375 568 375 Q 590 379 594 382 Q 603 389 599 397 Q 592 407 566 415 Q 538 421 511 411 Q 484 404 456 397 Q 428 393 398 390 C 368 387 365 368 394 361 Z"], m: [[[339,773],[379,742],[387,685],[385,504],[366,342],[341,259],[296,169],[236,93],[184,43],[145,17]],[[415,764],[429,752],[503,762],[634,796],[666,780],[681,758],[687,291],[683,93],[664,56],[632,63],[538,104]],[[417,542],[430,550],[535,566],[588,564]],[[399,368],[413,375],[535,394],[588,392]]] },
  "水": { s: ["M 535 506 Q 538 699 560 762 Q 578 793 520 817 Q 486 836 465 830 Q 447 823 463 799 Q 485 771 486 736 Q 490 697 478 121 Q 477 97 463 88 Q 454 81 432 88 Q 407 94 382 99 Q 348 111 351 100 Q 352 93 373 78 Q 440 24 457 -5 Q 476 -41 493 -42 Q 508 -43 524 -7 Q 543 41 541 117 Q 531 294 534 470 L 535 506 Z","M 154 501 Q 141 501 139 492 Q 138 485 153 477 Q 199 452 227 461 Q 333 489 343 489 Q 359 486 347 456 Q 296 326 249 262 Q 201 190 114 119 Q 99 106 110 103 Q 120 102 141 113 Q 217 153 281 224 Q 342 288 419 454 Q 429 478 441 489 Q 456 501 447 511 Q 437 524 399 537 Q 378 549 336 530 Q 270 509 154 501 Z","M 590 446 Q 630 476 766 584 Q 787 603 814 615 Q 838 627 825 647 Q 809 666 779 681 Q 752 696 738 692 Q 723 691 729 675 Q 735 639 659 553 Q 620 508 577 459 C 557 436 566 428 590 446 Z","M 577 459 Q 555 484 535 506 C 515 528 516 494 534 470 Q 756 161 817 160 Q 898 169 967 175 Q 995 178 996 185 Q 997 192 964 205 Q 810 253 753 295 Q 690 346 590 446 L 577 459 Z"], m: [[[473,814],[500,795],[521,770],[508,455],[507,91],[485,42],[442,56],[371,91],[369,98],[358,98]],[[147,491],[209,482],[354,512],[381,505],[392,495],[384,459],[353,387],[280,261],[187,160],[113,110]],[[737,682],[750,671],[766,637],[721,583],[591,461],[590,452]],[[539,500],[550,465],[618,387],[729,271],[782,229],[820,207],[990,185]]] },
  "火": { s: ["M 226 483 Q 254 443 285 393 Q 295 375 312 372 Q 324 369 333 381 Q 342 396 342 430 Q 342 472 235 536 Q 220 543 213 543 Q 206 540 204 526 Q 205 513 226 483 Z","M 690 568 Q 677 547 584 441 Q 571 422 592 425 Q 638 449 738 513 Q 762 532 791 543 Q 816 553 805 575 Q 789 597 759 615 Q 731 633 715 629 Q 700 628 704 612 Q 708 590 690 568 Z","M 511 382 Q 520 439 529 618 Q 530 669 548 728 Q 554 741 543 750 Q 521 769 479 785 Q 454 795 434 789 Q 410 779 430 759 Q 464 725 465 690 Q 469 500 448 374 Q 427 209 284 106 Q 244 81 186 49 Q 170 43 167 39 Q 160 32 179 29 Q 197 28 258 48 Q 301 61 365 101 Q 414 131 442 172 Q 484 232 504 341 L 511 382 Z","M 504 341 Q 597 175 715 40 Q 740 9 767 9 Q 843 13 911 17 Q 939 18 940 25 Q 941 32 910 48 Q 753 117 709 157 Q 592 268 511 382 C 493 406 489 367 504 341 Z"], m: [[[216,534],[299,440],[316,391]],[[714,618],[736,593],[744,571],[696,522],[587,433]],[[436,773],[475,753],[497,733],[503,713],[488,443],[470,321],[456,275],[418,195],[368,138],[279,78],[174,36]],[[513,375],[521,341],[606,223],[689,127],[745,76],[768,60],[934,25]]] },
};

const RYS = {
  ri:  { ch: '日', pinyin: 'rì',  hue: '#e8a020', gloss: '圆圆的太阳',
         line: '圆圆的太阳挂在天上，古人画一个圆圈，中间加一点，就是日。' },
  yue: { ch: '月', pinyin: 'yuè', hue: '#d8c25a', gloss: '弯弯的月牙',
         line: '弯弯的月牙，古人照着它的样子画，就是月。' },
  shui:{ ch: '水', pinyin: 'shuǐ', hue: '#3f8fc0', gloss: '流动的水',
         line: '河水哗哗流，中间是主流，旁边是水花，就是水。' },
  huo: { ch: '火', pinyin: 'huǒ', hue: '#d95a1e', gloss: '跳动的火苗',
         line: '火苗往上跳，中间一根大火苗，两边小火苗，就是火。' },
};

export const meta = {
  tag: '语文 · 一年级上册 · 象形字',
  title: '日月水火：从图画到文字（教材版）',
  lead: '最早的字就是画。太阳画成圆，月牙画成弯钩，水画成水纹，火画成火苗——把它们画简单、画整齐，就成了今天的字。',

  concept: `
    <p>这四个字叫 <b>象形字</b>：<em>照着东西的样子画出来的字</em>。</p>
    <p>把 3D 实物和字放在一起看：<b>太阳 → 日</b>，<b>月牙 → 月</b>，<b>水流 → 水</b>，<b>火苗 → 火</b>。笔画不是乱写的，每一根都是从图画里"简"下来的。</p>
    <p>拖动滑块，看实物慢慢淡去、笔画一根根站起来。</p>`,

  formula: {
    label: '字理',
    expr: '实物 <span class="op">→</span> 图画 <span class="op">→</span> 文字',
    note: '先有东西，再有图画，最后才变成字。',
  },

  points: [
    '象形字 = 照着物体的样子画出来的字',
    '「日」4 画，「月」4 画，「水」4 画，「火」4 画',
    '想一想：山、田、口，是不是也是照样子画的？',
  ],

  question: '你还能想到哪些"照样子画"的字？山、田、木，试试对着它们真实的样子看一看。',

  controls: [
    { key: 'evol', label: '实物 ↔ 文字', min: 0, max: 1, step: 0.01, value: 0.55, unit: '' },
  ],

  controlsLabel: '慢慢变',
  playLabel: '演一遍',
  readoutLabel: '这个字',
  tts: true,
  ttsLabel: '读一遍',

  actions: [
    { key: 'ri', label: '日', on: true },
    { key: 'yue', label: '月' },
    { key: 'shui', label: '水' },
    { key: 'huo', label: '火' },
  ],

  cam: { pos: [0, 5.2, 11.5], target: [0, 2.6, 0] },
};

export function create({ scene, camera, controls, addLabel }) {
  const SIZE = 2.15;         // 字号
  const Y0 = 4.3;            // 悬空高度(教材版: 页面竖版, 装置在上半部)
  const THK = 0.105;
  const OBJ_X = -1.45;       // 实物位置(教材版靠拢)
  const CHR_X = 1.45;        // 文字位置(教材版靠拢)
  const INK_A = '#16140f';
  const INK_B = '#3a342a';
  const RED = '#c2401e';
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  /* ================= 一、SVG 路径解析（同会意字课件） ================= */
  const TOK = /([MmLlHhVvCcQqSsZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  function tokenize(d) {
    const out = []; let m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(d)) !== null) out.push(m[1] !== undefined ? m[1] : parseFloat(m[2]));
    return out;
  }
  function pathToShapes(d, k, cx, cy) {
    const t = tokenize(d);
    const sp = new THREE.ShapePath();
    const X = v => (v - cx) * k, Y = v => (v - cy) * k;
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
    while (i < t.length) {
      if (typeof t[i] === 'string') cmd = t[i++];
      if (i >= t.length) break;
      const C = cmd.toUpperCase(), rel = cmd !== C;
      if (C === 'Z') { x = sx; y = sy; if (typeof t[i] !== 'string') i++; continue; }
      const n = () => t[i++];
      if (C === 'M' || C === 'L') {
        let nx = n(), ny = n(); if (rel) { nx += x; ny += y; }
        x = nx; y = ny;
        if (C === 'M') { sp.moveTo(X(x), Y(y)); sx = x; sy = y; cmd = rel ? 'l' : 'L'; }
        else sp.lineTo(X(x), Y(y));
      } else if (C === 'H') { let nx = n(); if (rel) nx += x; x = nx; sp.lineTo(X(x), Y(y));
      } else if (C === 'V') { let ny = n(); if (rel) ny += y; y = ny; sp.lineTo(X(x), Y(y));
      } else if (C === 'Q') {
        let x1 = n(), y1 = n(), nx = n(), ny = n();
        if (rel) { x1 += x; y1 += y; nx += x; ny += y; }
        sp.quadraticCurveTo(X(x1), Y(y1), X(nx), Y(ny)); x = nx; y = ny;
      } else if (C === 'C') {
        let x1 = n(), y1 = n(), x2 = n(), y2 = n(), nx = n(), ny = n();
        if (rel) { x1 += x; y1 += y; x2 += x; y2 += y; nx += x; ny += y; }
        sp.bezierCurveTo(X(x1), Y(y1), X(x2), Y(y2), X(nx), Y(ny)); x = nx; y = ny;
      } else i++;
    }
    return sp.toShapes(true);
  }

  /* ================= 二、纸面 ================= */
  let usingBook = false;   // 教材底图模式：不随字切换改纸面（提前声明，供 tryBookTex 使用）
  const pageGeo = new THREE.PlaneGeometry(5.2, 7.3);
  pageGeo.rotateX(-Math.PI / 2);
  const pageMat = new THREE.MeshPhysicalMaterial({
    map: pageTexture('日'),
    color: '#a39277', roughness: 0.94, metalness: 0, clearcoat: 0, envMapIntensity: 0.22,
  });
  const page = new THREE.Mesh(pageGeo, pageMat);
  page.position.y = 0.02;
  page.receiveShadow = true;
  scene.add(page);

  /* 教材底图就绪后替换纸面（若 build 时带了 --book-page） */
  (function tryBookTex(){
    if (window.__BOOKTEX) {
      usingBook = true;
      pageMat.map = window.__BOOKTEX;
      pageMat.color.set('#ffffff');   // 教材页本身有底色，不再压暗
      pageMat.needsUpdate = true;
    } else {
      setTimeout(tryBookTex, 120);
    }
  })();

  const board = box(5.2, 0.08, 7.3, M('#e2d5b8', { rough: 0.85, env: 0.3 }));
  board.position.y = -0.04;
  board.receiveShadow = true;
  scene.add(board);

  function pageTexture(ch) {
    const W = 1024, H = 654;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#f6efdd'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      g.strokeStyle = `rgba(${168 + Math.random() * 40},${158 + Math.random() * 35},${132 + Math.random() * 35},${0.04 + Math.random() * 0.05})`;
      g.lineWidth = 0.6 + Math.random();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + Math.random() * 38, y + (Math.random() - .5) * 2); g.stroke();
    }
    // 两个田字格：左边实物位（淡），右边文字位
    const S = 430;
    [[W * 0.255], [W * 0.745]].forEach(([cx0]) => {
      const L = cx0 - S / 2, T = H / 2 - S / 2 - 10;
      g.strokeStyle = 'rgba(180,52,24,.5)'; g.lineWidth = 4.4;
      g.strokeRect(L, T, S, S);
      g.setLineDash([14, 11]); g.lineWidth = 2.8;
      g.beginPath();
      g.moveTo(cx0, T); g.lineTo(cx0, T + S);
      g.moveTo(L, T + S / 2); g.lineTo(L + S, T + S / 2);
      g.stroke(); g.setLineDash([]);
    });
    // 描红
    if (ch) {
      g.fillStyle = 'rgba(80,70,55,.12)';
      g.font = '500 360px "KaiTi","STKaiti","Songti SC",Georgia,serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(ch, W * 0.745, H / 2 - 10 + 12);
    }
    g.fillStyle = 'rgba(92,82,64,.55)';
    g.font = '500 30px "Songti SC", Georgia, serif'; g.textAlign = 'left';
    g.fillText('识字 · 象形字', 60, H - 48);
    const sx = W - 172, sy = H - 168, ss = 98;
    g.save(); g.translate(sx, sy); g.rotate(-0.04);
    g.strokeStyle = 'rgba(194,64,30,.78)'; g.lineWidth = 6; g.strokeRect(0, 0, ss, ss);
    g.fillStyle = 'rgba(194,64,30,.78)';
    g.font = '600 41px "Songti SC", Georgia, serif'; g.textAlign = 'center';
    g.fillText('象', ss / 2, 45); g.fillText('形', ss / 2, 88);
    g.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }
  function setPageChar(ch) {
    if (usingBook) return;
    const old = pageMat.map;
    pageMat.map = pageTexture(ch);
    pageMat.needsUpdate = true;
    if (old && old.dispose) old.dispose();
  }

  /* ================= 三、实物（象形来源） ================= */
  const objGrp = new THREE.Group();
  objGrp.position.set(OBJ_X, Y0, 0);
  scene.add(objGrp);
  let objParts = [];     // 需要 update 的动画件
  let objMats = [];      // 需要整体淡出的材质

  function matOf(color, o = {}) {
    return new THREE.MeshPhysicalMaterial({
      color, roughness: o.rough ?? 0.5, metalness: o.metal ?? 0,
      emissive: o.emissive ?? color, emissiveIntensity: o.ei ?? 0.12,
      transparent: true, opacity: 1, clearcoat: 0.3, envMapIntensity: 0.6,
    });
  }

  function buildSun() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.78, 40, 28), matOf('#f2b02e', { ei: 0.55, rough: 0.42 }));
    g.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite(), color: '#ffca5f', transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(3.4); g.add(halo);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 10), matOf('#f2b02e', { ei: 0.5 }));
      ray.position.set(Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0);
      ray.rotation.z = a - Math.PI / 2;
      g.add(ray); objParts.push({ m: ray, spin: a });
    }
    return g;
  }

  function buildMoon() {
    const g = new THREE.Group();
    const R = 0.92;
    const sh = new THREE.Shape();
    sh.absarc(0, 0, R, Math.PI * 0.42, Math.PI * 1.58, false);
    sh.absarc(R * 0.42, 0, R * 0.8, Math.PI * 1.58, Math.PI * 0.42, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 36 });
    geo.translate(0, 0, -0.11);
    const m = new THREE.Mesh(geo, matOf('#e9d47a', { ei: 0.42, rough: 0.5 }));
    g.add(m);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite(), color: '#fff2c0', transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(3.1); g.add(halo);
    return g;
  }

  function buildWater() {
    const g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(2.15, 1.5, 30, 18);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, matOf('#3f8fc0', { ei: 0.3, rough: 0.18 }));
    m.material.transparent = true; m.material.opacity = 0.92;
    g.add(m);
    objParts.push({ waves: { geo, t: 0 } });
    // 下面一个静水基座
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.3, 1.5), matOf('#2f6fa0', { ei: 0.22, rough: 0.3 }));
    base.position.y = -0.75;
    g.add(base);
    return g;
  }

  function buildFire() {
    const g = new THREE.Group();
    const flame = (r, h, color, ei, y) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14), matOf(color, { ei, rough: 0.4 }));
      f.position.y = y; g.add(f);
      objParts.push({ flick: f, base: 1 });
      return f;
    };
    flame(0.5, 1.25, '#e05a15', 0.6, 0.32);
    flame(0.33, 0.9, '#f6a021', 0.7, 0.24);
    flame(0.17, 0.55, '#ffe9a8', 0.8, 0.16);
    const log1 = box(1.0, 0.14, 0.16, M('#6b4526', { rough: 0.8 }));
    log1.rotation.y = 0.3; log1.position.y = -0.62; g.add(log1);
    const log2 = log1.clone(); log2.rotation.y = -0.5; log2.position.y = -0.5; g.add(log2);
    return g;
  }

  const objBuilders = { 日: buildSun, 月: buildMoon, 水: buildWater, 火: buildFire };

  function disposeObj() {
    objGrp.traverse(o => { if (o.isMesh || o.isSprite) o.geometry && o.geometry.dispose(); });
    objGrp.clear();
    objParts = []; objMats = [];
  }

  function buildObj(ch) {
    disposeObj();
    const g = objBuilders[ch]();
    objGrp.add(g);
    objGrp.traverse(o => { if (o.material && o.material.transparent) objMats.push(o.material); });
  }

  /* ================= 四、文字（笔画挤出） ================= */
  const chrGrp = new THREE.Group();
  scene.add(chrGrp);
  let strokes = [];      // [{ mesh, mat, scatter:{...} }]

  function disposeChr() {
    chrGrp.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    chrGrp.clear();
    strokes = [];
  }

  function buildGlyph(ch) {
    disposeChr();
    const data = GLYPHS[ch];
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    data.s.forEach(d => pathToShapes(d, 1, 0, 0).forEach(sh =>
      sh.getPoints(10).forEach(p => {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      })));
    const k = SIZE / Math.max(maxX - minX, maxY - minY, 1e-3);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

    data.s.forEach((d, i) => {
      const shapes = pathToShapes(d, k, cx, cy);
      let geo = shapes.length
        ? new THREE.ExtrudeGeometry(shapes, { depth: THK, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 1, curveSegments: 5 })
        : new THREE.BoxGeometry(0.05, 0.05, THK);
      geo.translate(0, 0, -THK / 2);
      geo.computeVertexNormals();
      const mat = M(i % 2 ? INK_B : INK_A, { rough: 0.46, coat: 0.24, env: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.step = i;
      // 散落起始位（未写出来时）
      const ang = i / Math.max(1, data.s.length) * Math.PI * 2;
      mesh.userData.scatter = {
        x: Math.cos(ang) * 1.4, y: 0.9 + Math.sin(ang * 2) * 0.5, z: 1.1 + (i % 3) * 0.3,
        rz: (i * 53 % 11 - 5) * 0.16,
      };
      chrGrp.add(mesh);
      strokes.push({ mesh, mat });
    });
    chrGrp.position.set(CHR_X, Y0, 0);
  }

  /* ================= 五、标签与箭头 ================= */
  const ancObj = new THREE.Object3D(), ancChr = new THREE.Object3D();
  scene.add(ancObj, ancChr);
  ancObj.position.set(OBJ_X, Y0 + 1.35, 0);
  ancChr.position.set(CHR_X, Y0 + SIZE * 0.58, 0);
  const labObj = addLabel('实物', ancObj, { sub: '真实的样子' });
  const labChr = addLabel('日', ancChr, { sub: '象形字' });
  labChr.el.style.cssText += `;background:${RED};color:#fff;border-color:${RED}`;

  const leadArrow = arrow(
    new THREE.Vector3(OBJ_X + 1.05, Y0 + 0.5, 0),
    new THREE.Vector3(CHR_X - SIZE * 0.72, Y0 + 0.5, 0), RED,
    { head: 0.13, shaft: 0.017 });
  leadArrow.children.forEach(m => { m.material = M(RED, { rough: 0.5, opacity: 0.5, emissive: RED, ei: 0.2 }); });
  scene.add(leadArrow);

  /* ================= 六、TTS（优先晓晓） ================= */
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

  /* ================= 七、状态 ================= */
  const state = { phase: 'idle', t: 0, evol: 0.55, tgtEvol: 0.55, cur: '日' };

  function setChar(ch) {
    state.cur = ch;
    buildObj(ch);
    buildGlyph(ch);
    const info = RYS[Object.keys(RYS).find(k => RYS[k].ch === ch)];
    labObj.el.innerHTML = `象<span class="sub">真实的样子</span>`;
    labChr.el.innerHTML = `${ch}<span class="sub">${info.gloss}</span>`;
    setPageChar(ch);
    state.phase = 'idle'; state.t = 0;
    state.evol = 0.55; state.tgtEvol = 0.55;
    autoFrame(camera, controls, scene, { pad: 1.14, force: true });
    applyEvol(1);   // 首帧立即应用初始半程（实物+字并存）
  }

  function applyEvol(dt) {
    const k = Math.min(1, dt * 5);
    state.evol = lerp(state.evol, state.tgtEvol, k);
    const e = state.evol;

    // 实物：放大一点、淡出
    objGrp.scale.setScalar(lerp(1, 0.78, smooth(Math.max(0, (e - 0.3) / 0.7))));
    const op = 1 - smooth(Math.max(0, (e - 0.45) / 0.5));
    objMats.forEach(m => { m.opacity = op; });
    objGrp.visible = op > 0.02;

    // 笔画：按序立起
    const n = strokes.length;
    strokes.forEach((s, i) => {
      const local = Math.max(0, Math.min(1, (e * (n + 1.2) - i * 0.9)));
      const a = smooth(local);
      const u = s.mesh.userData, sc = u.scatter;
      s.mesh.visible = a > 0.02;
      s.mesh.position.set(lerp(sc.x, 0, a), lerp(sc.y, 0, a), lerp(sc.z, 0, a));
      s.mesh.rotation.z = sc.rz * (1 - a);
      s.mesh.scale.setScalar(lerp(0.5, 1, a));
    });

    // 箭头：演变中途可见
    const mid = Math.max(0, 1 - Math.abs(e - 0.45) / 0.4);
    leadArrow.visible = mid > 0.05;
    leadArrow.children.forEach(m => { m.material.opacity = mid * 0.55; });

    // 标签淡出：实物标签在 e>0.7 淡出，字标签在 e<0.25 淡出
    labObj.el.style.opacity = 1 - smooth(Math.max(0, (e - 0.7) / 0.3));
    labChr.el.style.opacity = 1 - smooth(Math.max(0, (0.25 - e) / 0.25));

    ancObj.position.y = Y0 + 1.35;
  }

  function startShow() {
    state.phase = 'anim'; state.t = 0;
    state.tgtEvol = 1;
  }

  /* URL 带 ?auto=1 自动开演 */
  try {
    if (new URLSearchParams(location.search).get('auto')) setTimeout(startShow, 700);
  } catch (e) {}

  setChar('日');

  return {
    play() { startShow(); },
    act(key) {
      const info = RYS[key];
      if (info) setChar(info.ch);
    },
    speak() { ttsSay(RYS[Object.keys(RYS).find(k => RYS[k].ch === state.cur)].line); },
    __dbgState() { return state; },

    update(dt, p) {
      state.t += dt;

      // 滑块：idle 时直接控制演变程度
      if (state.phase !== 'anim') {
        state.tgtEvol = p.evol;
      }

      // 实物动画
      objParts.forEach(p => {
        if (p.spin !== undefined) p.m.rotation.z = p.spin + state.t * 0.35;
        if (p.flick) {
          const f = 1 + Math.sin(state.t * 9 + p.flick.position.x * 7) * 0.07 + Math.sin(state.t * 17) * 0.04;
          p.flick.scale.set(1, f, 1);
        }
        if (p.waves) {
          p.waves.t += dt * 2.2;
          const pos = p.waves.geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getZ(i);
            pos.setY(i, Math.sin(x * 3.1 + p.waves.t) * 0.062 + Math.sin(y * 4.3 - p.waves.t * 1.4) * 0.045);
          }
          pos.needsUpdate = true;
          p.waves.geo.computeVertexNormals();
        }
      });

      if (state.phase === 'anim') {
        // 演完停在文字态，读一句
        if (state.t > 1.2 && !state.spoken) {
          state.spoken = true;
          const info = RYS[Object.keys(RYS).find(k => RYS[k].ch === state.cur)];
          ttsSay(info.line);
        }
      }

      applyEvol(dt);
    },

    reset(p) {
      state.phase = 'idle'; state.t = 0; state.spoken = false;
      state.evol = 0.55; state.tgtEvol = 0.55;
    },

    readouts() {
      const info = RYS[Object.keys(RYS).find(k => RYS[k].ch === state.cur)];
      return [
        { label: info.pinyin, val: info.ch, unit: '' },
        { label: '笔画', val: String(GLYPHS[info.ch].s.length), unit: '画' },
        { label: '造字法', val: '象形', unit: '' },
        { label: '像什么', val: info.gloss, unit: '' },
      ];
    },
  };
}
