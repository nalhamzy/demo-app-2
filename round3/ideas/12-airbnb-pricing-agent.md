# PriceLabs Lite for Solo Hosts

## One-line pitch
PriceLabs/Wheelhouse for hosts with 1-3 listings: dynamic-pricing AI agent priced like Netflix, not enterprise software.

## Target user
Solo Airbnb / Vrbo hosts with 1-3 listings (the segment too small for PriceLabs' $20/listing fee + complexity) - especially weekend/cabin/lake-house owners who repriced manually in 2025.

## Core feature (v1)
Connect Airbnb/Vrbo via PMS API or scraper-fallback. Daily reprice with comp-set auto-detection (5-mile radius, similar bedrooms), local event boost (concerts, conferences via Ticketmaster + PredictHQ), min-stay optimization, gap-night discounts. SMS approval mode for cautious users.

## Distribution wedge
r/airbnb_hosts (130k), r/AirBnBHosts, BiggerPockets short-term-rental forums, and the STR Wealth Conference Facebook group. Plus 5 Airbnb-host TikTok creators (Avery Carl, Rob Abasolo audiences).

## Pricing model
$19/listing/mo (vs PriceLabs $20 + setup fee). $49/mo for up to 3 listings. 30-day free trial.

## Path to $10k MRR in 60 days
500 listings at $19 effective = $9,500 + ramp = $10k. Plan: each Reddit post reaches 50k+ views, 2% click, 10% trial, 30% paid = 60 listings per post. 8-10 posts + creators + BiggerPockets = doable.

## Build effort
12 days using existing comp-set scraping libraries + Anthropic for event-aware reasoning.

## Tech stack suggestion
Next.js + Python pricing engine + Hospitable/Hostaway API + PredictHQ event API + Stripe.

## Why now
2025 Airbnb saturation flipped pricing from "set and forget" to "must reprice daily." PriceLabs went upmarket in 2024 toward 50+ listing operators. Solo-host tier was abandoned. Reddit threads in r/airbnb_hosts begging for "PriceLabs but cheap" recur weekly.

## Defensibility
Per-zip-code pricing models trained on actual booking outcomes (improves with each customer). Event-data deal with PredictHQ as exclusive partner. Direct Hostaway/Hospitable PMS marketplace listings.

## Sources / references
- https://lovable.dev/guides/micro-saas-ideas-for-solopreneurs-2026
- https://www.greensighter.com/blog/micro-saas-ideas
- https://entrepreneurloop.com/profitable-saas-startup-ideas-2026/
