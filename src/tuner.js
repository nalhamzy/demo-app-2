import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { logAiCall, recentClosedTrades } from "./journal.js";
import { getParams, PARAM_KEYS, setParams } from "./state.js";
import { makeLogger } from "./logger.js";

const log = makeLogger("tuner");
const client = new Anthropic({ apiKey: config.anthropicApiKey });

const TUNE_TOOL = {
  name: "propose_params",
  description:
    "Propose updated tunable parameters based on recent trade outcomes. Only include keys you want to change. Be conservative — small, justified moves only.",
  input_schema: {
    type: "object",
    properties: {
      changes: {
        type: "object",
        description: "Map of param name to new numeric value.",
        additionalProperties: { type: "number" },
      },
      rationale: { type: "string" },
    },
    required: ["changes", "rationale"],
  },
};

function summarize(trades) {
  if (trades.length === 0) return { n: 0 };
  const wins = trades.filter((t) => (t.pnl_pct ?? 0) > 0);
  const losses = trades.filter((t) => (t.pnl_pct ?? 0) <= 0);
  const avg = (arr, k) =>
    arr.length === 0 ? 0 : arr.reduce((a, t) => a + (t[k] ?? 0), 0) / arr.length;
  const byReason = {};
  for (const t of trades) {
    const k = t.exit_reason ?? "unknown";
    byReason[k] = (byReason[k] ?? 0) + 1;
  }
  return {
    n: trades.length,
    win_rate: round2(wins.length / trades.length),
    avg_pnl_pct: round2(avg(trades, "pnl_pct")),
    avg_win_pct: round2(avg(wins, "pnl_pct")),
    avg_loss_pct: round2(avg(losses, "pnl_pct")),
    exits_by_reason: byReason,
    sample: trades.slice(0, 20).map((t) => ({
      symbol: t.symbol,
      pnl_pct: round2(t.pnl_pct),
      exit_reason: t.exit_reason,
      tp_pct: t.tp_pct,
      sl_pct: t.sl_pct,
      max_hold_min: t.max_hold_min,
      held_min: round2(((t.ts_close ?? 0) - t.ts_open) / 60_000),
      thesis: (t.ai_thesis ?? "").slice(0, 140),
    })),
  };
}

function round2(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

export async function tuneOnce({ lookbackMs = 48 * 60 * 60 * 1000 } = {}) {
  const trades = recentClosedTrades(Date.now() - lookbackMs);
  if (trades.length < 5) {
    log.info(`only ${trades.length} closed trades in lookback — skipping tune`);
    return null;
  }
  const summary = summarize(trades);
  const current = getParams();

  const system = `You are tuning a short-horizon crypto trade hunter. Goal: increase win-rate × avg-PnL while keeping risk bounded. You may only adjust these keys: ${PARAM_KEYS.join(", ")}. Hard bounds: positionSizePct in [5,40], minConfidence in [0.3,0.85], preferred_tp_pct in [2,15], preferred_sl_pct in [1,8], preferred_max_hold_min in [15,90], minRecentChangePct in [0,5], minScore in [0,6], maxAiPerScan in [1,5]. Be conservative: at most 3 changes per call, each at most 25% of its current value.`;

  const payload = { current_params: current, recent_summary: summary };

  const t0 = Date.now();
  const resp = await client.messages.create({
    model: config.modelTune,
    max_tokens: 1024,
    system,
    tools: [TUNE_TOOL],
    tool_choice: { type: "tool", name: "propose_params" },
    messages: [
      {
        role: "user",
        content: `Review the last ${trades.length} closed trades and propose parameter changes via propose_params.\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });
  const latency = Date.now() - t0;

  let proposal = null;
  for (const b of resp.content ?? []) {
    if (b.type === "tool_use" && b.name === "propose_params") proposal = b.input;
  }
  logAiCall({
    kind: "tune",
    model: config.modelTune,
    input: payload,
    output: proposal,
    latencyMs: latency,
  });
  if (!proposal) {
    log.warn("tuner: no proposal");
    return null;
  }
  // Apply bounded changes.
  const applied = {};
  for (const [k, v] of Object.entries(proposal.changes ?? {})) {
    if (!PARAM_KEYS.includes(k)) continue;
    if (!Number.isFinite(v)) continue;
    applied[k] = v;
  }
  if (Object.keys(applied).length === 0) {
    log.info("tuner: no valid changes to apply", proposal);
    return proposal;
  }
  setParams(applied);
  log.info(`tuner applied changes`, { applied, rationale: proposal.rationale });
  return { applied, rationale: proposal.rationale };
}

// CLI: `npm run tune`
if (import.meta.url === `file://${process.argv[1]}`) {
  tuneOnce()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
