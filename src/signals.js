// Lightweight feature extraction from kline data. Everything here is a pure
// function so the tuner can later re-score historical candidates.

export function pctChange(a, b) {
  if (!a) return 0;
  return ((b - a) / a) * 100;
}

export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

export function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v =
    arr.reduce((a, b) => a + (b - m) * (b - m), 0) / (arr.length - 1);
  return Math.sqrt(v);
}

// Compute features for a single candidate given recent klines (may be empty
// for DEX where we don't have OHLC — we degrade gracefully).
export function featuresFromKlines(klines) {
  if (!klines || klines.length === 0) return {};
  const closes = klines.map((k) => k.c);
  const vols = klines.map((k) => k.v);
  const last = closes[closes.length - 1];
  const first = closes[0];
  const tail5 = closes.slice(-5);
  const tail15 = closes.slice(-15);

  const pct_5m = pctChange(closes[closes.length - 6] ?? first, last);
  const pct_15m = pctChange(closes[closes.length - 16] ?? first, last);
  const pct_60m = pctChange(first, last);
  const vol_recent = vols.slice(-5).reduce((a, b) => a + b, 0);
  const vol_baseline = vols.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(1, vols.length - 5);
  const vol_spike = vol_baseline > 0 ? vol_recent / 5 / vol_baseline : 0;
  const volatility_pct = (stdev(closes) / (last || 1)) * 100;

  return {
    pct_5m: round2(pct_5m),
    pct_15m: round2(pct_15m),
    pct_60m: round2(pct_60m),
    rsi_14: round2(rsi(closes, 14)),
    vol_spike: round2(vol_spike),
    volatility_pct: round2(volatility_pct),
    trend_up: tail5[tail5.length - 1] > tail15[0],
  };
}

function round2(x) {
  if (x === null || x === undefined || !Number.isFinite(x)) return null;
  return Math.round(x * 100) / 100;
}

// Cheap pre-screen score: rewards momentum + volume spike, penalizes
// extreme RSI (already overbought) and stale change. Used to pick the top
// N candidates we'll spend AI tokens on.
export function prescreenScore(cand, feats) {
  let s = 0;
  // Recent momentum is the strongest signal for short-horizon trades.
  if (feats.pct_5m != null) s += feats.pct_5m * 1.5;
  if (feats.pct_15m != null) s += feats.pct_15m * 0.8;
  // Fall back to the candidate's own change_pct_1h when we have no klines (DEX).
  if (feats.pct_5m == null && cand.change_pct_1h != null) {
    s += cand.change_pct_1h * 0.8;
  }
  if (feats.vol_spike) s += Math.min(feats.vol_spike, 5) * 1.0;
  if (feats.rsi_14 != null && feats.rsi_14 > 80) s -= (feats.rsi_14 - 80) * 0.5;
  if (feats.rsi_14 != null && feats.rsi_14 < 30) s -= (30 - feats.rsi_14) * 0.2;
  return Math.round(s * 100) / 100;
}
