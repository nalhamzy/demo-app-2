import {
  closeTrade,
  db,
  openPositions,
  openTrade,
  snapshotPortfolio,
} from "./journal.js";
import { getExchange } from "./exchanges/index.js";
import { decideExit } from "./ai.js";
import { config } from "./config.js";
import { makeLogger } from "./logger.js";

const log = makeLogger("trader");

// In-memory cash account for paper mode. Persisted across restarts via the
// portfolio_snapshots table.
let cashUsd = null;

function loadCash() {
  if (cashUsd !== null) return cashUsd;
  const row = db
    .prepare("SELECT cash_usd FROM portfolio_snapshots ORDER BY ts DESC LIMIT 1")
    .get();
  cashUsd = row ? row.cash_usd : config.paperStartingUsd;
  return cashUsd;
}

// Per-symbol recent-price ring buffer; helps AI exit decision see momentum.
const priceHistory = new Map();
function pushPrice(key, px) {
  const arr = priceHistory.get(key) ?? [];
  arr.push({ t: Date.now(), px });
  while (arr.length > 20) arr.shift();
  priceHistory.set(key, arr);
}

export async function openPaperTrade({ candidate, decision, sizingUsd }) {
  if (config.mode !== "paper") {
    throw new Error("live trading is not implemented in v0.1");
  }
  loadCash();
  if (sizingUsd > cashUsd) {
    log.warn(`insufficient paper cash: want $${sizingUsd}, have $${cashUsd.toFixed(2)}`);
    return null;
  }
  const qty = sizingUsd / candidate.last_px;
  cashUsd -= sizingUsd;
  const id = openTrade({
    exchange: candidate.exchange,
    symbol: candidate.symbol,
    qty,
    entry_px: candidate.last_px,
    tp_pct: decision.take_profit_pct,
    sl_pct: decision.stop_loss_pct,
    max_hold_min: decision.max_hold_minutes,
    ai_thesis: decision.thesis,
    features: candidate.features,
  });
  log.info(
    `OPEN paper #${id} ${candidate.exchange}:${candidate.symbol} @ ${candidate.last_px} qty=${qty.toFixed(6)} tp=${decision.take_profit_pct}% sl=${decision.stop_loss_pct}% hold<=${decision.max_hold_minutes}m`,
    { thesis: decision.thesis },
  );
  return id;
}

async function priceFor(pos) {
  const ex = getExchange(pos.exchange);
  return ex.getPrice(pos.symbol);
}

async function maybeExit(pos) {
  let px;
  try {
    px = await priceFor(pos);
  } catch (e) {
    log.warn(`price fetch failed for ${pos.symbol}`, String(e));
    return;
  }
  const key = `${pos.exchange}:${pos.symbol}`;
  pushPrice(key, px);

  const pnlPct = ((px - pos.entry_px) / pos.entry_px) * 100;
  const heldMin = (Date.now() - pos.ts_open) / 60_000;

  // Hard rules first — these don't need AI.
  if (pos.tp_pct && pnlPct >= pos.tp_pct) {
    return finalize(pos, px, "take_profit");
  }
  if (pos.sl_pct && pnlPct <= -pos.sl_pct) {
    return finalize(pos, px, "stop_loss");
  }
  if (pos.max_hold_min && heldMin >= pos.max_hold_min) {
    return finalize(pos, px, "max_hold");
  }

  // Soft AI check: only every ~3 minutes per position to control cost.
  const lastAiKey = `_lastExitCheck:${pos.id}`;
  const last = priceHistory.get(lastAiKey)?.t ?? 0;
  if (Date.now() - last < 3 * 60_000) return;
  priceHistory.set(lastAiKey, [{ t: Date.now(), px }]);

  try {
    const recent = (priceHistory.get(key) ?? []).map((r) => r.px);
    const decision = await decideExit({ position: pos, currentPx: px, recentPxs: recent });
    if (decision.action === "exit") {
      return finalize(pos, px, `ai:${decision.reason?.slice(0, 60)}`);
    }
    if (
      decision.new_stop_loss_pct &&
      decision.new_stop_loss_pct > 0 &&
      decision.new_stop_loss_pct < pos.sl_pct
    ) {
      db.prepare("UPDATE trades SET sl_pct = ? WHERE id = ?").run(
        decision.new_stop_loss_pct,
        pos.id,
      );
      log.info(`tightened SL for #${pos.id} to ${decision.new_stop_loss_pct}%`);
    }
  } catch (e) {
    log.warn(`exit-AI failed for #${pos.id}`, String(e));
  }
}

function finalize(pos, exitPx, reason) {
  const res = closeTrade(pos.id, { exit_px: exitPx, exit_reason: reason });
  if (!res) return;
  cashUsd = (cashUsd ?? loadCash()) + pos.qty * exitPx;
  log.info(
    `CLOSE #${pos.id} ${pos.symbol} exit=${exitPx} pnl=${res.pnl_pct.toFixed(2)}% ($${res.pnl_usd.toFixed(2)}) reason=${reason}`,
  );
}

export async function monitorOpenPositions() {
  const positions = openPositions();
  if (positions.length === 0) return;
  // Sequential to be polite to public APIs — there's rarely more than a few.
  for (const pos of positions) {
    await maybeExit(pos);
  }
  await snapshot();
}

async function snapshot() {
  const positions = openPositions();
  let equity = loadCash();
  for (const p of positions) {
    try {
      const px = await priceFor(p);
      equity += p.qty * px;
    } catch {
      equity += p.qty * p.entry_px;
    }
  }
  snapshotPortfolio({
    cashUsd: loadCash(),
    equityUsd: equity,
    openCount: positions.length,
  });
}

export function currentCashUsd() {
  return loadCash();
}

export function setCashUsdForTest(v) {
  cashUsd = v;
}
