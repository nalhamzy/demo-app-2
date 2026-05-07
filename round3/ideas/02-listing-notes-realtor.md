# ListingNotes for Realtors

## One-line pitch
Otter.ai for residential real-estate agents: records buyer/seller calls and auto-drafts MLS listing copy, showing notes, and CRM follow-up emails in the agent's voice.

## Target user
Solo residential real-estate agents doing 12-40 transactions/year in the US, primarily Compass, eXp, KW, and independent brokerages who already pay $50-150/mo for tools like Follow Up Boss.

## Core feature (v1)
iPhone app + Chrome extension that records showings, buyer consults, and listing-presentation calls. Auto-generates: (1) MLS-compliant listing description, (2) agent-tone follow-up email, (3) CRM activity note pushed to Follow Up Boss/KvCORE via API.

## Distribution wedge
r/realtors (130k), Lab Coat Agents Facebook group (170k members), Tom Ferry coaching community, and TikTok #realtorlife creators with under 50k followers (DM partnerships).

## Pricing model
$59/mo per agent, $499/yr annual. Team plan $39/seat at 5+.

## Path to $10k MRR in 60 days
170 agents at $59 = $10,030. Plan: 20 demos/week x 8 weeks = 160 demos via Lab Coat Agents posts and TikTok DMs, 75% trial-to-paid given the universal pain. Backstop: revenue-share with one Tom Ferry coach for 50 agents on day one.

## Build effort
14 days. Whisper + Claude + a few prompt templates is most of it.

## Tech stack suggestion
Expo (React Native) + Whisper-large-v3 + Claude Sonnet + Supabase + Stripe.

## Why now
NAR settlement (2024) forced agents to write more buyer-rep agreements and document every interaction. Whisper-3 + on-device transcription on iOS 18 makes per-call cost near zero. Vertical AI for real estate is highlighted as a top-performing 2026 niche.

## Defensibility
Voice-cloned writing style per agent, two-way Follow Up Boss/KvCORE/Sierra integrations (each a 2-3 week build), and MLS-compliance prompts curated per state. Cloners face 50-state real-estate copy review.

## Sources / references
- https://www.creem.io/blog/ai-saas-ideas-making-money-2026
- https://entrepreneurloop.com/bootstrapped-saas-niches-solo-founders/
- https://lovable.dev/guides/micro-saas-ideas-for-solopreneurs-2026
