# MentionIQ - LLM Rank Tracker

## Why this won

| Criterion | Score |
|---|---|
| Buildability <30d | 5 |
| Distribution wedge | 4 |
| WTP credibility | 5 |
| 60-day MRR math | 4 |
| Defensibility | 3 |
| **Total** | **21 / 25** |

- Gate A (named channel): PASS. r/SEO (700k), r/bigseo, named SEO newsletters with bookable sponsorship slots (Marketing Brew, Detailed, Growth.Design), Twitter/X SEO community.
- Gate B (peer proof): PASS. Profound raised $20M Series A late 2025; Otterly, Peec, and BrandRank.AI are all live and charging $300-2,000/mo. Category is validated.
- Gate C (60-day math): PASS. Only 35 customers at $290 avg needed - the smallest customer count of any winner. SEO audiences convert measurably on tools at this price tier; sponsorship math (3 newsletters x $1.5k = $4.5k spend, returning ~30 paid customers at $290) breaks even quickly and compounds.
- Gate D (no missing network): PASS. Newsletter sponsorships are paid, no relationship needed; subreddits are public; free-audit lead magnet is self-serve.

What sealed this: the customer count to hit $10k MRR is tiny (35), the existing competitors are all priced 2-5x higher leaving an obvious indie wedge, and "AEO" is the most-asked CMO question in 2026 - every SEO newsletter is desperate to feature tooling in the space.

## Sharpened concept

- Productized name: MentionIQ
- Target: in-house SEO / content / growth leads at $1M-$50M ARR B2B SaaS companies who've watched 30% of organic search shift to LLM answers
- Wedge: under Profound's $500/mo floor, with a vertical buyer-intent prompt library nobody else has
- v1 features: daily fanout of 50-1,000 buyer-intent prompts across ChatGPT, Claude, Gemini, Perplexity; brand mention + citation tracking; sentiment; competitor diff; auto-generated content briefs targeting prompts where the customer is invisible; weekly Slack digest.

## Offer / pricing

- Starter $99/mo: 50 prompts daily, 3 competitors, weekly digest
- Growth $299/mo: 250 prompts, sentiment, content briefs, Slack integration
- Agency $799/mo: 1,000 prompts, white-label, multi-brand
- Free brand audit lead magnet (one-time scan of 25 prompts) gates entry

## 60-day execution plan

Week 1-2 (Build): Next.js + Postgres + ClickHouse for time-series mention data. LLM API fanout layer with retries and per-provider rate-limit handling. Prompt templates seeded from Reddit + G2 questions in 5 verticals (CRM, marketing automation, dev tools, fintech, HR tech). Free-audit landing page that runs 25 prompts and emails a PDF report. Stripe.

Week 3-4 (Launch): Free brand audit goes live week 3. Drop in r/SEO with "I scanned how 200 SaaS brands rank in ChatGPT - data inside" - the data IS the post. Submit Detailed and Marketing Brew sponsorship slots for week 4 (book in week 1). Tweet thread of unexpected findings (e.g. "Salesforce mentioned in 47% of CRM prompts in ChatGPT - here's who's missing"). Aim: 1,500 free-audit signups.

Week 5-6 (Convert): Each free audit ends with a paywall: "your competitor X is mentioned 3x more often - track weekly with MentionIQ for $99/mo". Personal email follow-up to every free-audit user from a B2B SaaS company. Land 4 agencies on $799/mo white-label by cold-DMing SEO agency owners on LinkedIn with their own brand audit. Target: 20 paid.

Week 7-8 (Scale to $10k): Sponsor third newsletter (Growth.Design). Launch public "AEO Visibility Index" - quarterly leaderboard ranking SaaS brands by LLM citation share. Drives organic backlinks and free-audit signups. Add ChatGPT Search and SearchGPT-specific tracking as differentiator. Target: 35 paid.

## First 10 customers playbook

- Channels: free brand audit landing page promoted in r/SEO weekly thread, paid Detailed newsletter sponsorship, direct LinkedIn DM to Heads of Content/SEO at SaaS companies between $5-50M ARR.
- Personas: Head of Content at Series B SaaS who is being asked "how do we rank in ChatGPT?"; SEO agency owner managing 5-15 SaaS clients (white-label target).
- Outreach script: (1) "I ran a free LLM-visibility audit on [their company] - here are the prompts you don't show up for" (attach actual report), (2) one-line on what their #1 competitor is doing differently, (3) "$99/mo to track weekly + content briefs to fix it - 14-day trial".

## Risks & mitigations

- Most likely failure: Profound or Otterly launches a $99 starter tier and competes on the same price point - mitigate by building a vertical (B2B SaaS) prompt library and brand voice that horizontal players will not invest in.
- LLM API costs explode at 1,000 prompts/day x 4 providers x 250 customers - design caching aggressively, batch overnight, and use Haiku/Mini-tier models for non-final scoring; budget $0.30/customer/day at Growth tier.
- Free brand audit traffic doesn't convert: build the audit such that the most painful gap is paywalled (e.g. "see all 47 prompts where you lose to competitors - upgrade to view").

## Source idea file

/home/user/demo-app-2/round3/ideas/09-llm-seo-rank-tracker.md
