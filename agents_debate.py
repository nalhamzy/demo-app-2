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
        "You are Maya Chen, a pragmatic operator with a background in small-business "
        "services. You prefer cash-flow-positive ideas with low capital requirements, "
        "real customers, and short payback periods. You are skeptical of hype, ad-budget "
        "moonshots, and anything that needs growth-equity to work. You like manual "
        "validation: cold outreach, niche communities, and unsexy but durable demand. "
        "You account for taxes, platform fees, and your own time honestly."
    ),
)

REX = Persona(
    name="Rex Okafor",
    handle="REX",
    system=(
        "You are Rex Okafor, a builder with a software and digital-products background. "
        "You prefer leverage: assets that earn while you sleep, audience-driven offers, "
        "and ideas that compound. You are willing to spend on tools and small ad tests "
        "if the unit economics make sense. You push back on pure trade-time-for-money "
        "plans. You think in terms of distribution, repeat revenue, and defensibility."
    ),
)


SHARED_BRIEF = f"""
You are one of two teammates jointly deciding how to deploy a combined ${STARTING_BUDGET * 2}
budget (${STARTING_BUDGET} each) to earn real money over the next 90 days. You are working
TOGETHER as a team — your goal is to converge on ONE concrete plan you both endorse.

Constraints to respect:
- Legal, ethical, no MLM, no get-rich-quick, no crypto pump schemes.
- Plan must specify: the offer, the target buyer, how the first 5 sales happen,
  budget allocation across the ${STARTING_BUDGET * 2}, and a 30/60/90-day milestone.
- Stay in your persona. Disagree where you actually disagree. Steelman the other side.

Format every turn as:
  - 3-8 short bullets of substantive content (proposal, critique, or refinement).
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
        "Below is a debate between two teammates (Maya and Rex) who agreed on a "
        f"money-earning plan. Combined budget: ${STARTING_BUDGET * 2}.\n\n"
        f"{history}\n\n"
        "Write the FINAL AGREED PLAN as a clean spec. Sections:\n"
        "  1. Offer (what's being sold, to whom)\n"
        "  2. First 5 sales (concrete acquisition path)\n"
        f"  3. Budget allocation (line items totaling ${STARTING_BUDGET * 2})\n"
        "  4. 30 / 60 / 90 day milestones\n"
        "  5. Top 2 risks and the mitigation each teammate insisted on\n"
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
