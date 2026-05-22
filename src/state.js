import { getParam, setParam } from "./journal.js";

// Default tunable params — these are the knobs the tuner can change.
const DEFAULTS = {
  // Scanner
  minRecentChangePct: 1.5, // % — candidates below this aren't even prescreened
  minScore: 2.0, // prescreen cutoff
  maxAiPerScan: 3, // how many candidates we send to Claude per loop

  // Trade sizing (paper)
  positionSizePct: 20, // % of current cash per trade

  // AI hints (passed into the system prompt context)
  preferred_tp_pct: 5,
  preferred_sl_pct: 3,
  preferred_max_hold_min: 60,

  // Decision threshold — only enter if AI confidence >= this
  minConfidence: 0.55,
};

export function getParams() {
  const out = {};
  for (const k of Object.keys(DEFAULTS)) {
    out[k] = getParam(k, DEFAULTS[k]);
  }
  return out;
}

export function setParams(patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in DEFAULTS)) continue;
    setParam(k, v);
  }
}

export const PARAM_KEYS = Object.keys(DEFAULTS);
