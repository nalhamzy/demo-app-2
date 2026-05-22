// Binance public market data — no auth required for ticker endpoints.
// Note: binance.com is geo-restricted in the US; binance.us has a different
// host. Switch BASE if needed.
const BASE = "https://api.binance.com";

const QUOTE = "USDT";

export const binance = {
  id: "binance",

  async listCandidates({ minQuoteVol = 5_000_000, limit = 30 } = {}) {
    const res = await fetch(`${BASE}/api/v3/ticker/24hr`);
    if (!res.ok) throw new Error(`binance 24hr ${res.status}`);
    const rows = await res.json();
    return rows
      .filter((r) => r.symbol.endsWith(QUOTE))
      // ignore stablecoin pairs and weird leveraged tokens
      .filter((r) => !/^(USDC|BUSD|FDUSD|TUSD|DAI)USDT$/.test(r.symbol))
      .filter((r) => !/(UP|DOWN|BULL|BEAR)USDT$/.test(r.symbol))
      .filter((r) => Number(r.quoteVolume) >= minQuoteVol)
      .map((r) => ({
        exchange: "binance",
        symbol: r.symbol,
        base: r.symbol.slice(0, -QUOTE.length),
        quote: QUOTE,
        last_px: Number(r.lastPrice),
        change_pct_24h: Number(r.priceChangePercent),
        quote_vol_24h: Number(r.quoteVolume),
        high_24h: Number(r.highPrice),
        low_24h: Number(r.lowPrice),
        trades_24h: Number(r.count),
      }))
      // Top short-window movers — Binance only gives 24h here; we'll fetch
      // klines below for finer-grained momentum.
      .sort((a, b) => b.change_pct_24h - a.change_pct_24h)
      .slice(0, limit);
  },

  async getPrice(symbol) {
    const res = await fetch(
      `${BASE}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`,
    );
    if (!res.ok) throw new Error(`binance price ${res.status}`);
    const j = await res.json();
    return Number(j.price);
  },

  // Returns last N 1-minute candles for finer momentum signals.
  async klines(symbol, interval = "1m", limit = 60) {
    const u = `${BASE}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`binance klines ${res.status}`);
    const rows = await res.json();
    return rows.map((r) => ({
      t: r[0],
      o: Number(r[1]),
      h: Number(r[2]),
      l: Number(r[3]),
      c: Number(r[4]),
      v: Number(r[5]),
    }));
  },
};
