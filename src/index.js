import { assertReady, config } from "./config.js";
import { makeLogger } from "./logger.js";
import { scanMarket } from "./scanner.js";
import { decideTrade } from "./ai.js";
import {
  currentCashUsd,
  monitorOpenPositions,
  openPaperTrade,
} from "./trader.js";
import { openPositions, recentClosedTrades } from "./journal.js";
import { getParams } from "./state.js";
import { tuneOnce } from "./tuner.js";

const log = makeLogger("main");

let scanning = false;
let monitoring = false;
let tuning = false;

async function scanLoopOnce() {
  if (scanning) return;
  scanning = true;
  try {
    const params = getParams();
    const open = openPositions();
    const heldKeys = new Set(open.map((p) => `${p.exchange}:${p.symbol}`));
    if (open.length >= config.maxOpenPositions) {
      log.info(`at max positions (${open.length}/${config.maxOpenPositions}) — skipping scan`);
      return;
    }
    const ranked = await scanMarket({
      exchangeIds: config.exchanges,
      params,
      excludeSymbols: heldKeys,
    });
    if (ranked.length === 0) {
      log.info("no candidates passed prescreen");
      return;
    }
    const top = ranked.slice(0, params.maxAiPerScan);
    const recentJournal = summarizeJournalForPrompt();

    for (const cand of top) {
      if (openPositions().length >= config.maxOpenPositions) break;
      let decision;
      try {
        decision = await decideTrade({ candidate: cand, params, recentJournal });
      } catch (e) {
        log.warn(`decideTrade failed for ${cand.symbol}`, String(e));
        continue;
      }
      log.info(
        `AI ${decision.action.toUpperCase()} ${cand.exchange}:${cand.symbol} (conf ${decision.confidence}) — ${decision.thesis?.slice(0, 140)}`,
      );
      if (
        decision.action === "enter" &&
        (decision.confidence ?? 0) >= params.minConfidence &&
        isWithinBounds(decision)
      ) {
        const cash = currentCashUsd();
        const sizingUsd = Math.max(10, (cash * params.positionSizePct) / 100);
        if (sizingUsd > cash) continue;
        await openPaperTrade({ candidate: cand, decision, sizingUsd });
      }
    }
  } catch (e) {
    log.error("scanLoop error", String(e));
  } finally {
    scanning = false;
  }
}

function isWithinBounds(d) {
  return (
    d.take_profit_pct >= 2 &&
    d.take_profit_pct <= 15 &&
    d.stop_loss_pct >= 1 &&
    d.stop_loss_pct <= 8 &&
    d.max_hold_minutes >= 15 &&
    d.max_hold_minutes <= 90
  );
}

function summarizeJournalForPrompt() {
  const trades = recentClosedTrades(Date.now() - 24 * 60 * 60 * 1000);
  if (trades.length === 0) return { n: 0 };
  const wins = trades.filter((t) => (t.pnl_pct ?? 0) > 0).length;
  return {
    n: trades.length,
    win_rate: Math.round((wins / trades.length) * 100) / 100,
    avg_pnl_pct:
      Math.round(
        (trades.reduce((a, t) => a + (t.pnl_pct ?? 0), 0) / trades.length) * 100,
      ) / 100,
    last5: trades.slice(0, 5).map((t) => ({
      symbol: t.symbol,
      pnl_pct: round2(t.pnl_pct),
      exit_reason: t.exit_reason,
    })),
  };
}

function round2(x) {
  if (!Number.isFinite(x)) return null;
  return Math.round(x * 100) / 100;
}

async function monitorLoopOnce() {
  if (monitoring) return;
  monitoring = true;
  try {
    await monitorOpenPositions();
  } catch (e) {
    log.error("monitorLoop error", String(e));
  } finally {
    monitoring = false;
  }
}

async function tuneLoopOnce() {
  if (tuning) return;
  tuning = true;
  try {
    await tuneOnce();
  } catch (e) {
    log.error("tuneLoop error", String(e));
  } finally {
    tuning = false;
  }
}

async function main() {
  assertReady();
  log.info(`starting trade hunter`, {
    mode: config.mode,
    exchanges: config.exchanges,
    startingCash: currentCashUsd(),
    modelDecide: config.modelDecide,
    modelTune: config.modelTune,
  });

  // Kick off all three loops independently so a slow scan doesn't block
  // position monitoring.
  scanLoopOnce();
  setInterval(scanLoopOnce, config.scanIntervalMs);
  setInterval(monitorLoopOnce, config.monitorIntervalMs);
  setInterval(tuneLoopOnce, config.tuneIntervalMs);

  // Graceful shutdown so SQLite WAL flushes.
  const shutdown = (sig) => {
    log.info(`received ${sig}, exiting`);
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((e) => {
  log.error("fatal", String(e?.stack ?? e));
  process.exit(1);
});
