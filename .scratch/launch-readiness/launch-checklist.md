# Alora Launch Readiness — Checklist

Status: ready-for-human (produced from *Launch readiness scope*, resolved Aug 2026)
Purpose: the handoff artifact from the [Launch Readiness map](map.md) to the **launch effort** — a fresh effort that begins after the beta passes its exit criteria ([beta operating doc](beta-operating-doc.md) §6). Everything here is scoped; store execution happens post-beta.

## 0. Gate: beta exit criteria met

- [ ] ≥ 3 families logging daily for 2 consecutive weeks
- [ ] 14 days without a logging-affecting crash (Sentry-verified)
- [ ] Live end-to-end verified on both platforms (invite → redeem → sync → check-in isolation → seat limit)
- [ ] Feedback backlog triaged into the roadmap
- [ ] Explicit launch/no-launch decision recorded

## 1. Store assets (prototype ticket — drafted once the beta starts)

- [ ] App icon (1024×1024, "Warm Editorial" design language — draft from `theme/tokens.ts`)
- [ ] 3–5 screenshots per platform (Home briefing, Log, Timeline, Growth, Trust) from real app runs
- [ ] Feature graphic (Play) / optional promo art (App Store)
- [ ] Founder review pass against beta feedback

## 2. Store listing copy (agent draft, founder review)

- [ ] Title / subtitle (short, name-searchable)
- [ ] Description: core promise (fast local-first logging, two-caregiver handoff, private check-in) + trust positioning (no ads, no data selling, export and leave anytime)
- [ ] Category + keywords
- [ ] Review against beta feedback before submission

## 3. Legal & compliance (agent draft → founder review → legal sign-off gate)

- [ ] **Privacy policy**: agent draft from a template tailored to Alora's documented practices (CONTEXT.md trust rules + beta info sheet); publish at a public URL and set `EXPO_PUBLIC_PRIVACY_POLICY_URL` (in-app 5.1.1 link goes live automatically)
- [ ] **Play Data-safety form** completed; target audience declared **adults (caregivers)**, not children
- [ ] **COPPA posture** sign-off (ties to MVP issue 14 — ready-for-human)
- [ ] EULA/terms: store standard terms for beta; revisit at launch
- [ ] Legal sign-off recorded before submission

## 4. Pre-submission review processes

- [ ] Beta App Review prep (external TestFlight): privacy-policy URL + test-information fields + what-to-test notes
- [ ] Play: Data-safety form, app content rating questionnaire, target audience = adults
- [ ] Final in-app pass: privacy-policy link renders (env var set), trust-center copy, delete-account path
- [ ] Sentry release set for the submission build; crash-free sessions watched for 48h

## 5. Release flow (handoff to the launch effort)

- [ ] Versioning scheme (semver; `expo` version + build numbers)
- [ ] EAS submit pipeline (`eas build` + `eas submit` — profile in `eas.json`, added during *Beta distribution setup*)
- [ ] Review-response plan (who answers, cadence)
- [ ] Announcement plan (channel, date, who)
- [ ] Post-launch ops: first-week monitoring (Sentry), support inbox, roadmap re-prioritization

## Out of scope for this checklist (decided)

- Monetization/pricing (map's Out of scope — future effort)
- Community/content features (roadmap Out of scope)
- Post-launch feature work beyond ops (the roadmap PRD owns that)
