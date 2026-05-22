// Read-only smoke test: pulls candidates from each enabled exchange and
// runs them through the prescreen. Does NOT call Anthropic or open trades.
import { getExchanges } from "./exchanges/index.js";
import { featuresFromKlines, prescreenScore } from "./signals.js";

const ids = (process.env.EXCHANGES ?? "binance,coinbase,dexscreener")
  .split(",")
  .map((s) => s.trim());

const exchanges = getExchanges(ids);

for (const ex of exchanges) {
  console.log(`\n=== ${ex.id} ===`);
  try {
    const t0 = Date.now();
    const cands = await ex.listCandidates();
    console.log(`  pulled ${cands.length} candidates in ${Date.now() - t0}ms`);
    if (cands.length === 0) continue;
    const sample = cands.slice(0, 3);
    for (const c of sample) {
      let feats = {};
      try {
        const kl = await ex.klines?.(c.symbol).catch(() => []);
        feats = featuresFromKlines(kl ?? []);
        if (c.exchange === "dexscreener") {
          feats.pct_5m = c.change_pct_5m ?? null;
          feats.pct_60m = c.change_pct_1h ?? null;
        }
      } catch (e) {
        feats = { error: String(e) };
      }
      const score = prescreenScore(c, feats);
      console.log(
        `  ${c.symbol.padEnd(28)} last=${c.last_px}  24h=${(c.change_pct_24h ?? 0).toFixed(2)}%  score=${score}`,
      );
      console.log(`     feats: ${JSON.stringify(feats)}`);
    }
  } catch (e) {
    console.log(`  FAILED: ${e.message ?? e}`);
  }
}

console.log("\nsmoketest done.");
