# Crypto Trade Hunter

A background service that scans Binance, Coinbase, and DexScreener for
short-horizon crypto/meme-coin setups, uses **Claude** to decide whether to
enter and when to exit, and **tunes its own parameters** from a SQLite trade
journal.

> **Targeting +5% within 60 minutes is a target, not a guarantee.** No
> short-horizon strategy reliably delivers this. Run in paper mode, watch the
> journal, and only consider live trading once the track record justifies it.

## Quick start

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY
npm install
npm start
```

Inspect what the bot is doing:

```bash
npm run report
```

Force an immediate tuning pass (normally runs every 6h):

```bash
npm run tune
```

## How it works

1. **Scanner** (`src/scanner.js`) pulls top 24h movers from each enabled
   exchange in parallel, then fetches a short klines window to compute
   momentum / volume / RSI features and a cheap prescreen score.
2. **AI decision** (`src/ai.js`) — for the top-N prescreened candidates,
   Claude Haiku returns a structured `decide_trade` tool call (enter/skip,
   take-profit %, stop-loss %, max-hold minutes, thesis). Trades below the
   confidence threshold are skipped.
3. **Paper trader** (`src/trader.js`) opens a simulated position sized as a
   % of current cash. A monitor loop runs every 15s checking TP/SL/max-hold
   and asks Claude every ~3 min whether to exit early or tighten the stop.
4. **Journal** (`src/journal.js`) — every trade, AI call, and parameter
   change is persisted to `data/journal.db` (SQLite, WAL mode).
5. **Tuner** (`src/tuner.js`) — every 6 hours, Claude Sonnet reviews the
   recent journal and proposes bounded parameter changes
   (position size, confidence threshold, preferred TP/SL, etc.). Changes
   are applied within hard guardrails defined in `src/state.js`.

## Modes

- `MODE=paper` (default): simulated trades against live prices. No keys
  needed beyond `ANTHROPIC_API_KEY`.
- `MODE=live`: **not implemented** in v0.1 — the config explicitly refuses
  to start. The exchange adapters expose `getPrice` / `klines` but no
  order placement. To wire up live trading you'd add `placeOrder` /
  `cancelOrder` methods per exchange and a real signing path.

## Files

```
src/
  index.js          Main entry. Scan / monitor / tune loops.
  config.js         Env-driven configuration.
  scanner.js        Pulls + ranks candidates across exchanges.
  signals.js        Momentum / RSI / volume features.
  ai.js             Claude decision + exit calls (tool_use).
  trader.js         Paper-trade open/close + position monitor.
  tuner.js          Periodic parameter tuner.
  journal.js        SQLite trade/AI/portfolio log.
  state.js          Tunable parameter store with bounds.
  report.js         CLI: `npm run report`.
  exchanges/
    binance.js      Binance public 24h tickers + klines.
    coinbase.js     Coinbase Exchange products + candles.
    dexscreener.js  DexScreener search (meme-coin coverage).
```

## Safety notes

- The tuner is bounded: `src/state.js` defines hard ranges and the tuner
  prompt limits to ~3 changes per call.
- Decision-time guardrails reject AI outputs outside reasonable TP/SL/hold
  bounds (`isWithinBounds` in `src/index.js`).
- All AI calls and tool inputs/outputs are logged to `ai_calls` for audit.
- Live trading is intentionally gated by both `MODE=live` **and**
  `LIVE_TRADING_CONFIRMED=yes`.

## Running as a service

For long-running use, pair it with `pm2` or systemd:

```bash
npx pm2 start npm --name trade-hunter -- start
npx pm2 logs trade-hunter
```
