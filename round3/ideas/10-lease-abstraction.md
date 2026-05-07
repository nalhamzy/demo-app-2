# LeaseLens - AI Lease Abstraction

## One-line pitch
Harvey for commercial-real-estate leases: drop in a 90-page lease PDF, get a structured abstract with key dates, options, escalations, and red flags in 4 minutes.

## Target user
Boutique commercial real-estate brokerages (5-50 brokers) and in-house lease administrators at mid-market companies (100-1000 employees) who currently pay paralegals $80/hr to abstract leases manually.

## Core feature (v1)
Upload PDF (or batch). Outputs: standardized abstract (rent, term, options, CAM, exclusivity, assignment), color-coded risk flags (auto-renewals, kick-out, hidden escalators), and an Excel export matching the customer's existing template.

## Distribution wedge
LinkedIn (sales nav targeting CRE lease admins, paralegals at law firms with CRE practices), CCIM Institute member directory (15k commercial brokers), and r/commercialrealestate. Cold-email 1,000 SIOR-listed brokers.

## Pricing model
$199/mo for 20 leases, $499/mo for 75, $1,499/mo unlimited team. Or $39/lease pay-as-you-go.

## Path to $10k MRR in 60 days
25 customers at avg $400 = $10k. Lease abstraction services charge $300-800 per lease today; a $39/lease offer is 5-10x cheaper. 1,000 cold emails at 8% reply, 30% trial, 30% close = ~25 paying.

## Build effort
12 days. Just LLM extraction + Excel templating + Stripe. No portal RPA needed.

## Tech stack suggestion
Next.js + Claude Sonnet (long-context) + Unstructured.io for OCR + Supabase + SheetJS for XLSX export.

## Why now
Long-context LLMs (Claude 200k, Gemini 2M) crossed the threshold for full-lease ingestion in 2025 with reliable accuracy. CRE downturn 2024-2025 means companies are renegotiating en masse and need fast abstracts. Healthcare/legal compliance niches command $99-500/mo per Lovable's 2026 audit.

## Defensibility
Per-customer Excel template library (very high switching cost - admins won't redo formatting). Risk-flag rule library curated by jurisdiction. Two-way Yardi/MRI integrations as expansion lock-in.

## Sources / references
- https://qubit.capital/blog/rise-vertical-saas-sector-specific-opportunities
- https://lovable.dev/guides/micro-saas-ideas-for-solopreneurs-2026
- https://automaiva.com/vertical-saas-ai-agents-2026/
