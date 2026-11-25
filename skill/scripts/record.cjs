#!/usr/bin/env node
/**
 * 把 3D 课件录成讲解视频（逐帧截图 + ffmpeg 编码，确定性输出）。
 *
 * 用法：
 *   node record.cjs <课件.html> -o 输出.mp4 --seconds 20 [--fps 30] [--size 1280x720]
 *   支持 --script 字幕脚本（JSON）：[{"t": 秒, "text": "字幕", "hold": 停留秒}]
 *
 * 课件需支持 ?record=1（模板已内置 window.__rec 逐帧步进接口）。
 */
const { chromium } = require('C:/Users/zhouqian/.workbuddy/binaries/node/workspace/node_modules/playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { fps: 30, seconds: 20, size: '1280x720', scene: null, out: null, script: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '-o' || a[i] === '--out') o.out = a[++i];
    else if (a[i] === '--seconds') o.seconds = parseFloat(a[++i]);
    else if (a[i] === '--fps') o.fps = parseInt(a[++i], 10);
    else if (a[i] === '--size') o.size = a[++i];
    else if (a[i] === '--script') o.script = a[++i];
    else if (!o.scene) o.scene = a[i];
  }
  if (!o.scene) { console.error('× 缺少课件路径'); process.exit(1); }
  if (!o.out) o.out = o.scene.replace(/\.html?$/i, '') + '.mp4';
  let subs = [];
  if (o.script && fs.existsSync(o.script)) {
    subs = JSON.parse(fs.readFileSync(o.script, 'utf8'));
  } else if (o.script) {
    console.error('× 找不到字幕脚本：' + o.script); process.exit(1);
  }
  return { ...o, subs };
}

(async () => {
  const opt = parseArgs();
  const [W, H] = opt.size.split('x').map(Number);
  const scenePath = path.resolve(opt.scene);
  if (!fs.existsSync(scenePath)) { console.error('× 找不到课件：' + scenePath); process.exit(1); }

  const frameDir = path.join(path.dirname(opt.out), '.frames_' + path.basename(opt.out, '.mp4'));
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });

  const total = Math.round(opt.fps * opt.seconds);
  const dt = 1 / opt.fps;
  console.log(`▶ 录制 ${path.basename(scenePath)}`);
  console.log(`  ${opt.fps}fps × ${opt.seconds}s = ${total} 帧 @ ${W}x${H}`);

  const browser = await chromium.launch({
    channel: 'msedge', headless: true,
    args: ['--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('C:' + m.text().slice(0, 120)); });

  const url = 'file:///' + scenePath.replace(/\\/g, '/').replace(/^\/+/, '')
    + '?record=1&auto=1&t=' + Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  /* 等录制接口就绪 */
  await page.waitForFunction(() => window.__rec && window.__rec.ready, { timeout: 30000 });
  await page.waitForTimeout(600);   // 等字体/纹理/教材底图就绪

  /* 启动演播 */
  await page.evaluate(() => { try { window.__rec.play(); } catch (e) {} });

  const t0 = Date.now();
  let subIdx = -1;
  for (let i = 0; i < total; i++) {
    const tNow = i * dt;
    /* 字幕：按时间点切换 */
    if (opt.subs.length) {
      let want = -1;
      for (let k = 0; k < opt.subs.length; k++) if (tNow >= opt.subs[k].t) want = k;
      if (want !== subIdx && want >= 0) {
        subIdx = want;
        const s = opt.subs[want];
        await page.evaluate(([txt, hold]) => window.__rec.subtitle(txt, hold),
          [s.text, s.hold || (opt.subs[want + 1] ? opt.subs[want + 1].t - s.t : 4)]);
      }
    }
    await page.evaluate(d => window.__rec.step(d), dt);
    /* 等一帧渲染落地（SwiftShader 软渲染较慢，需让出） */
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))));
    const file = path.join(frameDir, String(i).padStart(5, '0') + '.png');
    await page.screenshot({ path: file, type: 'png' });
    if (i % 30 === 0 || i === total - 1) {
      const pct = ((i + 1) / total * 100).toFixed(0);
      const el = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ${pct}%  ${i + 1}/${total} 帧  已用 ${el}s`);
    }
  }

  await browser.close();

  if (errs.length) console.log('⚠ 页面警告：\n  ' + errs.slice(0, 5).join('\n  '));

  /* ffmpeg 编码 */
  console.log('▶ 编码 MP4…');
  const outAbs = path.resolve(opt.out);
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(opt.fps),
    '-i', path.join(frameDir, '%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-preset', 'medium',
    '-movflags', '+faststart',
    outAbs,
  ], { stdio: 'inherit' });

  const mb = (fs.statSync(outAbs).size / 1024 / 1024).toFixed(2);
  console.log(`✓ ${outAbs}  ${mb} MB`);

  fs.rmSync(frameDir, { recursive: true, force: true });
})();
