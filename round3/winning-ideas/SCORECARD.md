# Round 3 Scorecard

Sub-scores 1-5 each. Gate columns: P = pass, F = fail. Winners require total >=21 AND all four gates pass.

| Rank | # | Idea | Build | Distrib | WTP | Math | Moat | Total | A | B | C | D | Winner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 11 | InboxCanary - Deliverability | 5 | 5 | 5 | 4 | 3 | 22 | P | P | P | P | YES |
| 1 | 3 | ChurnShield for Stripe | 5 | 5 | 5 | 4 | 3 | 22 | P | P | P | P | YES |
| 3 | 9 | MentionIQ - LLM Rank Tracker | 5 | 4 | 5 | 4 | 3 | 21 | P | P | P | P | YES |
| 4 | 6 | ReplyOps for Shopify Reviews | 5 | 5 | 4 | 3 | 3 | 20 | P | P | F | P | no |
| 4 | 15 | RebookAI for Med Spas | 4 | 4 | 5 | 3 | 4 | 20 | P | P | F | P | no |
| 6 | 5 | NoteScribe for Therapists | 3 | 4 | 5 | 3 | 4 | 19 | P | P | F | P | no |
| 6 | 10 | LeaseLens - Lease Abstraction | 5 | 3 | 5 | 3 | 3 | 19 | P | P | F | P | no |
| 8 | 1 | PT Prior-Auth Agent | 3 | 3 | 5 | 2 | 5 | 18 | P | P | F | P | no |
| 8 | 2 | ListingNotes for Realtors | 5 | 4 | 4 | 3 | 2 | 18 | P | P | F | F | no |
| 8 | 4 | PromptStash Chrome Extension | 5 | 5 | 3 | 3 | 2 | 18 | P | P | F | P | no |
| 8 | 8 | ClipMint for B2B Podcasters | 4 | 4 | 4 | 3 | 3 | 18 | P | P | F | P | no |
| 8 | 14 | PixelDiff - Design QA | 4 | 4 | 4 | 3 | 3 | 18 | P | P | F | P | no |
| 13 | 7 | QuoteBot for Plumbers | 4 | 3 | 3 | 2 | 3 | 15 | P | P | F | P | no |
| 13 | 12 | PriceLabs Lite for Solo Hosts | 3 | 4 | 3 | 2 | 3 | 15 | P | P | F | P | no |
| 13 | 13 | MediaMatch - PR Pitch Agent | 5 | 3 | 3 | 2 | 2 | 15 | P | P | F | F | no |

## Why I disqualified the near-misses

**#6 ReplyOps for Shopify Reviews (20)**: failed Gate C. Hitting 130 paying Shopify stores in 60 days requires "1,000 installs in 30 days" of a brand-new app, and Shopify App Store featured slots are not granted to fresh apps without traction. Without a featured slot the install rate is closer to 50-150/month, and the 13% paid conversion rate is also high for review-automation apps where free competitors abound. The math is honest but optimistic by a factor of 2-3x; that breaks the 60-day window.

**#15 RebookAI for Med Spas (20)**: failed Gate C. Med spa owners have 3-6 week buying cycles even when they want the product - Boulevard/Mindbody integrations require credentialing reviews, owners go on training trips, and many delegate evaluation to a manager. The plan calling for "100 cold emails/day x 8% reply x 30% close = 70 paid in 30 days" assumes salon-grade conversion rates that med spa enterprise sales never deliver. This is a great 6-month idea, not a 60-day one.

**#5 NoteScribe for Therapists (19)**: failed Gate C. HIPAA BAA paperwork with AWS alone takes 2-3 weeks; the 18-22 day build estimate is borderline impossible if BAA isn't pre-secured. More importantly, group-practice deals (5 cited as the linchpin) require committee-style buying, owner approval, and IT review - rarely closing in <30 days. Solo therapist conversion is the safer path but the math doesn't work without group deals.

**#10 LeaseLens (19)**: failed Gate C. CRE buying cycles for any new vendor are 60-120 days. Cold-emailing 1,000 SIOR brokers and expecting 25 paying customers ($199-1,499 plans) inside 60 days underestimates compliance review, IT approval, and "we already have a paralegal" inertia. CRE customers also notoriously do trials but delay signing - this product wins in months 4-12, not month 2.

**#1 PT Prior-Auth Agent (18)**: failed Gate C. The cited $41k MRR peer (real and impressive) took 14 months, not 60 days. Healthcare cold-DM sales cycles average 30-60 days because of HIPAA review, billing-manager involvement, and EMR integration concerns. 50% close-rate on cold DMs to clinic owners in 30 days is fantasy; realistic is 10-15%. Defensibility is the highest of any idea here, but speed-to-revenue fails.

**#2 ListingNotes for Realtors (18)**: failed Gates C and D. Gate D fail: the plan name-drops a "backstop revenue-share with one Tom Ferry coach for 50 agents on day one" - that relationship doesn't exist for a no-name founder, and Tom Ferry coaches are gatekept. Gate C: 75% trial-to-paid is implausible in real estate where adoption is famously slow and competing AI scribes (Otter, Sybill, Notable) are encroaching.

**#4 PromptStash (18)**: failed Gate C. The cited proof point (Easy Folders $3.7k MRR) took 6 months. To hit $10k MRR in 60 days at $7/mo requires 1,500 paying users - i.e. ~50,000 installs at 3% conversion, in 60 days, with no marketing budget. That's the SaaS equivalent of "go viral on TikTok" planning. Plus the moat score is genuinely 2 - prompt managers are weekend clones with multiple existing competitors (PromptHub, AIPRM, FlowGPT).

**#8 ClipMint (18)**: failed Gate C. Opus Clip is the cited peer, well-funded ($20M), and they already serve B2B podcasters with their newer plans. Listen Notes top-500 outreach math (500 emails, 15% reply, 30% trial, 50% paid) yields ~11 customers - the rest of the 85 must come from "Reddit + newsletter sponsorships" without a specific number. Math doesn't quite close.

**#14 PixelDiff (18)**: failed Gate C. Team buying for a $200 avg plan in 60 days has multi-stakeholder lag (frontend lead, design lead, eng manager). Bytes.dev sponsorships convert at <0.5% to paid in 60 days for B2B dev tools. 50 teams paying in 60 days from a fresh launch is aggressive.

**#13 MediaMatch PR Agent (15)**: failed Gates C and D. Gate D - "partnership with Lenny/Demand Curve/Marketing Examined" is name-checked as a wedge but those newsletters do not partner with no-name founders without paid placements. Gate C - relies on "one viral case study" to drive 5,000 free signups + 10% conversion. Virality assumption violates the rubric explicitly.

The most defensible bets all clustered in software-only, self-serve, marketplace-distributed spaces: Stripe App Marketplace, hot subreddits like r/coldemail, and paid SEO newsletter sponsorship. Vertical AI for healthcare/CRE/real estate looks hot on paper but the sales-cycle math punishes the 60-day window.
