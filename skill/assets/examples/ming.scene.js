/* ============================================================
   语文 · 一年级 · 会意字：日＋月＝明
   ------------------------------------------------------------
   glyph 模式：汉字的每一笔都是一根真正的立体条（由笔画轮廓
   挤出而成），因此可以三件事——分组、拆开、按笔顺重演。
   这是 2D 字形做不到的：纸上的字只有结果，没有过程。

   数据来自 hanzi-writer-data（scripts/hanzi.py 导出），
   每字含 strokes（闭合轮廓 SVG 路径）+ medians（书写中线）。
   ============================================================ */

const GLYPHS = {
  "明": { s: ["M 191 698 Q 190 699 189 700 Q 161 721 144 713 Q 137 709 143 696 Q 144 687 149 678 Q 177 630 156 403 Q 132 315 168 267 L 170 265 Q 180 252 191 265 Q 198 277 205 323 L 206 358 Q 206 425 207 493 L 208 524 Q 209 641 212 651 Q 213 663 212 670 C 212 683 212 683 191 698 Z","M 322 335 Q 346 304 363 275 Q 370 259 381 260 Q 396 261 410 290 Q 426 324 423 366 Q 416 460 412 634 Q 411 662 426 681 Q 433 691 426 701 Q 410 719 363 740 Q 347 747 333 740 Q 291 719 191 698 C 162 692 182 665 212 670 Q 227 671 247 677 Q 343 696 351 691 Q 375 670 359 376 Q 358 373 358 369 Q 357 363 354 360 C 346 331 304 359 322 335 Z","M 207 493 Q 268 502 312 511 Q 334 515 326 528 Q 314 543 288 545 Q 248 548 208 524 C 182 509 177 489 207 493 Z","M 205 323 Q 211 323 219 324 Q 253 331 322 335 C 352 337 376 340 354 360 Q 347 367 334 375 Q 318 385 287 376 Q 244 366 206 358 C 177 352 175 322 205 323 Z","M 586 396 Q 586 400 587 403 Q 597 469 602 551 L 604 581 Q 610 711 613 724 C 616 753 616 753 608 757 Q 604 761 599 763 Q 550 788 535 785 Q 514 781 531 759 Q 568 690 545 442 Q 538 340 484 220 Q 444 127 324 16 Q 309 3 306 -4 Q 305 -11 316 -10 Q 362 -10 454 91 Q 553 203 581 369 L 586 396 Z","M 613 724 Q 617 727 625 728 Q 682 740 737 753 Q 759 757 764 746 Q 782 701 789 376 Q 790 115 778 95 Q 774 88 754 93 Q 720 103 684 114 Q 663 121 664 111 Q 731 54 769 13 Q 782 -8 799 -12 Q 809 -16 818 -6 Q 860 52 858 103 Q 842 311 834 648 Q 831 709 846 736 Q 858 757 845 768 Q 823 787 783 802 Q 764 809 747 801 Q 693 771 608 757 C 579 751 584 717 613 724 Z","M 602 551 Q 626 545 732 566 Q 748 570 751 572 Q 758 579 755 586 Q 748 596 723 602 Q 705 605 637 587 Q 619 586 604 581 C 575 572 572 556 602 551 Z","M 581 369 Q 608 360 733 381 Q 752 385 755 388 Q 762 395 759 402 Q 752 412 727 418 Q 702 424 676 414 Q 654 407 631 402 Q 609 398 586 396 C 556 393 552 376 581 369 Z"], m: [[[152,704],[170,688],[185,658],[188,538],[176,353],[181,270]],[[201,698],[220,688],[350,718],[376,704],[390,687],[391,368],[379,327],[381,276]],[[215,501],[225,514],[270,525],[316,522]],[[212,329],[229,345],[346,359]],[[536,772],[576,735],[581,666],[572,468],[547,318],[503,205],[460,133],[388,51],[335,7],[313,-3]],[[618,730],[624,743],[760,779],[792,764],[806,742],[820,210],[818,88],[806,60],[794,52],[767,59],[674,108]],[[606,558],[652,573],[744,581]],[[586,375],[599,382],[708,399],[748,397]]] },
  "男": { s: ["M 305 750 Q 284 760 263 764 Q 256 765 251 760 Q 244 753 254 742 Q 296 687 317 544 Q 326 474 367 455 Q 383 452 384 475 L 381 506 Q 347 651 340 710 C 337 736 332 738 305 750 Z","M 655 507 Q 655 501 657 494 Q 661 476 676 476 Q 692 477 701 494 Q 719 515 752 621 Q 774 679 817 711 Q 839 727 821 746 Q 802 767 747 799 Q 732 809 658 796 Q 541 787 436 767 Q 357 754 305 750 C 275 747 312 700 340 710 Q 362 722 475 736 L 513 741 Q 679 765 709 750 Q 721 741 712 703 Q 675 561 661 533 Q 660 533 660 532 C 653 515 653 515 655 507 Z","M 537 618 Q 580 625 619 631 Q 640 634 633 645 Q 623 658 601 663 Q 580 666 543 657 Q 540 657 539 655 C 534 653 518 650 489 643 Q 444 633 403 623 Q 388 620 406 607 Q 416 600 438 602 Q 463 606 490 610 L 537 618 Z","M 539 655 Q 540 665 541 676 Q 541 686 542 693 Q 549 709 540 719 Q 527 732 513 741 C 488 758 460 762 475 736 Q 479 729 483 722 Q 486 715 489 643 L 490 610 Q 490 576 492 523 C 493 493 532 501 533 531 Q 534 577 537 618 L 539 655 Z","M 384 475 Q 388 474 396 475 Q 478 494 655 507 C 685 509 686 516 660 532 Q 627 557 537 532 Q 534 532 533 531 L 492 523 Q 432 513 381 506 C 351 502 354 476 384 475 Z","M 501 330 Q 592 349 672 356 Q 708 359 714 347 Q 726 326 712 277 Q 681 136 641 78 Q 622 48 594 55 Q 563 68 535 84 Q 511 94 526 68 Q 575 16 596 -23 Q 618 -50 641 -29 Q 678 -7 706 39 Q 737 91 767 256 Q 777 314 800 342 Q 815 355 809 368 Q 799 381 742 411 Q 720 421 697 408 Q 658 389 514 364 L 446 352 Q 335 337 240 336 Q 218 336 214 325 Q 211 315 240 300 Q 268 279 294 287 Q 367 305 436 318 L 501 330 Z","M 436 318 Q 364 114 189 45 Q 171 38 155 28 Q 140 21 152 16 Q 167 13 204 21 Q 262 34 310 65 Q 356 92 408 153 Q 463 238 479 274 Q 479 283 501 330 L 514 364 Q 523 386 538 405 Q 551 421 536 434 Q 494 479 466 475 Q 451 474 455 457 Q 467 415 446 352 L 436 318 Z"], m: [[[260,752],[291,729],[311,698],[348,524],[369,470]],[[311,747],[346,734],[618,774],[711,778],[732,771],[765,730],[742,683],[676,495]],[[404,615],[431,615],[594,646],[624,641]],[[482,735],[507,717],[514,700],[513,554],[497,532]],[[390,483],[403,494],[572,521],[651,527]],[[224,323],[283,311],[694,381],[722,383],[736,375],[757,354],[750,308],[705,128],[670,52],[642,23],[622,14],[592,29],[527,78]],[[466,463],[482,448],[498,417],[452,282],[393,175],[332,108],[293,78],[232,46],[157,21]]] },
  "尖": { s: ["M 462 786 Q 483 752 484 583 Q 483 535 477 514 Q 476 504 493 463 Q 503 447 517 455 Q 532 468 528 547 Q 528 701 555 750 Q 561 760 550 773 Q 498 815 469 805 Q 456 801 462 786 Z","M 320 636 Q 289 591 251 554 Q 223 527 234 484 Q 238 463 264 472 Q 324 502 336 569 Q 348 603 345 631 Q 342 641 336 643 Q 326 643 320 636 Z","M 651 656 Q 709 610 778 541 Q 796 520 812 517 Q 822 516 829 527 Q 842 542 826 587 Q 808 647 651 689 Q 641 695 640 681 Q 640 666 651 656 Z","M 519 316 Q 597 331 797 350 Q 809 347 819 362 Q 820 375 796 388 Q 757 412 692 395 Q 578 370 528 360 L 454 346 Q 439 346 198 320 Q 165 317 190 297 Q 227 267 256 272 Q 346 288 451 304 L 519 316 Z","M 451 304 Q 433 163 333 92 Q 293 58 186 12 Q 158 -1 191 -3 Q 210 -4 252 8 Q 304 20 350 43 Q 392 62 425 102 Q 477 157 508 268 L 517 307 Q 518 311 519 316 L 528 360 Q 532 379 538 389 Q 545 396 539 409 Q 532 418 499 430 Q 462 449 444 442 Q 431 435 442 417 Q 452 392 454 346 L 451 304 Z","M 508 268 Q 532 231 602 137 Q 684 28 745 -34 Q 773 -65 800 -63 Q 876 -53 943 -45 Q 971 -42 971 -35 Q 972 -28 940 -13 Q 780 50 732 86 Q 624 176 517 307 C 498 330 491 293 508 268 Z"], m: [[[472,793],[491,782],[513,751],[503,508],[509,466]],[[334,632],[306,568],[250,485]],[[652,676],[715,640],[780,592],[799,568],[813,535]],[[191,309],[249,298],[440,323],[707,370],[770,373],[807,364]],[[452,429],[492,389],[477,267],[437,165],[389,103],[333,61],[283,36],[196,7]],[[521,299],[525,272],[615,159],[688,79],[761,15],[801,-11],[965,-35]]] },
  "尘": { s: ["M 462 780 Q 484 746 484 690 Q 491 521 479 475 Q 478 459 484 442 Q 491 432 496 419 Q 506 403 522 412 Q 537 425 534 513 Q 534 687 563 742 Q 570 752 557 766 Q 497 811 470 800 Q 455 796 462 780 Z","M 303 619 Q 269 564 225 518 Q 215 508 210 489 Q 203 462 210 444 Q 214 423 241 433 Q 301 463 321 550 Q 333 586 330 614 Q 326 624 319 627 Q 309 627 303 619 Z","M 656 610 Q 711 561 779 491 Q 798 469 815 464 Q 825 463 833 475 Q 846 491 831 539 Q 815 603 656 645 Q 646 651 644 637 Q 643 621 656 610 Z","M 536 220 Q 729 247 736 252 Q 746 259 742 270 Q 735 285 703 295 Q 670 305 635 295 Q 587 283 540 273 L 476 262 Q 400 253 315 252 Q 273 249 301 227 Q 352 196 410 206 Q 443 210 477 213 L 536 220 Z","M 523 74 Q 529 150 536 220 L 540 273 Q 540 291 556 348 Q 560 360 539 375 Q 502 394 477 399 Q 461 403 452 394 Q 445 387 453 371 Q 471 346 476 262 L 477 213 Q 478 146 478 70 C 478 40 521 44 523 74 Z","M 478 70 Q 336 60 172 48 Q 147 47 164 27 Q 200 -9 242 0 Q 473 48 860 26 Q 882 25 889 34 Q 896 47 878 64 Q 818 112 777 105 Q 683 90 523 74 L 478 70 Z"], m: [[[472,788],[501,768],[519,740],[506,470],[512,423]],[[316,617],[291,548],[225,445]],[[656,632],[735,583],[783,545],[800,521],[816,481]],[[305,241],[330,232],[384,229],[547,246],[659,269],[704,270],[730,264]],[[464,385],[503,350],[510,327],[501,96],[485,78]],[[168,38],[223,25],[429,47],[786,68],[822,62],[877,42]]] },
};

/* ---------- 四个会意字：分组方式与讲解 ---------- */
const CHARS = {
  ming: {
    ch: '明', a: '日', b: '月', split: 4, layout: 'lr', pinyin: 'míng',
    gloss: '日月同辉，就是亮',
    line: '日和月合在一起，就是明。太阳亮，月亮也亮，所以明就是亮。',
    ask: '「明」是左右并排。那「尖」是怎么拼的？',
  },
  nan: {
    ch: '男', a: '田', b: '力', split: 5, layout: 'lr', pinyin: 'nán',
    gloss: '田里出力的人',
    line: '田里出力干活的人，就是男。',
    ask: '为什么古人用「田」和「力」来表示男人？',
  },
  jian: {
    ch: '尖', a: '小', b: '大', split: 3, layout: 'tb', pinyin: 'jiān',
    gloss: '上小下大，尖',
    line: '上面小，下面大，这样的东西就是尖。',
    ask: '铅笔尖、塔尖、山尖，它们是不是都上小下大？',
  },
  chen: {
    ch: '尘', a: '小', b: '土', split: 3, layout: 'tb', pinyin: 'chén',
    gloss: '小小的土',
    line: '小小的土，就是尘。',
    ask: '灰尘、尘土、一尘不染——「尘」都和什么有关？',
  },
};

export const meta = {
  tag: '语文 · 一年级 · 会意字',
  title: '日＋月＝明：字是拼出来的',
  lead: '「明」不是画出来的，是「日」和「月」两字拼出来的。把两个字拉开、合上，再把它拆成八根笔画，你会看见一个字是怎么站起来的。',

  concept: `
    <p>「日」是太阳，「月」是月亮。把这两个字并排放在一起，就成了 <b>「明」——亮</b>。</p>
    <p>这样的字叫 <b>会意字</b>：<em>两个字的意思合起来，就是新字的意思</em>。不用背，想一想就懂了。</p>
    <p>拖动下面的滑块可以把它拆开：八根笔画各自悬空，转一圈看看它们是怎么叠在一起的。</p>`,

  formula: {
    label: '字理',
    expr: '日 <span class="op">＋</span> 月 <span class="op">＝</span> 明',
    note: '左右并排是「明」，上下叠放就是「尖」「尘」。同样两个字，摆法不同，字就不同。',
  },

  points: [
    '「日」和「月」各自都是完整的字，合起来才变成「明」',
    '「明」共 8 画：前 4 画是「日」，后 4 画是「月」',
    '合体字有两种拼法——左右并排（明、男）和上下叠放（尖、尘）',
  ],

  question: '「休」是一个人靠着一棵树。你猜它为什么是休息的意思？还有哪个字是两个人拼起来的？',

  controls: [
    { key: 'split', label: '拆开 ↔ 合拢', min: 0, max: 1, step: 0.01, value: 0, unit: '' },
  ],

  controlsLabel: '动手拆一拆',
  playLabel: '演一遍',
  readoutLabel: '这个字',
  tts: true,
  ttsLabel: '读一遍',

  actions: [
    { key: 'ming', label: '日＋月＝明', on: true },
    { key: 'nan', label: '田＋力＝男' },
    { key: 'jian', label: '小＋大＝尖' },
    { key: 'chen', label: '小＋土＝尘' },
  ],

  cam: { pos: [0, 3.5, 9.2], target: [0, 1.75, 0] },
};

export function create({ scene, camera, controls, addLabel }) {
  const SIZE = 2.3;          // 字号（世界单位）
  const Y0 = 2.35;           // 悬空高度：字心 y
  const THK = 0.105;         // 笔画厚度
  const INK_A = '#16140f';
  const INK_B = '#3a342a';
  const RED = '#c2401e';

  /* ================= 一、SVG 路径解析 ================= */
  const NUM = /(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/;
  const TOK = /([MmLlHhVvCcQqSsZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;

  function tokenize(d) {
    const out = [];
    let m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(d)) !== null) out.push(m[1] !== undefined ? m[1] : parseFloat(m[2]));
    return out;
  }

  /** 把一笔的 SVG 轮廓转成 THREE.Shape 数组（k 缩放，cx/cy 为字形中心） */
  function pathToShapes(d, k, cx, cy) {
    const t = tokenize(d);
    const sp = new THREE.ShapePath();
    const X = v => (v - cx) * k;
    const Y = v => (v - cy) * k;
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;

    while (i < t.length) {
      if (typeof t[i] === 'string') cmd = t[i++];
      if (i >= t.length) break;
      const C = cmd.toUpperCase();
      const rel = cmd !== C;

      if (C === 'Z') {
        x = sx; y = sy;
        if (typeof t[i] !== 'string') i++;
        continue;
      }
      const n = () => t[i++];

      if (C === 'M' || C === 'L') {
        let nx = n(), ny = n();
        if (rel) { nx += x; ny += y; }
        x = nx; y = ny;
        if (C === 'M') { sp.moveTo(X(x), Y(y)); sx = x; sy = y; cmd = rel ? 'l' : 'L'; }
        else sp.lineTo(X(x), Y(y));
      } else if (C === 'H') {
        let nx = n(); if (rel) nx += x; x = nx;
        sp.lineTo(X(x), Y(y));
      } else if (C === 'V') {
        let ny = n(); if (rel) ny += y; y = ny;
        sp.lineTo(X(x), Y(y));
      } else if (C === 'Q') {
        let x1 = n(), y1 = n(), nx = n(), ny = n();
        if (rel) { x1 += x; y1 += y; nx += x; ny += y; }
        sp.quadraticCurveTo(X(x1), Y(y1), X(nx), Y(ny));
        x = nx; y = ny;
      } else if (C === 'C') {
        let x1 = n(), y1 = n(), x2 = n(), y2 = n(), nx = n(), ny = n();
        if (rel) { x1 += x; y1 += y; x2 += x; y2 += y; nx += x; ny += y; }
        sp.bezierCurveTo(X(x1), Y(y1), X(x2), Y(y2), X(nx), Y(ny));
        x = nx; y = ny;
      } else {
        i++;
      }
    }
    return sp.toShapes(true);
  }

  /* ================= 二、纸面（课本这一页） ================= */
  const pageGeo = new THREE.PlaneGeometry(7, 4.6);
  pageGeo.rotateX(-Math.PI / 2);
  const pageTex0 = pageTexture('明');
  const pageMat = new THREE.MeshPhysicalMaterial({
    map: pageTex0,
    color: '#a39277',        // 灯组照度下实测的光补偿位：纸面显米黄且纹理可读
    roughness: 0.94, metalness: 0, clearcoat: 0.0, envMapIntensity: 0.22,
  });
  const page = new THREE.Mesh(pageGeo, pageMat);
  page.position.y = 0.02;
  page.receiveShadow = true;
  scene.add(page);

  const board = box(7, 0.08, 4.6, M('#e2d5b8', { rough: 0.85, env: 0.3 }));
  board.position.y = -0.04;
  board.receiveShadow = true;
  scene.add(board);

  function pageTexture(ch) {
    const W = 1024, H = 672;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    g.fillStyle = '#f6efdd';
    g.fillRect(0, 0, W, H);

    // 纸纤维
    for (let i = 0; i < 1100; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const w = 6 + Math.random() * 40;
      g.strokeStyle = `rgba(${168 + Math.random() * 40},${158 + Math.random() * 35},${132 + Math.random() * 35},${0.04 + Math.random() * 0.06})`;
      g.lineWidth = 0.6 + Math.random();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + (Math.random() - 0.5) * 2); g.stroke();
    }

    // 田字格（淡朱红）
    const S = 470, cx0 = W / 2, cy0 = H / 2 - 6, L = cx0 - S / 2, T = cy0 - S / 2;
    g.strokeStyle = 'rgba(180,52,24,.62)';
    g.lineWidth = 5;
    g.strokeRect(L, T, S, S);
    g.setLineDash([15, 12]);
    g.lineWidth = 3.2;
    g.beginPath();
    g.moveTo(cx0, T); g.lineTo(cx0, T + S);
    g.moveTo(L, cy0); g.lineTo(L + S, cy0);
    g.stroke();
    g.setLineDash([]);

    // 描红：极淡的当前字
    if (ch) {
      g.save();
      g.fillStyle = 'rgba(80,70,55,.13)';
      g.font = `500 ${Math.round(S * 0.86)}px "KaiTi","STKaiti","Songti SC",Georgia,serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ch, cx0, cy0 + S * 0.03);
      g.restore();
    }

    // 角上的小字
    g.fillStyle = 'rgba(92,82,64,.55)';
    g.font = '500 30px "Songti SC", Georgia, serif';
    g.textAlign = 'left';
    g.fillText('识字 · 会意字', 60, H - 50);

    // 朱红印章
    const sx = W - 172, sy = H - 172, ss = 100;
    g.save();
    g.translate(sx, sy);
    g.rotate(-0.04);
    g.strokeStyle = 'rgba(194,64,30,.78)';
    g.lineWidth = 6;
    g.strokeRect(0, 0, ss, ss);
    g.fillStyle = 'rgba(194,64,30,.78)';
    g.font = '600 42px "Songti SC", Georgia, serif';
    g.textAlign = 'center';
    g.fillText('识', ss / 2, 46);
    g.fillText('字', ss / 2, 90);
    g.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  let pageTex = pageTex0;
  function setPageChar(ch) {
    const old = pageTex;
    pageTex = pageTexture(ch);
    pageMat.map = pageTex;
    pageMat.needsUpdate = true;
    if (old) old.dispose();
  }


  /* ================= 三、字组 ================= */
  const grp = new THREE.Group();
  scene.add(grp);

  /* 标签锚点必须留在场景里（切字时不销毁） */
  const anchors = [0, 1, 2].map(() => { const o = new THREE.Object3D(); scene.add(o); return o; });
  const labA = addLabel('日', anchors[0], { sub: '太阳' });
  const labB = addLabel('月', anchors[1], { sub: '月亮' });
  const labC = addLabel('明', anchors[2], { sub: '光亮' });
  labC.el.style.cssText += `;background:${RED};color:#fff;border-color:${RED}`;

  /* 从字垂到纸面的指引箭头 */
  const leadArrow = arrow(
    new THREE.Vector3(1.55, Y0 - 0.4, 0),
    new THREE.Vector3(1.55, 0.08, 0), RED,
    { head: 0.13, shaft: 0.017 });
  leadArrow.children.forEach(m => { m.material = M(RED, { rough: 0.5, opacity: 0.5, emissive: RED, ei: 0.2 }); });
  scene.add(leadArrow);

  /* 合成闪光 */
  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: '#fff3d2', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, map: glowSprite(),
    }));
  flash.position.set(0, Y0, 0.3);
  scene.add(flash);

  /* ================= 四、构建当前字 ================= */
  let curKey = 'ming';
  let groups = [];      // [{ g, center, kIndep, mesh:[...] }]
  let meshes = [];      // 全部笔画
  let info = CHARS.ming;

  function disposeGroup() {
    grp.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    grp.clear();
    groups = []; meshes = [];
  }

  function build(key) {
    disposeGroup();
    curKey = key;
    const c = CHARS[key];
    info = c;
    const data = GLYPHS[c.ch];

    /* --- 全局 bbox（先按 k=1 解析一遍） --- */
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    data.s.forEach(d => {
      pathToShapes(d, 1, 0, 0).forEach(sh => {
        sh.getPoints(10).forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });
      });
    });
    const gw = Math.max(maxX - minX, 1e-3);
    const gh = Math.max(maxY - minY, 1e-3);
    const k = SIZE / Math.max(gw, gh);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    /* --- 逐笔生成 --- */
    const geoms = data.s.map((d, i) => {
      const shapes = pathToShapes(d, k, cx, cy);
      let geo;
      if (!shapes.length) {
        geo = new THREE.BoxGeometry(0.05, 0.05, THK);
      } else {
        geo = new THREE.ExtrudeGeometry(shapes, {
          depth: THK, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005,
          bevelSegments: 1, curveSegments: 5, steps: 1,
        });
        geo.translate(0, 0, -THK / 2);
        geo.computeVertexNormals();
      }
      geo.userData = { idx: i };
      return geo;
    });

    /* --- 按 split 分成两组，算各组质心 --- */
    const st = geoms.map(g => {
      g.computeBoundingBox();
      const b = g.boundingBox;
      return {
        c: new THREE.Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, 0),
        w: b.max.x - b.min.x, h: b.max.y - b.min.y,
      };
    });

    groups = [0, 1].map(gi => {
      const list = [];
      geoms.forEach((g, i) => { if ((i < c.split) === (gi === 0)) list.push(i); });
      const minP = new THREE.Vector2(1e9, 1e9), maxP = new THREE.Vector2(-1e9, -1e9);
      list.forEach(i => {
        minP.x = Math.min(minP.x, st[i].c.x - st[i].w / 2);
        minP.y = Math.min(minP.y, st[i].c.y - st[i].h / 2);
        maxP.x = Math.max(maxP.x, st[i].c.x + st[i].w / 2);
        maxP.y = Math.max(maxP.y, st[i].c.y + st[i].h / 2);
      });
      const ctr = new THREE.Vector3((minP.x + maxP.x) / 2, (minP.y + maxP.y) / 2, 0);
      const size = Math.max(maxP.x - minP.x, maxP.y - minP.y, 1e-3);
      return {
        list, ctr,
        kIndep: (SIZE * 0.9) / size,
        apart: new THREE.Vector3(
          c.layout === 'lr' ? (gi === 0 ? -SIZE * 1.02 : SIZE * 1.02) : 0,
          c.layout === 'lr' ? 0 : (gi === 0 ? SIZE * 0.6 : -SIZE * 0.6),
          0),
        g: new THREE.Group(),
      };
    });

    /* --- 建 mesh --- */
    groups.forEach((G, gi) => {
      G.g.position.copy(G.ctr);
      grp.add(G.g);
      G.list.forEach((i, j) => {
        const mat = M(i % 2 ? INK_B : INK_A, { rough: 0.46, coat: 0.24, env: 0.85 });
        const mesh = new THREE.Mesh(geoms[i], mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // 组内坐标以该组质心为原点
        mesh.position.set(-G.ctr.x, -G.ctr.y, 0);
        mesh.userData = {
          base: mesh.position.clone(),
          dir: new THREE.Vector3(st[i].c.x - G.ctr.x, st[i].c.y - G.ctr.y, 0).normalize(),
          rot: ((i * 37) % 11 - 5) * 0.035,
          order: gi * 10 + j,
          mat,
        };
        if (mesh.userData.dir.length() < 0.1) mesh.userData.dir.set(Math.cos(i), Math.sin(i), 0);
        G.g.add(mesh);
        meshes.push(mesh);
      });
    });

    // 笔顺序号：按全局 order（第 1 组先，第 2 组后）——即真实笔顺
    meshes.sort((a, b) => a.userData.order - b.userData.order);
    meshes.forEach((m, i) => { m.userData.step = i; });

    state.sep = 1; state.burst = 0;
    state.tgtSep = 1; state.tgtBurst = 0;
    state.phase = 'idle'; state.t = 0; state.written = 0;
    autoFrame(camera, controls, scene, { pad: 1.16, force: true });
    meshes.forEach(m => { m.visible = true; m.scale.setScalar(1); m.material.color.set(m.userData.step % 2 ? INK_B : INK_A); });

    // 标签文字
    labA.el.innerHTML = `${c.a}<span class="sub">${c.layout === 'lr' ? '左边' : '上面'}</span>`;
    labB.el.innerHTML = `${c.b}<span class="sub">${c.layout === 'lr' ? '右边' : '下面'}</span>`;
    labC.el.innerHTML = `${c.ch}<span class="sub">${c.gloss}</span>`;
    setPageChar(c.ch);
  }

  /* ================= 五、状态机 ================= */
  const state = {
    phase: 'idle', t: 0, written: 0,
    sep: 1, burst: 0, tgtSep: 1, tgtBurst: 0,
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  function applyLayout(dt) {
    const k = Math.min(1, dt * 6);
    state.sep = lerp(state.sep, state.tgtSep, k);
    state.burst = lerp(state.burst, state.tgtBurst, k);
    const { sep, burst } = state;

    const lift = (info.layout === 'tb' ? SIZE * 0.55 : 0) * sep;
    groups.forEach((G) => {
      const px = lerp(G.ctr.x, G.apart.x, sep);
      const py = lerp(G.ctr.y, G.apart.y, sep);
      G.g.position.set(px, Y0 + lift + py, 0);
      G.g.scale.setScalar(lerp(1, G.kIndep, sep));
    });

    meshes.forEach(m => {
      const u = m.userData;
      const b = burst * (u.step % 3 === 0 ? 1 : 0.86);
      m.position.set(
        u.base.x + u.dir.x * b * 0.95,
        u.base.y + u.dir.y * b * 0.95,
        u.base.z + b * (0.12 + (u.step % 4) * 0.07));
      m.rotation.z = u.rot * burst * 2.2;
    });

    // 锚点跟随
    const ac = groups[0];
    const bc = groups[1];
    anchors[0].position.copy(ac.g.position).add(new THREE.Vector3(0, SIZE * 0.5 * lerp(1, ac.kIndep, sep), 0));
    anchors[1].position.copy(bc.g.position).add(new THREE.Vector3(0, SIZE * 0.5 * lerp(1, bc.kIndep, sep), 0));
    anchors[2].position.set(0, Y0 + SIZE * 0.52, 0);

    // 标签显隐：分开时看两个独体字，合体后看合成字
    const showParts = Math.min(1, Math.max(0, (sep - 0.35) / 0.4));
    labA.el.style.opacity = showParts;
    labB.el.style.opacity = showParts;
    labC.el.style.opacity = 1 - showParts * 0.92;

    // 箭头：只在合体时出现
    leadArrow.visible = sep < 0.55;
    leadArrow.children.forEach(m => { m.material.opacity = (1 - sep / 0.55) * 0.55; });

    flash.position.set(0, Y0, 0.32);
  }

  /* 逐笔点亮 */
  function updateWrite() {
    const PER = 0.30;
    const n = meshes.length;
    const done = Math.floor(state.t / PER);
    if (done !== state.written) {
      state.written = Math.min(done, n);
      for (let i = 0; i < state.written; i++) {
        const m = meshes[i];
        m.visible = true;
        m.userData.hit = 0.001;
      }
    }
    meshes.forEach((m, i) => {
      const u = m.userData;
      if (i >= state.written) { m.visible = false; return; }
      m.visible = true;
      // 刚落下时朱红一瞬
      const age = state.t - i * PER;
      const hot = Math.max(0, 1 - age / 0.55);
      const target = new THREE.Color(hot > 0.02 ? RED : (u.step % 2 ? INK_B : INK_A));
      u.mat.color.lerp(target, Math.min(1, 0.25 + hot * 0.6));
      const pop = hot > 0.02 ? 1 + 0.13 * hot : 1;
      m.scale.setScalar(pop);
    });
  }

  function speak() {
    const c = CHARS[curKey];
    ttsSay(c.line);
  }

  /* ================= 六、TTS（优先晓晓） ================= */
  let voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices() || [];
    const zh = vs.filter(v => /^zh/i.test(v.lang));
    voice = zh.find(v => /xiaoxiao/i.test(v.name))
      || zh.find(v => /natural|online/i.test(v.name))
      || zh.find(v => /female|yaoyao|huihui/i.test(v.name))
      || zh[0] || null;
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
      u.lang = 'zh-CN';
      u.rate = 0.88;
      u.pitch = 1.06;
      clearTimeout(ttsTimer);
      ttsTimer = setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 90);
    } catch (e) {}
  }

  /* ================= 七、初始化 ================= */
  build('ming');

  function startShow() {
    state.phase = 'join';
    state.t = 0;
    state.written = 0;
    state.tgtSep = 0;
    state.tgtBurst = 0;
    meshes.forEach(m => { m.visible = true; m.scale.setScalar(1); });
  }

  /* URL 带 ?auto=1 时自动开演（供无头截图自检） */
  try {
    if (new URLSearchParams(location.search).get('auto')) setTimeout(startShow, 700);
  } catch (e) {}

  return {
    play() { startShow(); },

    act(key) {
      if (CHARS[key]) build(key);
    },

    speak() { speak(); },

    __dbgState() { return state; },

    update(dt, p) {
      state.t += dt;
      const t = state.t;

      if (state.phase === 'idle') {
        // 滑块直接控制拆解程度；拆笔画时自动先合拢
        state.tgtBurst = p.split;
        if (p.split > 0.05) state.tgtSep = 0;
        meshes.forEach(m => {
          m.visible = true;
          m.scale.setScalar(1);
          m.material.color.lerp(new THREE.Color(m.userData.step % 2 ? INK_B : INK_A), 0.08);
        });
      }

      else if (state.phase === 'join') {
        if (t > 1.25) {
          state.phase = 'hold'; state.t = 0;
          speak();
        }
      }

      else if (state.phase === 'hold') {
        // 闪光
        const f = Math.min(1, t / 0.55);
        flash.material.opacity = t < 0.55 ? 0.85 * (1 - f) : 0;
        flash.scale.setScalar(t < 0.55 ? 0.7 + f * 2.4 : 0.5);
        if (t > 1.15) { state.phase = 'burst'; state.t = 0; state.tgtBurst = 1; }
      }

      else if (state.phase === 'burst') {
        flash.material.opacity = 0;
        if (t > 1.05) { state.phase = 'write'; state.t = 0; state.tgtBurst = 0; state.written = 0; }
      }

      else if (state.phase === 'write') {
        state.tgtBurst = Math.max(0, 1 - smooth(Math.min(1, t / 2.1)));
        updateWrite();
        if (t > 2.1 + meshes.length * 0.30) {
          state.phase = 'done'; state.t = 0;
          meshes.forEach(m => { m.visible = true; m.scale.setScalar(1); });
        }
      }

      else if (state.phase === 'done') {
        meshes.forEach(m => {
          m.visible = true;
          m.scale.setScalar(1);
          m.material.color.lerp(new THREE.Color(m.userData.step % 2 ? INK_B : INK_A), 0.06);
        });
      }

      applyLayout(dt);
    },

    reset(p) {
      state.phase = 'idle'; state.t = 0; state.written = 0;
      state.tgtSep = 1; state.tgtBurst = 0;
      state.sep = 1; state.burst = 0;
      meshes.forEach(m => { m.visible = true; m.scale.setScalar(1); });
      flash.material.opacity = 0;
    },

    readouts(p) {
      const c = CHARS[curKey];
      return [
        { label: c.pinyin, val: c.ch, unit: '' },
        { label: '笔画', val: String(GLYPHS[c.ch].s.length), unit: '画' },
        { label: '结构', val: c.layout === 'lr' ? '左右' : '上下', unit: '' },
        { label: '组成', val: `${c.a}＋${c.b}`, unit: '' },
      ];
    },
  };
}
