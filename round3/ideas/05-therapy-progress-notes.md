# NoteScribe for Therapists

## One-line pitch
Heidi Health for solo mental-health therapists: HIPAA-compliant AI scribe that writes SOAP/DAP/BIRP progress notes during the session.

## Target user
Solo licensed clinical social workers (LCSWs), LMFTs, and psychologists with cash-pay or small-insurance practices using SimplePractice, TheraNest, or Jane App.

## Core feature (v1)
Mac/iOS recorder runs during the 50-min session, transcribes locally (no audio leaves device), generates a structured progress note in the therapist's preferred format (DAP/SOAP/BIRP/EMDR), one-click copy to SimplePractice. BAA available.

## Distribution wedge
r/therapists (90k), r/socialwork, the SimplePractice Community Forum, and Therapy Notes Facebook groups. Affiliate referrals via group practice owners (one practice = 8-15 therapists).

## Pricing model
$79/mo solo, $69/seat for groups of 5+. 14-day free trial with 5 free notes.

## Path to $10k MRR in 60 days
130 therapists at $79 = $10,270. Plan: 5 group-practice deals (50 seats) + 80 solo. Therapy AI scribes (Mentalyc, Upheal) already prove $99-150 price tolerance; undercut on price + DAP/EMDR-specific templates.

## Build effort
18-22 days, including BAA paperwork and on-device transcription tuning.

## Tech stack suggestion
Tauri desktop app + on-device whisper.cpp + Claude Sonnet via AWS BAA endpoint + Supabase (encrypted) + Stripe.

## Why now
HIPAA-compliant AI scribes in healthcare exploded post-2024; Heidi/Freed for doctors hit $10M ARR. Mental-health vertical is 2 years behind and underserved - therapists' notes burnout is documented top complaint in 2025 APA practice survey.

## Defensibility
BAA + HIPAA infra is a 2-3 week barrier most cloners skip. EMDR/IFS/CBT-specific templates curated per modality become a moat. Group-practice admin features create switching cost.

## Sources / references
- https://www.creem.io/blog/ai-saas-ideas-making-money-2026
- https://automaiva.com/vertical-saas-ai-agents-2026/
- https://superframeworks.com/articles/profitable-micro-saas-niches
