import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);

const Database = require("better-sqlite3");

export const db = new Database(path.resolve(__dirname, "backup_msgs.db"));

db.pragma("journal_mode = WAL");

db.exec(`CREATE TABLE IF NOT EXISTS data (
  jid TEXT NOT NULL,
  key TEXT PRIMARY KEY,
  pn TEXT NOT NULL,
  participant_jid TEXT,
  type TEXT NOT NULL,
  mime TEXT,
  text TEXT,
  sent_time TEXT NOT NULL,
  filename TEXT,
  proto TEXT,
  edits TEXT,
  dl_time TEXT,
  timestamp_ms INTEGER NOT NULL
  )`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_data_ts ON data (timestamp_ms)`);

export const stmt = {
  insert: db.prepare(`INSERT OR IGNORE INTO data (jid, key, pn, participant_jid, type, mime, text, sent_time, filename, proto, edits, dl_time, timestamp_ms) VALUES (@jid, @key, @pn, @participant_jid, @type, @mime, @text, @sent_time, @filename, @proto, @edits, @dl_time, @timestamp_ms)`),
  get: db.prepare(`SELECT * FROM data WHERE key = ?`),
  updateEdits: db.prepare(`UPDATE data SET edits = ? WHERE key = ?`),
  setDlTime: db.prepare(`UPDATE data SET dl_time = ? WHERE key = ?`),
  delete: db.prepare(`DELETE FROM data WHERE key = ?`),
  selectOld: db.prepare(`SELECT filename FROM data WHERE timestamp_ms < ?`),
  deleteOld: db.prepare(`DELETE FROM data WHERE timestamp_ms < ?`)
};