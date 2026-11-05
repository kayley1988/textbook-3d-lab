-- 纸上实验 · 全科书架
-- SQLite schema（node:sqlite 内置驱动，零编译依赖）
-- 设计原则：
--   1. textbook 是唯一实体，学段/年级/学科/版本/册次都是它的维度属性
--   2. chapter/section 由 OCR 目录生成，缺失时允许为空（书已上架、目录待建）
--   3. lesson 是 3D 场景绑定，scene_key 指向前端 SCENES 注册表
--   4. 用户侧数据（进度/书签）独立成表，便于将来多用户扩展

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------- 教材 ----------
CREATE TABLE IF NOT EXISTS textbook (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT UNIQUE NOT NULL,   -- 稳定标识：math-8-1 / phy-8-2 / chem-hs-bx1
  title        TEXT NOT NULL,          -- 义务教育教科书·物理八年级下册
  short_title  TEXT,                   -- 物理八下（书架卡片用）
  stage        TEXT NOT NULL,          -- 小学 / 初中 / 高中
  grade        INTEGER,                -- 1-12；高中模块制填推测值，仅用于排序
  subject      TEXT NOT NULL,          -- 数学 / 英语 / 物理 / 化学 / 生物学
  publisher    TEXT DEFAULT '人教版',
  edition      TEXT,                   -- PEP / 精通 / A版 / B版 / 空
  volume       TEXT,                   -- 上册 / 下册 / 全一册 / 必修第一册 / 选择性必修2
  volume_kind  TEXT DEFAULT 'term',    -- term（上下册） / module（必修·选择性必修）
  module_group TEXT,                   -- 高中用：必修 / 选择性必修
  sort_key     INTEGER DEFAULT 0,      -- 同学段内排序
  pdf_path     TEXT,                   -- 相对项目根的路径，如 books/初中/...
  pdf_size     INTEGER DEFAULT 0,      -- 字节，用于判断是否已下载
  page_count   INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'pending', -- pending 待下载 | downloaded 已下载 | indexed 已建目录 | ready 已有3D
  spine_color  TEXT,                   -- 书脊配色（书架视觉）
  created_at   TEXT DEFAULT (datetime('now','localtime')),
  updated_at   TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_tb_shelf ON textbook(stage, grade, subject, sort_key);
CREATE INDEX IF NOT EXISTS idx_tb_status ON textbook(status);

-- ---------- 章 ----------
CREATE TABLE IF NOT EXISTS chapter (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  textbook_id INTEGER NOT NULL REFERENCES textbook(id) ON DELETE CASCADE,
  no          INTEGER,
  title       TEXT NOT NULL,
  page        INTEGER,
  sort_key    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ch_tb ON chapter(textbook_id, sort_key);

-- ---------- 节 ----------
CREATE TABLE IF NOT EXISTS section (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id  INTEGER NOT NULL REFERENCES chapter(id) ON DELETE CASCADE,
  textbook_id INTEGER NOT NULL REFERENCES textbook(id) ON DELETE CASCADE,
  no          INTEGER,
  title       TEXT NOT NULL,
  page        INTEGER,
  sort_key    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sec_tb ON section(textbook_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_sec_ch ON section(chapter_id, sort_key);

-- ---------- 课时（3D 实验/演示） ----------
CREATE TABLE IF NOT EXISTS lesson (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  textbook_id INTEGER NOT NULL REFERENCES textbook(id) ON DELETE CASCADE,
  section_id  INTEGER REFERENCES section(id) ON DELETE SET NULL,
  scene_key   TEXT NOT NULL,           -- 前端 SCENES 注册表的 key
  title       TEXT NOT NULL,
  tag         TEXT,                    -- 显示在书页右上角的标签，如「11.3 动能 · 图11.3-2」
  right_page  INTEGER,                 -- 对开页右页页码
  anchor_u    REAL DEFAULT 0.50,       -- 装置锚点（书页归一化坐标）
  anchor_v    REAL DEFAULT 0.60,
  hover       REAL DEFAULT 0.85,       -- 悬空高度
  level       TEXT DEFAULT 'A',        -- A 核心实验/抽象过程/公式形成 | B 想想做做
  status      TEXT DEFAULT 'ready',    -- ready | planned 规划中
  params_json TEXT,                    -- 该课时的默认参数覆盖（可选）
  sort_key    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ls_tb ON lesson(textbook_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_ls_page ON lesson(textbook_id, right_page);

-- ---------- 用户数据 ----------
CREATE TABLE IF NOT EXISTS progress (
  textbook_id  INTEGER PRIMARY KEY REFERENCES textbook(id) ON DELETE CASCADE,
  last_page    INTEGER DEFAULT 1,
  last_lesson_id INTEGER,
  updated_at   TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS bookmark (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  textbook_id INTEGER NOT NULL REFERENCES textbook(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now','localtime'))
);

-- ---------- 上书架流水（分批上新留痕） ----------
CREATE TABLE IF NOT EXISTS shelf_event (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  textbook_id INTEGER REFERENCES textbook(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,      -- import / download / toc / lesson / publish
  detail     TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ---------- 书架聚合视图：每个 学段/年级/学科 的册数统计 ----------
CREATE VIEW IF NOT EXISTS v_shelf AS
SELECT stage, grade, subject,
       COUNT(*)                                                  AS book_total,
       SUM(CASE WHEN status IN ('downloaded','indexed','ready') THEN 1 ELSE 0 END) AS book_ready,
       SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END)          AS book_3d
FROM textbook
GROUP BY stage, grade, subject;
