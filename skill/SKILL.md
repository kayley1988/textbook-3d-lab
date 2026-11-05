---
name: textbook-3d-lab
description: 生成中学理科（物理/化学/生物/地理）3D 互动课件，输出单个 HTML 文件、双击即可离线运行。当用户要求"做一个 3D 实验/实验动画/公式推演/概念可视化课件"，或给出教材位置（如"人教版八下 P71 动能"、"第11章"、"浮力"）要求生成 3D 演示时使用。以知识点为索引、不复制教材内容，因此不受教材版本和版权限制。
agent_created: true
---

# 教材 3D 课件生成器

把一个知识点变成一个可交互的 3D 课件：单文件 HTML，含 3D 实验场景（可调参数）、公式推演（分步推理链）、实时读数、原创讲解。不依赖服务器与教材 PDF，双击即可运行。

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

参照黄金样例 `assets/examples/kinetic.scene.js`（结构、命名、质量标准都以它为准），写一个包含两部分的模块：

```js
export const meta = {
  tag: '物理 · 八年级 · 动能',
  title: '动能：速度翻倍，能量翻四倍',
  lead: '…',
  concept: '<p>…支持 <b>/<em> 高亮…</p>',
  formula: { expr: 'E<sub>k</sub> <span class="op">=</span> ½<span class="var">m</span><span class="var">v</span><sup>2</sup>', note: '…' },
  points: ['…', '…'],
  question: '…',
  controls: [ { key, label, min, max, step, value, unit } ],
  cam: { pos: [x,y,z], target: [x,y,z] },
};

export function create({ scene, addLabel, setReadouts }) {
  // 搭建装置、状态机、标签
  return { update(dt, p), play(p), reset(p), readouts(p) };
}
```

完整契约见 `references/scene-guide.md`。物理数值口径（g 取值、演示口径的简化）也见该文件。

### 3. 打包成单文件 HTML

```bash
python <skill目录>/scripts/build.py scene.js -o 输出.html --embed-three
```

- 默认（不带 `--embed-three`）：约 38KB，但需要联网加载 three.js。
- **交付用户时一律加 `--embed-three`**：约 1.7MB，完全离线，双击就能看。

### 4. 自检（生成后必做）

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

### 5. 交付

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
