# Alora Private Beta — Operating Doc

Status: ready-for-human (produced from *Beta program details*, resolved Aug 2026)
Applies to: the 3–5 known-family beta on both platforms, per the [Launch Readiness map](map.md).

## 1. Program shape

- **Families**: 3–5 families the founder knows personally; each = 2 caregivers (owner + partner) where possible.
- **Platforms**: iOS (TestFlight) + Android (Play internal testing / EAS dev build) — see *Beta distribution setup* (04).
- **Duration**: open-ended until the exit criteria (§6) are met.

## 2. Feedback channel

- **Primary**: a dedicated beta email address (e.g. `beta@alora.app`) published in the install doc.
- **In the install doc**: a 3-question form (1. What worked? 2. What broke or confused you? 3. What's one thing you'd add?).
- **Cadence**: the founder sends a brief "how's it going" check-in to each family monthly; responses are logged into the feedback backlog and triaged into the roadmap (see *Roadmap prioritization*).

## 3. Privacy & data messaging (one-page beta info sheet, part of the install doc)

Beta families are told, in plain language:

- Baby-care data lives on their devices first (local-first) and syncs between their two caregivers through US-region infrastructure (Supabase).
- **Private daily check-ins never leave the author's device to the co-caregiver** — they sync only to the author's own devices.
- Invites are single-use, time-limited, and revocable; the family controls who joins.
- **No ads. No data selling. Export and leave anytime** (Settings → Export my data; account deletion transfers/scubs per the trust rules).
- Alora treats all baby-family data as sensitive (COPPA posture: the app is built for caregivers, not children; child data is never collected from children directly).

## 4. Data collected during beta

- **Sentry crash/error reports only** (map decision: Sentry-only observability). Initialized in production builds with a DSN; **no user identifiers or PII in event tags**.
- **No product analytics** (no events, no funnels, no third-party SDKs).
- Family data stays in the family's own account; families can export or delete it anytime.
- If a beta family leaves, their data is deleted on request (account deletion flow).

## 5. Support expectations

- **Crashes or anything that loses data**: response within **1 day**.
- **Everything else** (questions, feature requests, confusion): acknowledged within **1 week**, then triaged.
- The founder is the support desk; no ticket system during beta.

## 6. Exit criteria — beta → launch decision

All of the following must hold before a launch/no-launch decision is made with real data:

1. **≥ 3 beta families logging daily for 2 consecutive weeks** (founder-observed via their own dashboard/engagement check-in).
2. **14 days without a crash that affects logging** (verified via Sentry).
3. **Live-mode end-to-end verified on both platforms**: invite → redeem → co-caregiver join → two-device sync → private check-in isolation (co-caregiver cannot see it) → seat-limit behavior (unlimited default; configured cap rejects at redeem).
4. **Feedback backlog triaged**: every beta item is dispositioned (fix now / roadmap / not doing) and folded into the roadmap PRD.
5. Then: an explicit **launch / no-launch** decision, recorded on this ticket's sibling *Launch readiness scope* (07) and its launch checklist.
