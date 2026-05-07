# PixelDiff - Design QA Agent

## One-line pitch
Percy for design teams: a Figma + GitHub plugin that auto-flags every visual gap between the latest Figma design and the deployed PR preview.

## Target user
Frontend engineers and design-system leads at 10-100 person product teams (Series A/B SaaS) where designers and engineers fight weekly over "this doesn't match the design."

## Core feature (v1)
GitHub Action runs on every PR. Pulls latest Figma frame via API, screenshots the deployed Vercel/Netlify preview, runs an LLM-vision diff (spacing, color, typography, components), posts a PR comment with annotated screenshots and a fix list. Slack notification.

## Distribution wedge
Figma Community plugin (organic) + Vercel integration marketplace. r/webdev (1.5M), r/Frontend, Designer Hangout Slack, Friends of Figma communities. Plus paid sponsor on Bytes.dev newsletter (~150k devs).

## Pricing model
Free for personal/OSS. $49/mo per repo for teams, $199/mo for 5+ repos, $499/mo for unlimited + design-system rules.

## Path to $10k MRR in 60 days
50 teams at avg $200 = $10k. Figma plugin + Vercel marketplace listings drive thousands of installs in 30 days; 10% upgrade from free trial. Bytes.dev sponsorship typically 0.5% conversion = 750 trials.

## Build effort
12 days. Figma API + Playwright screenshots + Claude Vision + GitHub Actions wrapper.

## Tech stack suggestion
TypeScript + Figma REST API + Playwright + Claude Sonnet (vision) + GitHub Actions + Stripe.

## Why now
Claude/Gemini vision became reliable enough in 2025 to do pixel-level visual diffs that aren't false-positive hell. Vercel's Build Output API (2024) makes preview URL fetch trivial. Design-engineering review is a top-10 dev complaint on r/webdev.

## Defensibility
Design-system rule tuning per customer (component-level tolerances) creates lock-in. Figma plugin marketplace ranking. GitHub Marketplace listing (verified status takes weeks).

## Sources / references
- https://entrepreneurloop.com/profitable-saas-startup-ideas-2026/
- https://www.creem.io/blog/ai-saas-ideas-making-money-2026
- https://www.greensighter.com/blog/micro-saas-ideas
