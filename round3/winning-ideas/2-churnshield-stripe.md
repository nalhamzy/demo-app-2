# ChurnShield for Stripe

## Why this won

| Criterion | Score |
|---|---|
| Buildability <30d | 5 |
| Distribution wedge | 5 |
| WTP credibility | 5 |
| 60-day MRR math | 4 |
| Defensibility | 3 |
| **Total** | **22 / 25** |

- Gate A (named channel): PASS. Stripe App Marketplace (the entire wedge - this is a real, organic-discovery channel as of 2024-26), plus r/SaaS, r/microsaas, MicroConf Slack.
- Gate B (peer proof): PASS. Churnkey hit ~$30k MRR serving the upper tier ($10k+ MRR companies); Stunning, Baremetrics dunning, and ProsperStack all live in adjacent territory.
- Gate C (60-day math): PASS. 100 customers at $100 avg = $10k MRR. Stripe App Marketplace genuinely drives 20-50 installs/day for featured apps; even at 10% upgrade past free tier from a slow ramp, the math holds.
- Gate D (no missing network): PASS. Self-serve install via Stripe Connect; no partnerships required.

The real magic here is distribution: Stripe App Marketplace is to Stripe customers what Shopify App Store is to Shopify merchants - you list once and Stripe markets you. Combined with a free tier under $1k MRR processed (massive top-of-funnel) and a clear upmarket migration path, this is the cleanest 60-day plan in the set.

## Sharpened concept

- Productized name: ChurnShield
- Target: indie/bootstrapped SaaS founders running $2k-$50k MRR on Stripe Billing - the long tail that Churnkey ignores at $200-500/mo
- Wedge: one-click Stripe Connect install, instant value (recovers a failed payment in week one), self-served pricing
- v1 features: smart card-retry scheduling (optimal day-of-week), branded recovery emails via Resend, customer-portal cancel-flow widget with LLM-personalized save offer (pause / discount / feature unlock per cohort), benchmark dashboard.

## Offer / pricing

- Free under $1k MRR processed (lead-gen tier)
- Starter $49/mo for $1k-$10k MRR processed
- Growth $149/mo for $10k-$50k MRR processed
- 5% of recovered revenue cap so customers always net positive
- Annual 2 months free

## 60-day execution plan

Week 1-2 (Build): Stripe App SDK skeleton, Stripe Connect OAuth, webhooks for invoice.payment_failed and subscription cancel, Resend email templates, cancel-flow widget (drop-in JS), Claude Haiku prompt for save-offer copy, Cloudflare Workers cron for retry scheduling. Submit to Stripe App Marketplace review (3-week pipeline starts week 1).

Week 3-4 (Launch): Stripe App listing goes live mid-week 4. Synchronously: launch on r/SaaS and r/microsaas with an "open metrics" post showing the first 5 beta customers' recovered revenue. Apply for MicroConf Slack feature. Sponsor one issue of Indie Hackers newsletter. Aim: 200 free-tier installs in week 4.

Week 5-6 (Convert): For every free-tier install, send automated "you would have recovered $X this month on the paid tier" upgrade nudge. Drop into 20 r/SaaS Stripe-related threads with case-study screenshots. Push for Stripe-blog inclusion (Stripe regularly features marketplace apps). Target: 40 paying.

Week 7-8 (Scale to $10k): Add Paddle and Lemon Squeezy support to widen TAM. Launch a free "churn calculator" interactive landing page that ranks on Google for "stripe failed payment recovery." Affiliate at 30% recurring via 10 indie founder newsletters. Target: 100 paying.

## First 10 customers playbook

- Channels: pre-launch beta from MicroConf Slack DMs, Twitter/X indie-hacker founders publicly posting MRR $2k-30k, r/SaaS DMs to OPs of "we got our first 100 customers" threads.
- Personas: solo founder of a B2B SaaS doing $5-20k MRR who has visibly complained about Stripe failed payments; creator-economy SaaS founders (high involuntary churn).
- Outreach script: (1) "I noticed your post about Stripe involuntary churn - I just shipped a free Stripe app that fixes this in one click", (2) screenshot of their projected recovery based on industry benchmark for their MRR band, (3) one-click install link, no demo, no call.

## Risks & mitigations

- Most likely failure: Stripe App Marketplace approval gets stuck in review past week 4, blowing the launch sequence - mitigate by starting Stripe App submission week 1 and prepping a shadow-launch via direct Stripe Connect OAuth (no marketplace dependency) as backup.
- Churnkey moves down-market: if Churnkey adds a $49/mo plan, the wedge collapses - mitigate by going deeper on indie-friendly UX (open metrics, transparent pricing, free under $1k MRR).
- Save-offer LLM hallucinates a discount that costs the merchant money: hard-cap discount rules in admin UI, never let the LLM generate a discount % outside a pre-approved range.

## Source idea file

/home/user/demo-app-2/round3/ideas/03-churnshield-stripe.md
