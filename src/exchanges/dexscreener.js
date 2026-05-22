// DexScreener public API — no key required. Great for meme-coin coverage.
// We use the search endpoint to surface tokens with high recent activity,
// then derive candidates with strong 1h momentum and reasonable liquidity.
const BASE = "https://api.dexscreener.com/latest/dex";

// Symbol format used internally for DEX entries: "DEXS:chain/pairAddress"
// so we can round-trip back to the price endpoint without re-searching.
export function dexSymbol(chainId, pairAddress) {
  return `DEXS:${chainId}/${pairAddress}`;
}

function parseDexSymbol(symbol) {
  const m = /^DEXS:([^/]+)\/(.+)$/.exec(symbol);
  if (!m) return null;
  return { chainId: m[1], pairAddress: m[2] };
}

export const dexscreener = {
  id: "dexscreener",

  async listCandidates({ minLiquidityUsd = 250_000, limit = 30 } = {}) {
    // We don't have a single "all hot pairs" endpoint. Strategy: search a few
    // common meme-coin keywords, dedupe, score by 1h price change with a
    // liquidity floor. This gives us a low-cost meme-coin sampler.
    const queries = ["sol", "pepe", "doge", "shib", "wif", "bonk", "trump"];
    const seen = new Map();
    for (const q of queries) {
      try {
        const r = await fetch(
          `${BASE}/search?q=${encodeURIComponent(q)}`,
        );
        if (!r.ok) continue;
        const j = await r.json();
        for (const p of j.pairs ?? []) {
          if (!p.priceUsd) continue;
          const liq = Number(p.liquidity?.usd ?? 0);
          if (liq < minLiquidityUsd) continue;
          const change1h = Number(p.priceChange?.h1 ?? 0);
          const change5m = Number(p.priceChange?.m5 ?? 0);
          const vol1h = Number(p.volume?.h1 ?? 0);
          const key = `${p.chainId}/${p.pairAddress}`;
          if (seen.has(key)) continue;
          seen.set(key, {
            exchange: "dexscreener",
            symbol: dexSymbol(p.chainId, p.pairAddress),
            base: p.baseToken?.symbol ?? "?",
            quote: p.quoteToken?.symbol ?? "?",
            chain: p.chainId,
            dex: p.dexId,
            last_px: Number(p.priceUsd),
            change_pct_5m: change5m,
            change_pct_1h: change1h,
            change_pct_24h: Number(p.priceChange?.h24 ?? 0),
            quote_vol_1h: vol1h,
            quote_vol_24h: Number(p.volume?.h24 ?? 0),
            liquidity_usd: liq,
            pair_url: p.url,
          });
        }
      } catch {
        /* ignore one query failing */
      }
    }
    return [...seen.values()]
      .sort((a, b) => b.change_pct_1h - a.change_pct_1h)
      .slice(0, limit);
  },

  async getPrice(symbol) {
    const parsed = parseDexSymbol(symbol);
    if (!parsed) throw new Error(`bad dex symbol ${symbol}`);
    const r = await fetch(
      `${BASE}/pairs/${parsed.chainId}/${parsed.pairAddress}`,
    );
    if (!r.ok) throw new Error(`dexscreener price ${r.status}`);
    const j = await r.json();
    const p = j.pair ?? j.pairs?.[0];
    if (!p?.priceUsd) throw new Error("dexscreener: no price");
    return Number(p.priceUsd);
  },

  async klines() {
    // DexScreener doesn't expose OHLC publicly. We rely on the change_pct_*
    // fields from the candidate listing as a proxy. Callers should handle
    // an empty array.
    return [];
  },
};
