/* 教材库与"跨页 ↔ 3D 实验"绑定表 */

export const BOOKS = {
  physics8b: {
    title: '物理 · 八年级下册',
    publisher: '人民教育出版社',
    url: './books/初中/物理/人教版-人民教育出版社/八年级/义务教育教科书·物理八年级下册.pdf',
    pages: 96,
    cover: 1,          // 封面所在 PDF 页
  },
};

export const DEFAULT_BOOK = 'physics8b';

/*
  spread：right = 该对开的右页 PDF 页号（1-based），左页 = right - 1
  anchor：教材知识点在右页上的落点 (u, v)——指示光流的箭头指向这里
  hover：装置悬空高度（0 = 贴在纸面）
  lesson：该对开绑定的课时 id（点击章节 chips 会翻到这里）
*/
export const SPREADS = [
  // —— 第7章 力 ——
  { right: 8,  lesson: 'forceDoor',   anchor: [0.50, 0.55], tag: '7.1 力 · 想想做做：A/B/C 推门' },
  { right: 11, lesson: 'elastic',     anchor: [0.50, 0.55], tag: '7.2 弹力 · 弹簧测力计' },
  { right: 14, lesson: 'gravity',     anchor: [0.50, 0.55], tag: '7.3 重力 · G = mg' },
  { right: 16, lesson: 'circular',    anchor: [0.50, 0.55], tag: '7.3 重力 · 想想做做：甩橡皮' },
  // —— 第8章 运动和力 ——
  { right: 21, lesson: 'newton',      anchor: [0.50, 0.60], tag: '8.1 牛顿第一定律 · 阻力对运动的影响' },
  { right: 25, lesson: 'balance2',    anchor: [0.50, 0.55], tag: '8.2 二力平衡' },
  { right: 28, lesson: 'frictionS',   anchor: [0.50, 0.58], tag: '8.3 摩擦力 · 影响滑动摩擦大小的因素' },
  // —— 第9章 压强 ——
  { right: 34, lesson: 'pressure',    anchor: [0.50, 0.55], tag: '9.1 压强 · 压力的作用效果' },
  { right: 37, lesson: 'sinkPlug',    anchor: [0.50, 0.58], tag: '9.2 想想做做：池底拔塞' },
  { right: 38, lesson: 'manometer',   anchor: [0.50, 0.58], tag: '9.2 演示：U 形管压强计' },
  { right: 40, lesson: 'liquidP',     anchor: [0.50, 0.58], tag: '9.2 液体的压强 · 三孔喷水' },
  { right: 43, lesson: 'atmos',       anchor: [0.50, 0.58], tag: '9.3 大气压强 · 覆杯实验' },
  { right: 44, lesson: 'torricelli',  anchor: [0.50, 0.55], tag: '9.3 演示：托里拆利实验' },
  { right: 45, lesson: 'baroMeter',   anchor: [0.50, 0.55], tag: '9.3 想想做做：自制气压计' },
  { right: 48, lesson: 'coinJump',    anchor: [0.50, 0.58], tag: '9.4 想想做做：硬币跳高' },
  { right: 49, lesson: 'wing',        anchor: [0.50, 0.60], tag: '9.4 想想做做：机翼模型' },
  { right: 50, lesson: 'fluid',       anchor: [0.50, 0.58], tag: '9.4 流体压强 · 吹纸实验' },
  // —— 第10章 浮力 ——
  { right: 52, lesson: 'buoyancy',   anchor: [0.35, 0.50], tag: '第十章 章首 · 浮力' },
  { right: 58, lesson: 'archimedes',  anchor: [0.50, 0.58], tag: '10.2 阿基米德原理 · F浮 = G排' },
  { right: 61, lesson: 'floatSink',   anchor: [0.50, 0.58], tag: '10.3 想想做做：盐水浮鸡蛋' },
  { right: 62, lesson: 'clayBoat',    anchor: [0.50, 0.58], tag: '10.3 想想做做：橡皮泥小船' },
  { right: 64, lesson: 'balloon',     anchor: [0.50, 0.58], tag: '10.3 想想做做：塑料袋热气球' },
  // —— 第11章 功和机械能 ——
  { right: 63, lesson: 'intro',       anchor: [0.50, 0.74], tag: '第十一章 章首 · 过山车' },
  { right: 65, lesson: 'work',        anchor: [0.50, 0.62], tag: '11.1 功' },
  { right: 69, lesson: 'efficiency',  anchor: [0.50, 0.60], tag: '11.2 功率' },
  { right: 71, lesson: 'kinetic',    anchor: [0.50, 0.70], hover: 0.9, tag: '11.3 动能 · 图11.3-2 斜面实验' },
  { right: 73, lesson: 'gpe',         anchor: [0.50, 0.58], tag: '11.3 势能' },
  { right: 74, lesson: 'spring',      anchor: [0.50, 0.62], tag: '11.3 弹性势能' },
  { right: 75, lesson: 'roller',      anchor: [0.50, 0.60], tag: '11.4 想想做做：滚摆' },
  { right: 76, lesson: 'pendulum',    anchor: [0.50, 0.64], tag: '11.4 想想做做：铁锁摆鼻' },
  { right: 77, lesson: 'sankey',      anchor: [0.50, 0.62], tag: '11.4 水电站的能量流' },
  { right: 70, lesson: 'friction',    anchor: [0.50, 0.60], tag: '11.2 习题页' },
  { right: 78, lesson: 'heating',     anchor: [0.50, 0.60], tag: '11.4 科学世界' },
  // —— 第12章 简单机械 ——
  { right: 81, lesson: 'lever',       anchor: [0.50, 0.55], tag: '12.1 杠杆 · 平衡条件 F₁L₁ = F₂L₂' },
  { right: 86, lesson: 'pulley',      anchor: [0.50, 0.55], tag: '12.2 滑轮 · 定滑轮与动滑轮' },
  { right: 89, lesson: 'pulleyWork',  anchor: [0.50, 0.55], tag: '12.3 演示：用动滑轮省不省功' },
  { right: 90, lesson: 'mechEff',     anchor: [0.50, 0.58], tag: '12.3 机械效率 · 斜面' },
];

export const spreadForLesson = lessonId => SPREADS.find(s => s.lesson === lessonId) || null;
export const spreadAt = right => SPREADS.find(s => s.right === right) || null;
