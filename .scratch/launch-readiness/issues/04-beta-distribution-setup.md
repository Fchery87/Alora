# 04 — Beta distribution setup

Type: task
Status: open
Blocked by: 02, 03

## Question

Make installable beta builds for 3–5 known families on both platforms.

Decide and execute: Apple Developer enrollment ($99) and Play Console registration ($25), EAS project + credentials, a TestFlight build (iOS) and an internal-testing build (Android), app icons/splash that pass store pre-submission checks, and a one-page install + onboarding doc for beta families (privacy expectations included — coordinate with *Beta program details*).

Resolved when both builds install on a clean device and run in live mode end-to-end. Record the build IDs, TestFlight invite mechanics, and install doc location in the Answer.

## Comments

### 2026-08 (founder prep delivered)
- Founder checklist delivered: `.scratch/launch-readiness/distribution-checklist.md` — Apple $99 + Play $25 enrollment steps, EAS init + credentials, build profiles, TestFlight internal / Play internal testing distribution, and the one-page beta install doc outline.
- `mobile/eas.json` committed (development / preview / production profiles; appVersionSource remote). `app.json` already has bundle identifiers (`app.alora.mobile`) — store icon/splash assets are scoped to the launch checklist (07), not this ticket.
- Status stays `open` until enrollment + builds land (founder's hands); Step 4 of the provisioning checklist must publish the privacy-policy URL first (Apple requires it for external TestFlight).
- On completion, record: build IDs, TestFlight mechanics, install doc location.
