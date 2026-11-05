# 场景编写指南（scene.js 契约）

生成 scene.js 时以 `assets/examples/kinetic.scene.js` 为范本。本文是该范本的完整规则。

## meta 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| tag | ✓ | `学科 · 学段 · 知识点`，显示在面板顶部的小标签 |
| title | ✓ | 口语化、带观点的标题（"速度翻倍，能量翻四倍"），不要用教材章节名 |
| lead | ✓ | 2~3 句引入，从生活经验出发，原创 |
| concept | ✓ | HTML 字符串。`<b>` 橙色强调、`<em>` 黄色高亮。2~3 段 |
| formula | 推荐 | `{ expr, note }`。expr 用 `<sub>/<sup>/<span class="op|var|hl">` 排版 |
| points | ✓ | 3 条左右，每条一个可检验的观察结论 |
| question | ✓ | "想一想"：把结论推到一个新情境 |
| controls | ✓ | 至少 2 个可调参数。`{ key, label, min, max, step, value, unit }` |
| cam | ✓ | `{ pos: [x,y,z], target: [x,y,z] }`。target 要指向装置几何中心 |

## create(ctx) 与返回契约

ctx 成员：`scene`（THREE.Scene，装置加到这里）、`addLabel(text, anchorObj3D, opts)`、`setReadouts(items)`、`camera`、`controls`、`visual`。

返回对象：

```js
return {
  update(dt, p) {},   // 每帧调用；p = 当前参数；dt 秒
  play(p) {},         // 点「开始」
  reset(p) {},        // 点「重置」
  readouts(p) {},     // 返回 [{label, val, unit}]，面板自动刷新
  onParam(p) {},      // 可选：滑块拖动时回调
};
```

时间推进用状态机（`phase` 变量 + `t` 累加 dt），参照样例的 idle→roll→flat→hit→done。

## 运行时工具（全局可用，无需 import）

```js
M(color, {rough, metal, opacity, emissive, ei, coat, env})  // 哑光陶土材质
box(w,h,d,mat)          // 圆角盒（默认就有产品级圆角）
cyl(rt,rb,h,mat,seg)    // 圆柱
sph(r,mat,seg)          // 球
glassMat(color,opacity) // 玻璃/水（透明+不写深度）
arrow(from, to, color)  // 箭头（返回组，userData.set(a,b) 可更新）
makeFlow(curve, opts)   // 沿曲线的粒子流（能量/电流/水流）
glowTube(curve, r, c)   // 发光管
dashedLine(points) / solidLine(points)
ECOL                    // 能量配色（KE/PE/EPE/Q/E/LIGHT/CHEM）
G                       // 9.8
autoFrame(camera, controls, group)  // 把装置拉进画面
createStage(container, labelsEl)    // 模板已调用，一般不直接用
```

**addLabel 的 anchor 必须是已加入场景的 Object3D**，否则标签不跟随：

```js
const mk = (x, y, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); grp.add(o); return o; };
const lab = addLabel('文字', mk(1, 2));
// 动画中更新：lab.el.textContent = '…'; lab.anchor.position.set(…);
```

## 物理口径约定

- g 默认取 **10**（教学口算友好），在场景里定义 `const G = 10` 并注释。
- 允许"演示口径"简化（如滑距 = k·mv²），但 concept 里要用一句话注明（"距离是动能的尺子"这类转换法表述）。
- 读数面板的单位必须正确：力的 N、能量的 J、压强的 Pa/kPa。
- 速度、加速度等运动量的时间尺度用真实秒。

## 视觉与体验红线（自检必查）

1. **装置完整入画**：不确定时调 `meta.cam` 拉远，或依赖 autoFrame 兜底。
2. **标签不遮主体**：标签 dy 偏移把文字放到装置上方或下方空白处；两个标签不要落在同一屏幕位置。
3. **推理链逐步点亮**：idle 时低透明度，进行到对应阶段opacity 升到 1。
4. **颜色语义**：力/动能用红橙系、势能用蓝系、守恒/正确用绿系、警示用 `--red`。
5. **阴影与接地**：所有实体 castShadow；接触地面的物体 y 坐标 = 自身半高。
6. **params 变化即时可见**：拖滑块时场景应有反馈（onParam 或 update 里响应）。

## 常见坑（实测踩过）

| 坑 | 正确做法 |
|---|---|
| 水体 scale.y 越拉越高 | geometry 高度定死基准，scale 只放比例系数 |
| 装置"悬空"错位 | 统一先定地面 y=0，装置 y = 半高；悬空用固定 HOVER 加在组上 |
| 标签不动 | anchor 没有 add 进场景组 |
| 透明水箱挡住里面物体 | opacity<0.85 时 depthWrite:false（glassMat 已处理） |
| 相机 target 只看地面 | target.y 要加装置悬空高度 |
| 动画不动 | update 里必须用传入的 dt 累加，别用绝对时间取模后忘记推进状态机 |
