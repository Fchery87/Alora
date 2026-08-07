# 02 — Free-tier infra and distribution research

Type: research
Status: resolved
Blocked by: —

## Question

Which free-tier choices actually support Alora's launch route, and what do they cost?

Verify with current sources: Supabase free tier limits (projects, database size, auth MAU, edge functions); PowerSync Cloud free tier vs self-hosted PowerSync (limits, what self-hosting requires); Sentry free tier (error volume); EAS free tier (build limits, dev-build support); Apple Developer Program ($99/year, TestFlight requirements, privacy-policy requirement even for beta); Google Play Console ($25 one-time, internal testing, privacy policy requirements).

Deliverable: a cost/limits table for a $0/month posture plus a recommended stack decision input for *Provision backend free tier* and *Beta distribution setup* — including whether TestFlight/Play internal testing requires a public privacy policy before installs can happen.

Findings land at `.scratch/launch-readiness/research/02-free-tier-infra-and-distribution.md` (sourced, with URLs).

## Answer

Resolved. Findings: `.scratch/launch-readiness/research/02-free-tier-infra-and-distribution.md` — web-verified addendum applied Aug 2026.

- **Recommended stack**: Supabase Free (50k MAU confirmed) + PowerSync Cloud Free (caps confirmed: 2 GB/mo synced, 500 MB hosted, 50 concurrent, 2 instances) + Sentry Free (5k errors/mo) + EAS Free (30 builds/mo, max 15 iOS) + Apple Developer $99/yr + Play Console $25 once. **$0/mo recurring, $124 first-year outlay.**
- **Corrections vs draft**: Google's production-gate tester rule is **12 testers/14 days** (reduced from 20, Dec 2024) — irrelevant to internal-testing beta; TestFlight external testing **requires a public privacy policy URL** (5.1.1 / Test Information section) — hard prerequisite, sequence with enrollment.
- **Distribution**: iOS TestFlight internal testing (≤100 testers, no review, 90-day builds) and Android Play internal testing (≤100, no review) both fit the beta with no store review.
- **Watch items**: PowerSync cap drift, EAS iOS build budget, project auto-pause after 1 week idle.
- Unblocks *Provision backend free tier* (03) and *Beta distribution setup* (04).
