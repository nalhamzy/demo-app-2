import "dotenv/config";

function num(name, def) {
  const v = process.env[name];
  if (v === undefined || v === "") return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number, got ${v}`);
  return n;
}

function str(name, def) {
  const v = process.env[name];
  return v === undefined || v === "" ? def : v;
}

export const config = {
  mode: str("MODE", "paper"),
  liveConfirmed: str("LIVE_TRADING_CONFIRMED", "no") === "yes",
  paperStartingUsd: num("PAPER_STARTING_USD", 1000),
  maxOpenPositions: num("MAX_OPEN_POSITIONS", 3),
  scanIntervalMs: num("SCAN_INTERVAL_MS", 30_000),
  monitorIntervalMs: num("MONITOR_INTERVAL_MS", 15_000),
  tuneIntervalMs: num("TUNE_INTERVAL_MS", 6 * 60 * 60 * 1000),
  modelDecide: str("MODEL_DECIDE", "claude-haiku-4-5"),
  modelTune: str("MODEL_TUNE", "claude-sonnet-4-6"),
  exchanges: str("EXCHANGES", "binance,coinbase,dexscreener")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  anthropicApiKey: str("ANTHROPIC_API_KEY", ""),
  binanceApiKey: str("BINANCE_API_KEY", ""),
  binanceApiSecret: str("BINANCE_API_SECRET", ""),
  coinbaseApiKey: str("COINBASE_API_KEY", ""),
  coinbaseApiSecret: str("COINBASE_API_SECRET", ""),
};

export function assertReady() {
  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is required (see .env.example)");
  }
  if (config.mode === "live" && !config.liveConfirmed) {
    throw new Error(
      "MODE=live requires LIVE_TRADING_CONFIRMED=yes. Refusing to start.",
    );
  }
  if (config.mode === "live") {
    // Live mode is a stub in v0.1 — fail loudly rather than silently doing nothing.
    throw new Error(
      "Live trading is not implemented in v0.1. Run with MODE=paper.",
    );
  }
}
