# QuoteBot for Plumbers

## One-line pitch
Houzz Pro for solo plumbers: text-message quote agent that turns photos and a customer SMS into a same-day estimate, deposit link, and Google Calendar booking.

## Target user
Solo and 2-truck residential plumbers in the US/Canada doing $200k-$1M/yr who currently quote via phone and lose 30-50% of leads to slow response.

## Core feature (v1)
Customer texts the plumber's business number with photo + problem. Agent classifies the job (water heater, drain, leak), pulls regional labor rates, drafts a $X-Y range quote, sends Stripe deposit link, and books a slot in Google Calendar - all under 5 minutes.

## Distribution wedge
r/plumbing (180k), r/plumbers, r/Skookum, plus the Service Titan and Jobber Facebook groups (where smaller plumbers complain Service Titan is too expensive at $400+/mo). Cold direct mail to 2,000 plumber LLCs from state license databases.

## Pricing model
$99/mo flat, plus $1 per quote sent (free quotas: 50/mo). $999/yr.

## Path to $10k MRR in 60 days
100 plumbers at $99 = $9,900. Plan: 30 cold-mailers/day x 30 days, 5% reply, 50% close = ~22 paid. Plus 2 Reddit posts that hit front of r/plumbing easily convert another 80.

## Build effort
12-15 days. Twilio SMS + Claude vision + Stripe + Google Calendar API.

## Tech stack suggestion
Next.js + Twilio + Claude Sonnet (vision) + Stripe + Google Calendar API + Supabase.

## Why now
Trades labor shortage = every minute on the phone is lost revenue. Claude vision crossed the threshold for parts identification in 2025. SMS-first agents (vs apps) match how trades actually work. Underserved per Lovable's 2026 audit ($30-150/mo willingness-to-pay confirmed).

## Defensibility
Regional labor-rate database + parts-cost feed (Ferguson API) is proprietary after 2-3 months. Per-trade prompt tuning (HVAC and electrical adjacent expansions). Trades distrust new vendors; first-mover stickiness is real.

## Sources / references
- https://lovable.dev/guides/micro-saas-ideas-for-solopreneurs-2026
- https://superframeworks.com/articles/untapped-underserved-micro-saas-niches
- https://qubit.capital/blog/rise-vertical-saas-sector-specific-opportunities
