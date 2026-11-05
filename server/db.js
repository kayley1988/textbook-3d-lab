// 数据库连接层 —— 使用 Node 22 内置 node:sqlite（零原生依赖，不需要 npm install）
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 项目根目录（server 的上一级） */
export const ROOT = resolve(__dirname, '..');
export const DATA_DIR = join(ROOT, 'data');
export const DB_PATH = join(DATA_DIR, 'lab.db');

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

// 初始化表结构（幂等）
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

/** 查询多行 */
export const all = (sql, ...args) => db.prepare(sql).all(...args);
/** 查询单行 */
export const get = (sql, ...args) => db.prepare(sql).get(...args);
/** 执行写入，返回 { changes, lastInsertRowid } */
export const run = (sql, ...args) => db.prepare(sql).run(...args);

/** 事务包装：批量导入时比逐条快一个数量级 */
export function tx(fn) {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/** 记一条上书架流水 */
export function logEvent(textbookId, action, detail = '') {
  run('INSERT INTO shelf_event(textbook_id, action, detail) VALUES(?,?,?)',
    textbookId, action, detail);
}
