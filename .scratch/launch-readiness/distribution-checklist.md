# Beta Distribution Setup — Founder Checklist

Status: ready-for-human
Source: ticket *Beta distribution setup* (04) — depends on *Provision backend free tier* (03) being live (builds embed the real env). Research backing: *Free-tier infra and distribution research* (verified: Apple $99/yr, TestFlight internal ≤100 testers no review; Play $25 once, internal testing ≤100 no review; EAS Free 30 builds/mo max 15 iOS; Google production gate = 12 testers/14 days — irrelevant to internal testing).

**Cost: $124 one-time ($99 Apple + $25 Google). $0/mo recurring.**

## Step 1 — Enrollments

### Apple Developer Program ($99/yr)
1. [ ] Enroll at developer.apple.com/programs (individual is fine; ~24–48h review)
2. [ ] App Store Connect → My Apps → create app record: name "Alora", bundle ID `app.alora.mobile` (already set in `mobile/app.json`), SKU `alora-001`
3. [ ] Privacy policy URL field: fill once Step 3 of the provisioning checklist publishes it (required before external TestFlight)

### Google Play Console ($25 once)
1. [ ] Register at play.google.com/console (one-time $25; personal account fine)
2. [ ] Create app: name "Alora", package `app.alora.mobile` (already set in `app.json`)
3. [ ] Complete **Data-safety form** + content rating (target audience: **adults/caregivers**, not children) — required before any release
4. [ ] Note: new personal accounts need a 12-tester/14-day closed test **before production access** — internal-testing beta distribution is NOT gated by it (only the eventual move to production)

## Step 2 — EAS project

1. [ ] `cd mobile && npx eas-cli login`
2. [ ] `npx eas-cli init` (links the repo to EAS; free plan)
3. [ ] `eas.json` is already committed (development / preview / production profiles; appVersionSource remote)
4. [ ] Credentials: `npx eas-cli credentials` — generate the iOS distribution cert + provisioning profile and the Android keystore (EAS manages them; Apple cert generation may prompt for the team ID)

## Step 3 — Builds

1. [ ] **Dev client build** (for iteration): `npx eas build --profile development --platform all`
2. [ ] **Preview build** (the beta install): `npx eas build --profile preview --platform ios` and `--platform android`
   - iOS preview lands in TestFlight; Android preview (APK) can be sideloaded or uploaded to the internal-testing track
3. [ ] Watch the EAS Free budget: 30 builds/mo total, **max 15 iOS** — batch changes before building

## Step 4 — Distribute to the 3–5 families

1. [ ] **iOS**: App Store Connect → TestFlight → Internal Testing (≤100 testers, no review) → add the beta families' Apple IDs → they install via the TestFlight app. Builds expire after 90 days — re-upload before testers lose access.
2. [ ] **Android**: Play Console → Testing → Internal testing (≤100 testers, no review) → upload the AAB/APK → share the opt-in link (or sideload the preview APK directly).
3. [ ] Give every family the install doc (below).

## Install doc for beta families (one page, in the beta operating doc's info-sheet spirit)

- What Alora is + what to log
- Install steps per platform (TestFlight invite / Play link)
- Privacy one-pager (beta operating doc §3) — local-first, US-region sync, check-in isolation, no ads/selling, export/delete anytime
- Feedback: beta email + 3-question form (§2 of the operating doc)
- Support expectations (§5): crashes < 1 day, everything else < 1 week

## Done when

Both builds install on clean devices and run in **live mode** end-to-end (sign-in → family → sync), and every beta family has the install doc. Record build IDs, TestFlight mechanics, and the install doc location on ticket 04.
