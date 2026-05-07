# InboxCanary - Deliverability Monitor

## One-line pitch
Datadog for cold-email senders: monitors all your sending domains' deliverability, blacklists, and inbox-placement scores in one dashboard with Slack alerts.

## Target user
Outbound-sales teams and cold-email agencies running 5-50 sending domains (Smartlead, Instantly users) who lose pipeline when one domain silently goes to spam.

## Core feature (v1)
Connect domains via DNS + IMAP. Dashboard: per-domain SPF/DKIM/DMARC health, blacklist checks (15+ RBLs hourly), seed-test inbox placement (Gmail, Outlook, Yahoo), Slack alert when any score drops > 20%. Public status page per domain.

## Distribution wedge
r/coldemail (60k highly active), r/sales, the Smartlead/Instantly user Slacks (~30k members combined), and 5 cold-email YouTubers (Alex Berman, Ravi Abuvala niche). Affiliate 30%.

## Pricing model
$39/mo for 5 domains, $99/mo for 20, $249/mo for 100+. Agency white-label add-on $149/mo.

## Path to $10k MRR in 60 days
130 customers at avg $80 = $10,400. r/coldemail launch posts routinely hit 500+ upvotes; 30k Slack DMs over 4 weeks = enough trial volume. Agencies (5-10 clients each) buy $249 plans willingly.

## Build effort
8-10 days. RBL APIs + IMAP + DNS lookups + cron jobs.

## Tech stack suggestion
Go + Postgres + Cloudflare Workers cron + Mailgun seed accounts + Slack webhook + Stripe.

## Why now
Google + Yahoo Feb 2024 sender requirements (DMARC, one-click unsubscribe, spam rate <0.1%) made deliverability the #1 cold-email pain. Smartlead and Instantly hit $10M+ ARR but neither has a dedicated monitoring product. r/coldemail is the canonical pain-point subreddit.

## Defensibility
Historical reputation graphs per domain become hard to recreate. Multi-provider seed-account network (300+ Gmail/Outlook accounts) is operational moat. Smartlead/Instantly integrations as launch partners.

## Sources / references
- https://www.greensighter.com/blog/micro-saas-ideas
- https://www.subredditsignals.com/blog/best-subreddits-to-promote-a-tech-product-in-2026-rules-real-examples-and-outreach-tips-that-don-t-get-you-banned
- https://www.creem.io/blog/ai-saas-ideas-making-money-2026
