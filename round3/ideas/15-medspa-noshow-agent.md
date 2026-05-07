# RebookAI for Med Spas

## One-line pitch
SMS retention agent for med spas: auto-rebooks no-shows, fills cancellations from a waitlist, and runs win-back campaigns - integrated with Boulevard, Mindbody, and Vagaro.

## Target user
Independent med spa and aesthetics-clinic owners (1-3 locations) doing $300k-$2M/yr revenue using Boulevard, Mindbody, or Vagaro. Botox + filler + laser practices.

## Core feature (v1)
Connect to scheduling system via API/OAuth. Triggers: (a) appointment cancelled - SMS waitlist with first-come booking link; (b) no-show - text + reschedule + auto-charge $50 fee; (c) lapsed client (no booking in 90 days) - personalized win-back text mentioning their last service.

## Distribution wedge
r/medspa, r/aesthetics, r/RNJobs (nurse-injectors), AmSpa member directory (3,000 spas), and the Boulevard / Mindbody Facebook user groups. Plus 5 medspa-coach Instagram creators (Cartessa Aesthetics, Modern Aesthetics).

## Pricing model
$199/mo flat per location, plus $0.05/SMS over 2,000/mo. Annual prepay $1,999.

## Path to $10k MRR in 60 days
55 locations at $199 = $10,945. AmSpa list of 3,000 spas: cold-email 100/day, 8% reply, 30% demo, 30% close = ~70 paid in 30 days. Coach affiliates fill the rest.

## Build effort
14 days. Boulevard/Mindbody/Vagaro APIs + Twilio + Stripe + Claude for win-back copy.

## Tech stack suggestion
Next.js + Twilio + Boulevard API + Mindbody API + Vagaro API + Stripe + Claude Haiku.

## Why now
Med spa industry hit $20B in 2025 and is forecast to double by 2030. Boulevard/Mindbody have native rebook tools but they suck at SMS-first - everyone in r/medspa complains. Twilio toll-free verification (2024) means SMS deliverability is finally reliable.

## Defensibility
Per-clinic SMS templates fine-tuned on response rates. Three deep PMS integrations (each 1-2 weeks). Clinic-owner referral network is tight - a few coaches cover 30% of independent spas.

## Sources / references
- https://qubit.capital/blog/rise-vertical-saas-sector-specific-opportunities
- https://lovable.dev/guides/micro-saas-ideas-for-solopreneurs-2026
- https://automaiva.com/vertical-saas-ai-agents-2026/
