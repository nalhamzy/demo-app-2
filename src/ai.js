import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { logAiCall } from "./journal.js";
import { makeLogger } from "./logger.js";

const log = makeLogger("ai");
const client = new Anthropic({ apiKey: config.anthropicApiKey });

const DECIDE_TOOL = {
  name: "decide_trade",
  description:
    "Decide whether to enter a short-horizon long trade on this candidate. Be skeptical: most candidates should be skipped. Only enter setups with a plausible path to +5% in <60 min.",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["enter", "skip"],
        description: "enter only if the setup is genuinely promising",
      },
      confidence: {
        type: "number",
        description: "0-1; how confident in this decision",
      },
      take_profit_pct: {
        type: "number",
        description: "Target gain in percent (e.g. 5 means +5%). Required if action=enter.",
      },
      stop_loss_pct: {
        type: "number",
        description: "Stop loss in percent below entry as a positive number (e.g. 3 means -3%). Required if action=enter.",
      },
      max_hold_minutes: {
        type: "number",
        description: "Abandon the trade if neither TP nor SL has triggered by this time. Required if action=enter.",
      },
      thesis: {
        type: "string",
        description: "1-3 sentences explaining the rationale. Be specific about which signals drove the call.",
      },
    },
    required: ["action", "confidence", "thesis"],
  },
};

const EXIT_TOOL = {
  name: "decide_exit",
  description:
    "Decide whether to exit an open position now given current state. Default to 'hold' unless thesis is clearly broken or momentum has reversed.",
  input_schema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["exit", "hold"] },
      reason: { type: "string" },
      new_stop_loss_pct: {
        type: "number",
        description: "Optional: tighten stop-loss (positive number, % below entry). Only when raising the stop.",
      },
    },
    required: ["action", "reason"],
  },
};

function extractToolUse(resp, toolName) {
  for (const block of resp.content ?? []) {
    if (block.type === "tool_use" && block.name === toolName) {
      return block.input;
    }
  }
  return null;
}

export async function decideTrade({ candidate, params, recentJournal }) {
  const system = `You are a short-horizon crypto trade screener. Goal: identify setups with a credible path to +5% within 60 minutes. You are skeptical by default — most candidates should be skipped. You may be wrong; size and stops protect against that.

Hard rules:
- Never recommend take_profit_pct above 15 or below 2.
- Never recommend stop_loss_pct above 8 or below 1.
- max_hold_minutes must be between 15 and 90.
- If features look stale, illiquid, or already vertical (e.g. RSI > 85 with no volume support), prefer 'skip'.`;

  const userPayload = {
    candidate: {
      exchange: candidate.exchange,
      symbol: candidate.symbol,
      base: candidate.base,
      quote: candidate.quote,
      last_px: candidate.last_px,
      change_pct_24h: candidate.change_pct_24h,
      change_pct_1h: candidate.change_pct_1h,
      quote_vol_24h: candidate.quote_vol_24h,
      liquidity_usd: candidate.liquidity_usd,
      features: candidate.features,
      prescreen_score: candidate.score,
    },
    current_params: params,
    recent_track_record: recentJournal,
  };

  const t0 = Date.now();
  const resp = await client.messages.create({
    model: config.modelDecide,
    max_tokens: 1024,
    system,
    tools: [DECIDE_TOOL],
    tool_choice: { type: "tool", name: "decide_trade" },
    messages: [
      {
        role: "user",
        content: `Evaluate this candidate. Return your decision via the decide_trade tool.\n\n${JSON.stringify(userPayload, null, 2)}`,
      },
    ],
  });
  const latency = Date.now() - t0;
  const decision = extractToolUse(resp, "decide_trade");

  logAiCall({
    kind: "decide",
    model: config.modelDecide,
    input: userPayload,
    output: decision,
    latencyMs: latency,
  });

  if (!decision) {
    log.warn("decideTrade: no tool_use returned", resp);
    return { action: "skip", confidence: 0, thesis: "no decision returned" };
  }
  return decision;
}

export async function decideExit({ position, currentPx, recentPxs }) {
  const pnl_pct = ((currentPx - position.entry_px) / position.entry_px) * 100;
  const heldMin = (Date.now() - position.ts_open) / 60_000;

  const system = `You manage an open short-horizon crypto position. Decide exit vs hold. Default to 'hold' unless: thesis is broken, momentum reversed, or PnL is decaying near the stop. You can also propose tightening the stop-loss to lock gains.`;

  const userPayload = {
    position: {
      symbol: position.symbol,
      entry_px: position.entry_px,
      tp_pct: position.tp_pct,
      sl_pct: position.sl_pct,
      max_hold_min: position.max_hold_min,
      ai_thesis: position.ai_thesis,
    },
    current: {
      px: currentPx,
      pnl_pct: round2(pnl_pct),
      held_minutes: round2(heldMin),
      recent_prices: recentPxs,
    },
  };

  const t0 = Date.now();
  const resp = await client.messages.create({
    model: config.modelDecide,
    max_tokens: 512,
    system,
    tools: [EXIT_TOOL],
    tool_choice: { type: "tool", name: "decide_exit" },
    messages: [
      {
        role: "user",
        content: `Should we exit? Use the decide_exit tool.\n\n${JSON.stringify(userPayload, null, 2)}`,
      },
    ],
  });
  const latency = Date.now() - t0;
  const decision = extractToolUse(resp, "decide_exit");

  logAiCall({
    kind: "exit",
    model: config.modelDecide,
    input: userPayload,
    output: decision,
    latencyMs: latency,
  });

  return decision ?? { action: "hold", reason: "no decision" };
}

function round2(x) {
  return Math.round(x * 100) / 100;
}
