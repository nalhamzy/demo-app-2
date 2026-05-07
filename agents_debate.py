"""Two-agent debate: pick a real money-earning strategy, $1k each, $2k team budget."""

import os
import sys
from dataclasses import dataclass

import anthropic

MODEL = "claude-opus-4-7"
MAX_ROUNDS = 12
STARTING_BUDGET = 1000
AGREEMENT_TOKEN = "[AGREED]"


@dataclass
class Persona:
    name: str
    handle: str
    system: str


MAYA = Persona(
    name="Maya Chen",
    handle="MAYA",
    system=(
        "You are Maya Chen, a pragmatic ops operator. You think in terms of unit "
        "economics, payback period, and what actually breaks at 3am. For an "
        "agent-run business you obsess over: per-task model cost vs. price, "
        "fail-safe review queues, refund and dispute handling, payment-processor "
        "risk (Stripe holds, chargebacks), and whether the agents can REALLY "
        "handle edge cases or whether the human ends up babysitting them. You are "
        "skeptical of 'AI agent' brochures and demand the boring plumbing work. "
        "You prefer narrow niches with verifiable buyer demand over broad horizontal plays."
    ),
)

REX = Persona(
    name="Rex Okafor",
    handle="REX",
    system=(
        "You are Rex Okafor, a builder. You think in terms of leverage, compounding "
        "assets, distribution, and defensibility. For an agent-run business you push "
        "for: recurring/usage-based revenue over one-shot work, agent-driven "
        "acquisition (programmatic SEO, automated outbound that's actually relevant, "
        "API/marketplace distribution), and offers where the agent stack itself is "
        "the moat. You'll spend on tools and small experiments if the unit economics "
        "support it. You push back on plans that secretly require human grunt work "
        "or that cap out at trading time for money."
    ),
)


SHARED_BRIEF = f"""
You are one of two teammates jointly deciding how to deploy a combined ${STARTING_BUDGET * 2}
budget (${STARTING_BUDGET} each) to launch a business that AI AGENTS RUN END-TO-END and
that produces REVENUE EVERY DAY. You are working TOGETHER — converge on ONE plan you both
endorse.

Hard constraints (these are the point of the exercise — do not relax them):
- Agents must do the work. The full operating loop — lead-gen, outreach, fulfillment,
  delivery, support, billing, retention — must run on AI agents + APIs + automation.
  Human time should be supervisory only (review queue, exception handling, key rotation),
  budgeted at <= 30 minutes/day on average.
- Daily revenue, not lumpy. The offer must produce paying transactions on most days
  by day 30 (subscriptions, usage-based fees, marketplace take rate, per-task pricing,
  scheduled deliverables, etc.) — not a single launch spike.
- You have ${STARTING_BUDGET * 2} total. Account for: API/model costs, hosting/infra,
  paid tools, ad or seeding spend, payment-processor fees, and a reserve.
- Legal and ethical. No MLM, no spammy outreach, no fake reviews, no scraping that
  violates ToS, no "just resell GPT wrappers with no value," no get-rich-quick.

Plan must specify:
1. The offer (what the agents produce/do, who pays, pricing model, daily-revenue mechanic).
2. The agent stack: which agents exist, what each one does, what tools/APIs/MCP servers
   they call, where the human review queue lives, what triggers escalation.
3. First 10 paying customers — concretely, where do they come from on day 1-14, and is
   acquisition itself agent-driven or seeded manually?
4. Budget allocation totaling ${STARTING_BUDGET * 2} (line items, including ongoing
   per-day run-rate so we know burn vs. revenue).
5. 30 / 60 / 90-day milestones, including a daily-revenue target for each checkpoint.
6. The single biggest failure mode and how the agent system catches it before the human
   has to.

Stay in persona. Disagree where you actually disagree. Steelman the other side.

Format every turn as:
  - 4-8 short bullets of substantive content (proposal, critique, or refinement).
  - Then a final line: STATUS: {AGREEMENT_TOKEN}  OR  STATUS: still negotiating

Only emit STATUS: {AGREEMENT_TOKEN} when you genuinely endorse the current plan as a
whole — not partial agreement, not "fine I guess." If you still want changes, say
"still negotiating" and name the change.
""".strip()


def turn_prompt(transcript: list[dict]) -> str:
    if not transcript:
        return (
            "Open the debate. Propose your initial plan: the offer, who it's for, "
            "and how the budget splits. Be specific and brief."
        )
    return (
        "Read the conversation so far. Respond in character: agree, refine, or "
        "counter-propose. If your teammate's latest proposal is good enough that "
        "you would commit to it as written, end with STATUS: [AGREED]."
    )


def render_transcript(transcript: list[dict]) -> str:
    return "\n\n".join(f"{t['handle']}:\n{t['text']}" for t in transcript)


def agent_turn(client: anthropic.Anthropic, persona: Persona, transcript: list[dict]) -> str:
    history = render_transcript(transcript) if transcript else "(no prior turns)"
    user_msg = (
        f"{SHARED_BRIEF}\n\n"
        f"--- Conversation so far ---\n{history}\n\n"
        f"--- Your turn ({persona.handle}) ---\n{turn_prompt(transcript)}"
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=persona.system,
        messages=[{"role": "user", "content": user_msg}],
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
    )

    text_parts = [b.text for b in response.content if b.type == "text"]
    return "\n".join(text_parts).strip()


def has_agreed(text: str) -> bool:
    last = text.strip().splitlines()[-1] if text.strip() else ""
    return AGREEMENT_TOKEN in last and "still negotiating" not in last.lower()


def finalize(client: anthropic.Anthropic, transcript: list[dict]) -> str:
    history = render_transcript(transcript)
    user_msg = (
        "Below is a debate between two teammates (Maya and Rex) who agreed on an "
        "agent-operated business that produces daily revenue. Combined budget: "
        f"${STARTING_BUDGET * 2}.\n\n"
        f"{history}\n\n"
        "Write the FINAL AGREED PLAN as a clean spec. Sections:\n"
        "  1. Offer — what the agents produce/do, target buyer, pricing model, and the\n"
        "     daily-revenue mechanic.\n"
        "  2. Agent stack — list each agent, its job, the tools/APIs it uses, and\n"
        "     where the human-review queue sits.\n"
        "  3. First 10 paying customers — concrete acquisition path for days 1-14,\n"
        "     and which parts are agent-driven vs. manually seeded.\n"
        f"  4. Budget allocation — line items totaling ${STARTING_BUDGET * 2}, plus\n"
        "     daily run-rate (API + infra + tools).\n"
        "  5. 30 / 60 / 90-day milestones, each with a daily-revenue target.\n"
        "  6. Biggest failure mode and how the agent system catches it before the\n"
        "     human has to.\n"
        "  7. The single concession each teammate insisted on before saying [AGREED].\n"
        "Be specific. No filler. Markdown."
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": user_msg}],
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
    )
    return "\n".join(b.text for b in response.content if b.type == "text").strip()


def main() -> int:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("error: ANTHROPIC_API_KEY not set", file=sys.stderr)
        return 1

    client = anthropic.Anthropic()
    transcript: list[dict] = []
    personas = [MAYA, REX]

    print(f"=== Debate: 2 agents, ${STARTING_BUDGET} each, target = real money in 90 days ===\n")

    last_two_agreed = [False, False]

    for round_idx in range(MAX_ROUNDS):
        speaker = personas[round_idx % 2]
        text = agent_turn(client, speaker, transcript)
        transcript.append({"handle": speaker.handle, "text": text})

        print(f"--- Round {round_idx + 1}: {speaker.name} ({speaker.handle}) ---")
        print(text)
        print()

        last_two_agreed[round_idx % 2] = has_agreed(text)
        if all(last_two_agreed) and round_idx >= 1:
            print("=== Both agents agreed. Closing debate. ===\n")
            break
    else:
        print(f"=== Hit MAX_ROUNDS={MAX_ROUNDS} without convergence. Forcing finalization. ===\n")

    print("=== FINAL AGREED PLAN ===\n")
    print(finalize(client, transcript))
    return 0


if __name__ == "__main__":
    sys.exit(main())
