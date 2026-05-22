// Coinbase Exchange public market data (no auth needed for product stats).
const BASE = "https://api.exchange.coinbase.com";

export const coinbase = {
  id: "coinbase",

  async _products() {
    const res = await fetch(`${BASE}/products`);
    if (!res.ok) throw new Error(`coinbase products ${res.status}`);
    const rows = await res.json();
    return rows.filter(
      (p) =>
        p.quote_currency === "USD" &&
        p.status === "online" &&
        !p.trading_disabled,
    );
  },

  async listCandidates({ minQuoteVol = 1_000_000, limit = 30 } = {}) {
    const products = await this._products();
    // Pull 24h stats per product. Coinbase rate limit ~10 req/s public; we
    // throttle by chunking and waiting briefly between batches.
    const out = [];
    const BATCH = 8;
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      const stats = await Promise.all(
        batch.map(async (p) => {
          try {
            const r = await fetch(`${BASE}/products/${p.id}/stats`);
            if (!r.ok) return null;
            const j = await r.json();
            const open = Number(j.open);
            const last = Number(j.last);
            if (!open || !last) return null;
            const change = ((last - open) / open) * 100;
            const quoteVol = Number(j.volume) * last;
            if (quoteVol < minQuoteVol) return null;
            return {
              exchange: "coinbase",
              symbol: p.id,
              base: p.base_currency,
              quote: p.quote_currency,
              last_px: last,
              change_pct_24h: change,
              quote_vol_24h: quoteVol,
              high_24h: Number(j.high),
              low_24h: Number(j.low),
            };
          } catch {
            return null;
          }
        }),
      );
      for (const s of stats) if (s) out.push(s);
      await new Promise((r) => setTimeout(r, 150));
    }
    return out
      .sort((a, b) => b.change_pct_24h - a.change_pct_24h)
      .slice(0, limit);
  },

  async getPrice(symbol) {
    const res = await fetch(`${BASE}/products/${symbol}/ticker`);
    if (!res.ok) throw new Error(`coinbase ticker ${res.status}`);
    const j = await res.json();
    return Number(j.price);
  },

  async klines(symbol, granularitySec = 60, limit = 60) {
    // /candles returns [time, low, high, open, close, volume]
    const end = Math.floor(Date.now() / 1000);
    const start = end - granularitySec * limit;
    const u = `${BASE}/products/${symbol}/candles?granularity=${granularitySec}&start=${start}&end=${end}`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`coinbase candles ${res.status}`);
    const rows = await res.json();
    return rows
      .slice()
      .reverse()
      .map((r) => ({
        t: r[0] * 1000,
        l: Number(r[1]),
        h: Number(r[2]),
        o: Number(r[3]),
        c: Number(r[4]),
        v: Number(r[5]),
      }));
  },
};
