# MediaMatch - Reporter Pitch Agent

## One-line pitch
Qwoted + Muck Rack for solopreneurs: an AI agent that monitors HARO/Connectively/Featured + journalist tweets, drafts a personalized pitch, and emails it from your domain in under 90 seconds.

## Target user
Solo founders, indie consultants, and 1-5 person PR-curious B2B SaaS teams who want press but can't afford $1k-$5k/mo PR retainers or $300/mo Muck Rack seats.

## Core feature (v1)
Onboarding captures the user's expertise areas + 3 sample wins. Agent ingests HARO/Connectively/Featured queries 3x daily, ranks fit, drafts a tailored pitch quoting the user's prior wins, sends from their domain via Resend (with SPF/DKIM setup wizard).

## Distribution wedge
r/PublicRelations, r/Entrepreneur, r/SaaS, r/marketing. Twitter/X PR community. Direct partnership with 5 SaaS-newsletter writers (Lenny, Demand Curve, Marketing Examined) to mention to their audiences. Free tier: 10 pitches/mo.

## Pricing model
$39/mo for 50 pitches, $99/mo for unlimited + journalist Twitter monitoring, $299/mo for teams + custom domains.

## Path to $10k MRR in 60 days
150 customers at avg $70 = $10,500. r/Entrepreneur posts about "I got featured in [Forbes/TechCrunch]" hit 1,000+ upvotes regularly. Free-tier conversion at 10% over 30 days from 5,000 signups is realistic with one viral case study.

## Build effort
9-11 days. HARO/Connectively/Featured scrapers + LLM pitch + email send.

## Tech stack suggestion
Next.js + Claude Sonnet + Resend (with domain auth wizard) + Supabase + Stripe.

## Why now
HARO died in 2024; Featured/Connectively/Qwoted fragmented the market. Journalists are more reachable than ever via X but no consolidated tool exists at indie price-point. Muck Rack is enterprise-priced. Solo founders' #1 ask in r/SaaS: "how do I get press without spending $5k/mo?"

## Defensibility
Outcome database (which pitches got published) becomes a personalization edge. Journalist preference profiles (built from public reply patterns) compound over time. Email-deliverability domain-warming as an integrated feature is non-trivial to clone.

## Sources / references
- https://www.subredditsignals.com/blog/best-subreddits-to-promote-a-tech-product-in-2026-rules-real-examples-and-outreach-tips-that-don-t-get-you-banned
- https://www.creem.io/blog/ai-saas-ideas-making-money-2026
- https://www.indiehackers.com/post/this-week-in-micro-saas-chrome-extension-making-9k-mrr-and-more-ce34f97ab7
