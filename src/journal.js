import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("data");
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "journal.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS trades (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  exchange     TEXT NOT NULL,
  symbol       TEXT NOT NULL,
  side         TEXT NOT NULL DEFAULT 'long',
  qty          REAL NOT NULL,
  entry_px     REAL NOT NULL,
  exit_px      REAL,
  ts_open      INTEGER NOT NULL,
  ts_close     INTEGER,
  tp_pct       REAL,
  sl_pct       REAL,
  max_hold_min REAL,
  ai_thesis    TEXT,
  exit_reason  TEXT,
  pnl_pct      REAL,
  pnl_usd      REAL,
  features     TEXT
);

CREATE TABLE IF NOT EXISTS ai_calls (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         INTEGER NOT NULL,
  kind       TEXT NOT NULL,
  model      TEXT,
  input      TEXT,
  output     TEXT,
  latency_ms INTEGER
);

CREATE TABLE IF NOT EXISTS params (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  ts        INTEGER PRIMARY KEY,
  cash_usd  REAL NOT NULL,
  equity_usd REAL NOT NULL,
  open_positions INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_open ON trades(ts_close);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
`);

export function openTrade(t) {
  const stmt = db.prepare(`
    INSERT INTO trades (exchange, symbol, side, qty, entry_px, ts_open,
                        tp_pct, sl_pct, max_hold_min, ai_thesis, features)
    VALUES (@exchange, @symbol, @side, @qty, @entry_px, @ts_open,
            @tp_pct, @sl_pct, @max_hold_min, @ai_thesis, @features)
  `);
  const r = stmt.run({
    side: "long",
    ts_open: Date.now(),
    features: JSON.stringify(t.features ?? {}),
    ...t,
  });
  return r.lastInsertRowid;
}

export function closeTrade(id, { exit_px, exit_reason }) {
  const row = db.prepare("SELECT * FROM trades WHERE id = ?").get(id);
  if (!row) return null;
  const pnl_pct = ((exit_px - row.entry_px) / row.entry_px) * 100;
  const pnl_usd = (exit_px - row.entry_px) * row.qty;
  db.prepare(
    `UPDATE trades SET exit_px=?, ts_close=?, exit_reason=?, pnl_pct=?, pnl_usd=? WHERE id=?`,
  ).run(exit_px, Date.now(), exit_reason, pnl_pct, pnl_usd, id);
  return { pnl_pct, pnl_usd };
}

export function openPositions() {
  return db
    .prepare("SELECT * FROM trades WHERE ts_close IS NULL ORDER BY ts_open")
    .all();
}

export function recentClosedTrades(sinceMs) {
  return db
    .prepare(
      "SELECT * FROM trades WHERE ts_close IS NOT NULL AND ts_close >= ? ORDER BY ts_close DESC",
    )
    .all(sinceMs);
}

export function logAiCall({ kind, model, input, output, latencyMs }) {
  db.prepare(
    `INSERT INTO ai_calls (ts, kind, model, input, output, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    Date.now(),
    kind,
    model,
    JSON.stringify(input).slice(0, 20000),
    JSON.stringify(output).slice(0, 20000),
    latencyMs,
  );
}

export function getParam(k, def) {
  const row = db.prepare("SELECT v FROM params WHERE k = ?").get(k);
  if (!row) return def;
  try {
    return JSON.parse(row.v);
  } catch {
    return def;
  }
}

export function setParam(k, v) {
  db.prepare(
    `INSERT INTO params (k, v, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at`,
  ).run(k, JSON.stringify(v), Date.now());
}

export function snapshotPortfolio({ cashUsd, equityUsd, openCount }) {
  db.prepare(
    `INSERT OR REPLACE INTO portfolio_snapshots (ts, cash_usd, equity_usd, open_positions)
     VALUES (?, ?, ?, ?)`,
  ).run(Date.now(), cashUsd, equityUsd, openCount);
}
