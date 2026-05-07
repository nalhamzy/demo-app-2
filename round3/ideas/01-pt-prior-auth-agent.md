# PT Prior-Auth Agent

## One-line pitch
Stripe-for-prior-authorizations: an AI agent that auto-fills, submits, and tracks insurance prior-auth packets for outpatient physical-therapy clinics.

## Target user
Solo and 2-5 location outpatient physical therapy clinic owners in the US (CPT 97xxx codes), specifically those still using fax + portals to fight UnitedHealthcare, Aetna, BCBS prior-auth.

## Core feature (v1)
Upload a patient evaluation PDF + insurance card, agent extracts ICD-10/CPT codes, fills the payer-specific prior-auth form (Availity, eviCore, NaviNet), submits via API or RPA, and posts status updates back into a Slack/email feed.

## Distribution wedge
r/physicaltherapy (210k members), r/ptschool, the WebPT and Heno user Facebook groups, and direct DM outreach to clinic owners listed in the APTA directory. Cold-loom video showing one packet auto-filed in 90 seconds.

## Pricing model
$249/clinic/month flat, plus $5 per submitted authorization beyond 50/mo. Annual prepay $2,490.

## Path to $10k MRR in 60 days
40 paying clinics x $249 = $9,960. Pipeline: 30 DMs/day x 30 days = 900 conversations, 10% demo rate (90 demos), 50% close = 45 paid. Anchor on the Slack-community founder who already hit $41k MRR in this exact niche - shows demand exists.

## Build effort
20-25 days solo. Forms + Availity API integrations are the long pole.

## Tech stack suggestion
Next.js + Supabase + Claude Sonnet for extraction + Browserbase for portal RPA + Stripe.

## Why now
2026 CMS rules require electronic prior-auth APIs at major payers (Jan 2026 mandate), Browserbase + Claude computer-use are stable enough to operate insurer portals reliably, and the AMA's 2025 survey put physician prior-auth burden at an all-time high.

## Defensibility
Per-payer form templates and a labeled corpus of accepted/denied packets become a proprietary dataset. Each clinic that joins improves payer-specific submission heuristics. Switching cost is high once the agent is wired into clinic EMR exports.

## Sources / references
- https://automaiva.com/vertical-saas-ai-agents-2026/
- https://www.indiehackers.com/post/2026-saas-market-report-key-insights-95423fc66b
- https://qubit.capital/blog/rise-vertical-saas-sector-specific-opportunities
