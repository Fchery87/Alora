# Launch Readiness — Map

Status: wayfinder:map

## Destination

A private beta running live — provisioned Supabase + PowerSync on free tiers, Sentry crash capture, installable builds for 3–5 known families on both platforms — plus a research-backed, prioritized feature roadmap. Reaching it settles every decision between here and a launch-ready Alora v1.0; the map is done when the route is clear and nothing is left to decide before someone goes and does the thing.

## Notes

- **Domain**: Alora, a local-first Expo/React Native baby-care logging app (see `CONTEXT.md` for glossary). Live mode = Supabase auth + PowerSync sync over Expo SQLite; demo mode = same local modules, mock data.
- **Prior work**: `.scratch/production-readiness/` attempted tooling, CI, backend security tests, adapter contract tests, UI hardening, and observability wiring. A 2026-08-13 executable audit found the remediation incomplete. See `VALIDATION_TASKS.md` before provisioning.
- **Standing preferences** (charted with the human): destination = launch-ready v1.0 + research-backed roadmap; beta = 3–5 known families on both platforms (accepting one-time $99 Apple Developer + $25 Play Console); $0/month free tiers (Supabase, PowerSync, Sentry, EAS); backend provisioned early (critical path for two-caregiver sync); Sentry-only observability; market research scoped to feature ideas.
- **Open human gates elsewhere**: crisis-resources copy sign-off and COPPA posture (`.scratch/alora-mvp/` issues 13, 14 — ready-for-human).
- **Skills**: `grilling` + `domain-modeling` for HITL tickets; `research` subagents for AFK facts; `prototype` when a concrete artifact raises fidelity.
- **Conventions**: glossary vocabulary from `CONTEXT.md`; surface ADR conflicts explicitly (`docs/adr/`).

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the ticket for the detail -->

- [Competitor feature landscape](issues/01-competitor-feature-landscape.md) — 13 comparable apps matrixed; 10 feature ideas (5 gaps: handoff briefing, sync trust UX, duplicate merge, milk-stash, pediatrician report; 5 parity: growth charts, non-clinical sleep suggestions, local photos, third seat, privacy-as-UX); verified corrections: Nara free, Huckleberry $119.99/yr, Baby Connect subscription, Amila no auto-sync.
- [Free-tier infra and distribution research](issues/02-free-tier-infra-and-distribution.md) — $0/mo + $124 one-time stack verified: Supabase Free, PowerSync Cloud Free (2 GB/mo, 50 concurrent), Sentry Free, EAS Free (30 builds/15 iOS), Apple $99 + Play $25; Google gate is 12 testers/14 days (not 20); public privacy-policy URL required for external TestFlight.
- [Seat limit configuration](issues/08-seat-limit-configuration.md) — seat limit is a family setting: unlimited default, any caregiver can change it (audit-logged), enforced at redeem; scoped roles (grandparent/nanny) restored into the feature per founder; rework deltas recorded for schema/redeem/pgTAP/Settings.
- [Roadmap prioritization](issues/06-roadmap-prioritization.md) — ROADMAP-PRD.md written (ready-for-agent): Phase A beta-blocking (seat limit, scoped roles minimal cut, sync-trust UX), Phase B v1.1 quick-wins-first (growth charts, pediatrician PDF, handoff briefing, duplicate merge, trust center); 3 backlog items; community/monetization/clinical out of scope.
- [Beta program details](issues/05-beta-program-details.md) — beta-operating-doc.md: email + install-doc form feedback, one-page privacy info sheet, Sentry-only no-PII data, tiered support (crashes <1 day / else <1 week), full exit criteria (≥3 families daily 2 weeks, 14 crash-free days, live end-to-end on both platforms, feedback triaged, explicit launch decision).
- [Launch readiness scope](issues/07-launch-readiness-scope.md) — launch-checklist.md (ready-for-human): store assets as a post-beta prototype ticket, agent-drafted listing copy, privacy policy agent draft + legal sign-off gate (ties to MVP 14), full pre-submission review checklist, checklist IS the handoff to the fresh launch effort.

## Not yet specified

- **Store assets & listing** (icon, screenshots, listing copy) — suspected to graduate from *Launch readiness scope* once the beta's exit criteria exist.
- **Product analytics** — declined for beta (Sentry-only); may graduate later as a roadmap candidate.
- **Beta feedback channel mechanics** — will sharpen inside *Beta program details*.

## Out of scope

- **Pricing / monetization / positioning research** — the market-research round was scoped to feature ideas; pricing decisions belong to a future effort, so this never re-graduates here.
- **Public app-store launch execution** — the map settles decisions up to launch readiness; the actual store submission happens after the beta, as a fresh effort.
