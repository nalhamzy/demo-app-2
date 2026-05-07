# InboxCanary - Cold-Email Deliverability Monitor

## Why this won

| Criterion | Score |
|---|---|
| Buildability <30d | 5 |
| Distribution wedge | 5 |
| WTP credibility | 5 |
| 60-day MRR math | 4 |
| Defensibility | 3 |
| **Total** | **22 / 25** |

- Gate A (named channel): PASS. r/coldemail (60k highly active members), Smartlead user Slack, Instantly user Slack, named YouTubers (Alex Berman, Ravi Abuvala) - this is the canonical pain-point watering hole.
- Gate B (peer proof): PASS. MailReach, GlockApps, and Folderly are all profitable indie/SMB deliverability tools today; cold-email teams pay $40-$300/mo for monitoring already.
- Gate C (60-day math): PASS. 130 customers at $80 avg = $10.4k MRR. r/coldemail launch posts routinely hit 500+ upvotes, and ~30k combined Slack members give realistic DM volume; agencies buying $249 white-label are repeatable.
- Gate D (no missing network): PASS. Wedge is public communities and self-serve installs; no enterprise partnerships required.

This is the highest-conviction bet: tiny build, hottest pain in the most-organized buyer subreddit on the internet, peer pricing already proven, and the defense is operational (seed-account network, historical reputation graphs) rather than purely technical.

## Sharpened concept

- Productized name: InboxCanary
- Target: outbound-sales teams + cold-email agencies running 5-50 sending domains, mostly Smartlead or Instantly users
- Wedge: the moment a domain silently drops to spam, pipeline dies; competitors only check at send time, not continuously
- v1 features: per-domain SPF/DKIM/DMARC health, hourly RBL checks (15+ blacklists), Gmail/Outlook/Yahoo seed-test inbox-placement scoring, Slack alert on >20% drop, public per-domain status page, agency white-label.

## Offer / pricing

- Starter $39/mo: 5 domains, hourly checks, Slack alerts
- Growth $99/mo: 20 domains + seed-test inbox placement
- Agency $249/mo: 100+ domains + white-label dashboards
- Add-on white-label branding $149/mo
- 14-day free trial, no card

## 60-day execution plan

Week 1-2 (Build): Ship Go backend with cron jobs hitting RBLs (Spamhaus, Barracuda, SORBS), DNS lookups for SPF/DKIM/DMARC, IMAP poller for 30 seed accounts across Gmail/Outlook/Yahoo, Slack webhook alerts, simple Next.js dashboard, Stripe billing. Get to 5 self-served beta installs from personal network and r/coldemail beta thread.

Week 3-4 (Launch): Coordinated launch - one r/coldemail "I built X because I lost a $40k client to spam folder" post, paid mention in two Smartlead/Instantly Slack channels, sponsored mention in Alex Berman's newsletter, ProductHunt with deliverability angle. Free public deliverability score tool as lead magnet at canary.tools/check.

Week 5-6 (Convert): 1:1 onboarding for first 50 trials - Loom walkthroughs setting up monitoring on their actual domains. Push agency white-label upsell aggressively to anyone managing 3+ client domains. Add Smartlead and Instantly OAuth integrations to remove manual setup friction.

Week 7-8 (Scale to $10k): Affiliate program at 30% recurring through r/coldemail mods + 5 named YouTubers. Launch Smartlead/Instantly marketplace listings. Publish weekly "deliverability state of the union" report with real anonymized data - ranks on Google + gets reshared in cold-email Slacks.

## First 10 customers playbook

- Channels: r/coldemail launch post + AMA, Smartlead user Slack #tools channel, Instantly Discord #integrations, direct DM to top 50 cold-email agency owners listed on Clay/RB2B's public lists.
- Personas: agency owner running 5-30 client domains (highest pain, $249 plan target); SDR-team lead at $5-50M ARR SaaS (Growth plan target).
- Outreach script structure: (1) one-line hook citing their public LinkedIn/Twitter post about deliverability, (2) "I built a hourly monitor for your X domains, here's a free 14-day pre-loaded with your domains" - free setup is the close, (3) Loom of their actual dashboard already populated.

## Risks & mitigations

- Most likely failure: MailReach or GlockApps adds a Slack-alert tier and undercuts on pricing - mitigate by going deeper on agency white-label and Smartlead/Instantly native integrations they will not prioritize.
- Seed-account procurement risk: maintaining 300+ live Gmail/Outlook accounts is operational drag - partner with an existing seed-account vendor (e.g. Mailreach API or build a residential gmail farm) before launch.
- Reddit promo throttling: r/coldemail mods restrict self-promo - earn karma first by answering 20 deliverability questions in week 1-2 before launching.

## Source idea file

/home/user/demo-app-2/round3/ideas/11-cold-email-warmer.md
