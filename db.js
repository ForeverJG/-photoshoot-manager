import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'data.db');

let db = null;

// 加载或创建数据库
async function openDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      model_name TEXT NOT NULL,
      shoot_date TEXT NOT NULL,
      start_time TEXT DEFAULT '09:00',
      end_time TEXT,
      content TEXT NOT NULL,
      location TEXT NOT NULL,
      props TEXT DEFAULT '[]',
      deposit_amount REAL DEFAULT 0,
      balance_amount REAL DEFAULT 0,
      deposit_received INTEGER DEFAULT 0,
      balance_received INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  return db;
}

// 持久化到文件
function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// 安全保存（延迟合并写入，避免频繁IO）
let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDB();
    saveTimeout = null;
  }, 500);
}

// 初始化数据库
const dbPromise = openDB();

// 辅助：执行查询并返回结果对象数组
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// 辅助：执行查询并返回单个结果
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// 辅助：执行非查询语句
function run(sql, params = []) {
  db.run(sql, params);
  scheduleSave();
}

// 辅助：获取最后插入的行ID
function lastInsertRowId() {
  const rows = queryAll('SELECT last_insert_rowid() as id');
  return rows[0]?.id;
}

export { dbPromise, queryAll, queryOne, run, lastInsertRowId, saveDB, scheduleSave };
export default dbPromise;
