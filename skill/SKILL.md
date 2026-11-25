---
name: textbook-3d-lab
description: 生成中小学 3D 互动课件，输出单个 HTML 文件、双击即可离线运行。覆盖两类：① 理科（物理/化学/生物/地理）实验与公式推演；② 语文（glyph 模式）——汉字笔画立体拆解、笔顺重演、会意字合成，含 TTS 朗读。当用户要求"做一个 3D 实验/实验动画/公式推演/概念可视化课件"，或给出教材位置（如"人教版八下 P71 动能"、"一年级识字 日月明"）要求生成 3D 演示时使用。以知识点为索引、不复制教材内容，因此不受教材版本和版权限制。
agent_created: true
---

# 教材 3D 课件生成器

把一个知识点变成一个可交互的 3D 课件：单文件 HTML，含 3D 场景（可调参数）、推理链、实时信息卡、原创讲解。不依赖服务器与教材 PDF，双击即可运行。

支持两种模式：

- **理科模式（装置）**：默认。装置 + 滑块参数 + 读数 + 公式推演，范本 `assets/examples/kinetic.scene.js`。
- **语文模式（glyph）**：汉字的每一笔由笔画轮廓数据挤出成真立体条，可分组拆合、按笔顺重演、部件合成，范本 `assets/examples/ming.scene.js`（会意字：日＋月＝明）。字形数据用 `scripts/hanzi.py` 导出（hanzi-writer-data，9355 常用字，单字 1–4KB，直接内联进 scene.js）。

## 核心原则

1. **以知识点为锚，不以页码为锚**。用户说页码时，先通过 `references/knowledge-map.md` 把「版本+页码」翻译成知识点，再生成。任何版本的教材（人教/苏科/沪科/北师大…）都映射到同一套知识点。
2. **不复制教材**。讲解文字全部原创；插图一帧不用；页码只用于定位，不进入成品。
3. **3D 必须做 2D 做不到的事**：空间结构、时间过程、变量可控、推理链。做不到就别做成 3D（比如单位换算表）。
4. **每个场景必须有推理链**：不只展示公式，要展示公式"怎么长出来"（①→②→③ 标签逐步点亮）。

## 工作流

### 1. 定位知识点

- 用户给了知识点名（"动能"、"欧姆定律"）→ 直接进入第 2 步。
- 用户给了教材位置（"人教版八下第 71 页"、"八年级上 3.3 节"）→ 查 `references/knowledge-map.md` 的版本对照表，映射到知识点。
- 映射不到 → 向用户确认知识点名称，不要猜。

### 2. 写场景文件 scene.js

- 理科场景参照黄金样例 `assets/examples/kinetic.scene.js`（结构、命名、质量标准都以它为准）。
- 语文（glyph）场景参照 `assets/examples/ming.scene.js`：内联 GLYPHS 数据（hanzi.py 导出），用其 pathToShapes 把每笔 SVG 轮廓转 ExtrudeGeometry；部件分组按"整字坐标 → 组质心归零 → apart 位移插值"实现拆合；逐笔书写用 medians 之外的序号驱动（每笔 0.3s，当前笔朱红一瞬后回到墨色）。

语文场景的四种样例（一年级上册，可直接复制改）：

| 样例 | 文件 | 核心机制 | 对应课文 |
|---|---|---|---|
| 会意字 | `ming.scene.js` | 两字靠拢合成、整字拆笔画、按笔顺重演 | 识字《日月明》 |
| 象形字 | `rysh.scene.js` | 左侧 3D 实物（太阳/月牙/水波/火焰）+ 右侧笔画字，滑块演"图画→文字"，`update` 必须接收 `(dt, p)` 否则滑块失效 | 识字《日月水火》 |
| 过程剧场 | `wuya.scene.js` | 投石子水位真实上升（体积置换），读数列水位/离瓶口 | 课文《乌鸦喝水》 |
| 脚印剧场 | `xuedi.scene.js` | 四种动物踩出四种脚印轨迹（竹叶/梅花/枫叶/月牙） | 课文《雪地里的小画家》 |
| 诗境箱 | `chuan.scene.js` | 夜空弯月+星星，诗句逐句浮现锚定景物 | 课文《小小的船》 |

**踩过的坑（写进新场景时务必注意）**：
- `update(dt, p)` 必须接 `p` 并把 `p.<sliderKey>` 赋给状态目标——漏接会导致滑块完全失效（症状：画面卡在半程、实物不淡出、字看起来"不对"）。
- `applyEvol` 等动画函数在 `setChar` 末尾手动调一次（`applyEvol(1)`）让首帧立即呈现初始态，否则首屏空白。
- 初始 `state.evol` 要与滑块 `value` 一致（半程 0.55 常见），否则首屏与滑块位置对不上。
- 场景里用 `addLabel(text, anchor, {show:false})` 时，若希望初始隐藏须手动 `el.style.opacity=0`（`show:false` 只控制不建 DOM 标签的显示，部分场景需自行设 opacity）。

scene.js 契约（两种模式共用）：

```js
export const meta = {
  tag: '物理 · 八年级 · 动能',          // 或 '语文 · 一年级 · 会意字'
  title: '动能：速度翻倍，能量翻四倍',
  lead: '…',
  concept: '<p>…支持 <b>/<em> 高亮…</p>',
  formula: { expr: '…', note: '…', label: '字理' },   // label 可覆盖"核心公式"标题
  points: ['…', '…'],
  question: '…',
  controls: [ { key, label, min, max, step, value, unit } ],
  controlsLabel: '动手拆一拆',          // 可覆盖"动手调一调"
  playLabel: '演一遍',                  // 可覆盖"▶ 开始"
  readoutLabel: '这个字',              // 可覆盖"实时读数"
  actions: [ { key, label, on } ],      // 可选：平铺切换按钮组（切字/切模式），回调 impl.act(key, P)
  tts: true,                            // 可选：显示"🔊 读一遍"按钮，回调 impl.speak(P)
  cam: { pos: [x,y,z], target: [x,y,z] },
};

export function create({ scene, addLabel, setReadouts }) {
  // 搭建装置、状态机、标签
  return { update(dt, p), play(p), reset(p), readouts(p), act?, speak? };
}
```

完整契约见 `references/scene-guide.md`。物理数值口径（g 取值、演示口径的简化）也见该文件。

### 3. 汉字课件（glyph 模式）专项

先导出需要的字（只导出**合体字**，部件从同一份笔画按 split 分组即可，无需单独数据）：

```bash
python <skill目录>/scripts/hanzi.py 明男尖尘 -o glyphs.js      # JS 常量，贴进 scene.js
python <skill目录>/scripts/hanzi.py 明 --stats                  # 看笔画数与体积
```

- 数据：每字 `{ s: [SVG轮廓路径…], m: [书写中线…] }`，1024 网格、**y 轴向上**（与 three 一致）。单字 1–4KB，一个课件 10 字内联 <30KB。
- 轮廓 → 立体笔画：`THREE.ShapePath` 手动解析 M/L/H/V/Q/C/Z → `toShapes(true)` → `ExtrudeGeometry(depth≈0.1, bevel≈0.006)`。模板见 ming.scene.js 的 `pathToShapes`。
- **踩过的坑**：
  - 大平面（纸面）会被五灯 ~4 倍照度 + ACES 洗白，纹理全没——纸材质底色必须压到光补偿位（实测 `#a39277`），纹理按正常观感画即可。
  - 圆角盒 `box()` 的 bevel 会让顶面**向外扩 rr**——贴纹理的薄面必须抬高 2×rr 以上，否则整面被盖住（现象：纹理死活不显示）。
  - 上下结构（尖/尘）分离时下半字会穿纸面：分离位置 y 加 `lift = SIZE*0.55*sep`，并在切字后 `autoFrame(camera, controls, scene, {pad:1.16, force:true})` 重新取景。
  - 无头截图 `--virtual-time-budget` 不推进 rAF 动画（SwiftShader 只跑 2-3 帧）——验证动画必须用 playwright（channel: msedge）真实等待截图。

### 4. 打包成单文件 HTML

```bash
python <skill目录>/scripts/build.py scene.js -o 输出.html --embed-three
```

- 默认（不带 `--embed-three`）：约 38KB，但需要联网加载 three.js。
- **交付用户时一律加 `--embed-three`**：约 1.7MB，完全离线，双击就能看。

### 4.5 仿真/逼真模式（仿 WeduLab）

想让课件"逼真"（真实物理、粒子、辉光）时，`lab.js` 提供三个增强能力，**向后兼容，不影响现有场景**：

**① `makeParticles(scene, opts)` — GPU 粒子（声波/烟雾/水流/光点）**
```js
import { makeParticles } from '../runtime/lab.js';
const p = makeParticles(scene, { count: 300, size: 0.16, color: '#4a90d9', opacity: 0.95, life: 9999 });
// 每帧：p.points.geometry.attributes.position.array[i*3..] 直接写位置，然后 needsUpdate=true
// 注意：初始化后必须 `points.frustumCulled = false` + `geometry.computeBoundingSphere()`，否则被视锥裁剪
// shader 用 1100.0/-mv.z 系数（小系数会导致粒子小得看不见）
```

**② `Phys` — 真实物理工具（简谐振子/重力/抛物/碰撞）**
```js
import { Phys } from '../runtime/lab.js';
const disp = Phys.oscillator(A, omega, t, phi);  // 简谐振子：鼓面/弹簧/振动
const pos  = Phys.projectile(p0, v0, t, g=9.8);  // 抛物：抛体/投石
```

**③ `enableBloom(renderer, scene, camera)` — 辉光后处理（opt-in）**
```js
import { enableBloom } from '../runtime/lab.js';
const bloom = enableBloom(stage.renderer, stage.scene, stage.camera, { strength:0.85, threshold:0.82 });
bloom.enable();
window.__renderFn = bloom.render;  // 模板主循环检测 __renderFn 就用它渲染
```
**⚠️ 踩坑（已修）**：
- bloom 渲染到 RT 时，SwiftShader 软渲染（`--enable-unsafe-swiftshader`）会黑屏。真机 GPU 正常。验证时如用无头软渲染，建议 bloom 默认关，用 Additive 发光 sprite（`glowSprite` + `blending: AdditiveBlending`）承担辉光——声波光晕、发光点都靠它，效果够且不黑屏。
- 若启用 bloom，**内部必须走 `oldRender`（替换前绑定的原始 render），不能调 `renderer.render`，否则递归爆栈**。
- 发光物体要设 `material.emissive` 或 `MeshBasicMaterial` 高亮，bloom 的 threshold 才提取得到。

**样板**：`assets/examples/sound.scene.js`《声音的传播》（鼓面真实振动 + 空气分子 GPU 粒子疏密波 + 声波光晕，教材 P34 当底座）。

**④ `enableStudio(stage)` — Studio 软阴影（对标 Machine Skill LabKit，推荐常开）**
```js
import { enableStudio } from '../runtime/lab.js';
const studio = enableStudio(stage, { radius: 7, contact: true });
studio.enable();   // 在 impl.ready(stage) 里调用
```
- **VSM 软阴影**：`shadow.radius=7 + blurSamples=16`，阴影边缘柔和、无锯齿（PCF 下 radius 无效，必须 VSM）。
- **接触阴影盘**：径向渐变贴地（MultiplyBlending），物体落在纸面上有软影，像真的放在桌面上。
- **优点**：不依赖 RT 后处理，SwiftShader 软渲染下也稳定（不黑屏），比 `enableBloom` 更可靠。**推荐所有课件常开**。
- **样板**：`sound.scene.js` 的 `ready()` 已接。

### 5. 自检（生成后必做）

用 Edge 无头模式截图检查（playwright 对 file:// 支持不稳定，用这条命令）：

```bash
msedge --headless=new --disable-gpu --enable-unsafe-swiftshader \
  --screenshot=check.png --window-size=1400,900 --virtual-time-budget=12000 \
  "file:///<输出文件的绝对路径>"
```

检查 `check.png`（用读图方式查看）：

- [ ] 3D 装置完整入画（不裁切、不出画）
- [ ] 标签可读、不互相重叠、不遮装置主体
- [ ] 左侧面板标题/公式/要点正常渲染
- [ ] 无红色错误横幅（模板自带全局错误显示）
- [ ] 点击「开始」后动画能推进（必要时在 create 里支持自动播放）

发现问题就改 scene.js 重新打包，直到通过。

### 6. 交付

- 用 present_files 打开生成的 HTML。
- 一句话说明：改哪些参数、看点是什么。

## 批量生成

用户要求整章/多课时时：

1. 每个知识点独立 scene.js + 独立 HTML（文件名：`学科-知识点.html`，如 `物理-动能.html`）。
2. 追加生成一个 `index.html` 目录页（简单卡片列表即可，链到各文件）。
3. 逐一走完自检流程，不要跳过。

## 红线

- 讲解文字必须是原创改写，不得照抄教材句子。
- 场景里不得出现教材扫描图、教材插图。
- 物理量纲必须正确：读数面板的数值与单位要经得起推敲（允许"演示口径"简化，但要在 concept 里注明）。
- 生成的 HTML 交付物中不得包含任何教材 PDF 内容。
