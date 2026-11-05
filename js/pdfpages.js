import * as pdfjsLib from './pdf.min.mjs';

/* ============================================================
   pdf.js 封装：加载教材、渲染对开页到 canvas
   ============================================================ */

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).href;

export async function loadBook(url) {
  return pdfjsLib.getDocument({ url, disableAutoFetch: false }).promise;
}

/* 把 rightPage-1 / rightPage 两页渲染到 canvas（宽:高 = 1.43:1） */
export async function renderSpread(doc, rightPage, canvas) {
  const W = 2048, H = Math.round(2048 / 1.43);
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  const g = canvas.getContext('2d');
  g.fillStyle = '#efe7d2';
  g.fillRect(0, 0, W, H);
  const half = W / 2;

  for (const [side, pageNo] of [['L', rightPage - 1], ['R', rightPage]]) {
    if (pageNo < 1 || pageNo > doc.numPages) continue;
    const page = await doc.getPage(pageNo);
    const vp1 = page.getViewport({ scale: 1 });
    const s = Math.min(half / vp1.width, H / vp1.height);
    const vp = page.getViewport({ scale: s });
    const off = document.createElement('canvas');
    off.width = Math.round(vp.width); off.height = Math.round(vp.height);
    await page.render({ canvasContext: off.getContext('2d'), viewport: vp }).promise;
    const dx = side === 'L' ? half - off.width : half;
    const dy = Math.round((H - off.height) / 2);
    g.drawImage(off, dx, dy);
  }

  // 中缝凹陷阴影
  const grad = g.createLinearGradient(half - 90, 0, half + 90, 0);
  grad.addColorStop(0, 'rgba(60,45,25,0)');
  grad.addColorStop(0.5, 'rgba(60,45,25,.30)');
  grad.addColorStop(1, 'rgba(60,45,25,0)');
  g.fillStyle = grad;
  g.fillRect(half - 90, 0, 180, H);

  // 书口两侧微暗
  for (const [x0, x1] of [[0, 46], [W, W - 46]]) {
    const e = g.createLinearGradient(x0, 0, x1, 0);
    e.addColorStop(0, 'rgba(60,45,25,.18)'); e.addColorStop(1, 'rgba(60,45,25,0)');
    g.fillStyle = e; g.fillRect(Math.min(x0, x1), 0, 46, H);
  }
  return canvas;
}

/* 渲染封面页（透明底，供封面材质叠加布纹） */
export async function renderCover(doc, pageNo, canvas) {
  const page = await doc.getPage(pageNo);
  const vp1 = page.getViewport({ scale: 1 });
  const s = Math.min(canvas.width / vp1.width, canvas.height / vp1.height);
  const vp = page.getViewport({ scale: s });
  const off = document.createElement('canvas');
  off.width = Math.round(vp.width); off.height = Math.round(vp.height);
  await page.render({ canvasContext: off.getContext('2d'), viewport: vp }).promise;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.drawImage(off, (canvas.width - off.width) / 2, (canvas.height - off.height) / 2);
  return canvas;
}
