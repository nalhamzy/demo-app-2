import { db } from "./journal.js";
import { getParams } from "./state.js";
import { currentCashUsd } from "./trader.js";

function fmtPct(x) {
  if (x == null) return "  -  ";
  const s = x >= 0 ? "+" : "";
  return `${s}${x.toFixed(2)}%`;
}

function fmtTs(ms) {
  if (!ms) return "—";
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19);
}

const open = db
  .prepare("SELECT * FROM trades WHERE ts_close IS NULL ORDER BY ts_open")
  .all();
const closed = db
  .prepare("SELECT * FROM trades WHERE ts_close IS NOT NULL ORDER BY ts_close DESC LIMIT 25")
  .all();

const all = db.prepare("SELECT pnl_pct FROM trades WHERE ts_close IS NOT NULL").all();
const wins = all.filter((t) => (t.pnl_pct ?? 0) > 0).length;
const losses = all.length - wins;
const avg = all.length
  ? all.reduce((a, t) => a + (t.pnl_pct ?? 0), 0) / all.length
  : 0;

console.log("\n== Crypto Trade Hunter — report ==\n");
console.log(`Paper cash:       $${currentCashUsd().toFixed(2)}`);
console.log(`Open positions:   ${open.length}`);
console.log(`Closed trades:    ${all.length}  (W: ${wins}  L: ${losses})`);
console.log(`Avg PnL / trade:  ${fmtPct(avg)}`);
console.log("");
console.log("Current params:");
for (const [k, v] of Object.entries(getParams())) {
  console.log(`  ${k.padEnd(24)} ${v}`);
}

if (open.length) {
  console.log("\nOpen positions:");
  for (const p of open) {
    const heldMin = ((Date.now() - p.ts_open) / 60000).toFixed(1);
    console.log(
      `  #${p.id} ${p.exchange}:${p.symbol}  entry ${p.entry_px}  tp ${p.tp_pct}%  sl ${p.sl_pct}%  held ${heldMin}m`,
    );
  }
}

if (closed.length) {
  console.log("\nLast closed trades:");
  for (const t of closed) {
    console.log(
      `  #${t.id} ${fmtTs(t.ts_close)}  ${t.exchange}:${t.symbol}  ${fmtPct(t.pnl_pct)}  via ${t.exit_reason}`,
    );
  }
}
console.log("");
