import { getExchanges } from "./exchanges/index.js";
import { featuresFromKlines, prescreenScore } from "./signals.js";
import { makeLogger } from "./logger.js";

const log = makeLogger("scanner");

export async function scanMarket({ exchangeIds, params, excludeSymbols = new Set() }) {
  const exchanges = getExchanges(exchangeIds);

  // 1) Pull candidates from each exchange in parallel.
  const lists = await Promise.allSettled(
    exchanges.map((ex) => ex.listCandidates()),
  );
  const candidates = [];
  for (let i = 0; i < lists.length; i++) {
    const r = lists[i];
    if (r.status === "fulfilled") {
      candidates.push(...r.value);
    } else {
      log.warn(`exchange ${exchanges[i].id} listCandidates failed`, String(r.reason));
    }
  }
  log.info(`pulled ${candidates.length} raw candidates from ${exchanges.length} exchanges`);

  // 2) Drop anything we already hold.
  const fresh = candidates.filter(
    (c) => !excludeSymbols.has(`${c.exchange}:${c.symbol}`),
  );

  // 3) Coarse filter: must have positive 24h change to even bother looking.
  const promising = fresh.filter(
    (c) =>
      (c.change_pct_1h ?? c.change_pct_24h ?? 0) >= (params.minRecentChangePct ?? 1),
  );

  // 4) For Binance/Coinbase candidates, fetch a small klines window for
  //    real momentum features. DexScreener has no klines — we use the
  //    change_pct_5m/1h fields it returns directly.
  const exById = Object.fromEntries(exchanges.map((e) => [e.id, e]));
  const enriched = await Promise.all(
    promising.slice(0, 40).map(async (c) => {
      try {
        const ex = exById[c.exchange];
        const kl = await ex.klines?.(c.symbol).catch(() => []);
        const feats = featuresFromKlines(kl ?? []);
        // For DEX, fold in the listing's change fields.
        if (c.exchange === "dexscreener") {
          feats.pct_5m = c.change_pct_5m ?? null;
          feats.pct_60m = c.change_pct_1h ?? null;
        }
        const score = prescreenScore(c, feats);
        return { ...c, features: feats, score };
      } catch (e) {
        log.debug(`enrich failed for ${c.exchange}:${c.symbol}`, String(e));
        return null;
      }
    }),
  );

  const ranked = enriched
    .filter(Boolean)
    .filter((c) => c.score >= (params.minScore ?? 1.5))
    .sort((a, b) => b.score - a.score);

  log.info(`after enrich+filter: ${ranked.length} ranked candidates (top score ${ranked[0]?.score ?? "n/a"})`);
  return ranked;
}
