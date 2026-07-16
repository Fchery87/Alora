# 11 — Privacy/trust center + full JSON export + audit

Status: ready-for-agent
Type: AFK

## What to build

The user-facing privacy and trust surfaces plus data-rights primitives. An onboarding privacy explainer and an in-product trust center describing who can see what (shared family data vs. private check-ins). A **full structured (JSON) export** of the user's family data plus their own check-ins. Audit visibility (`audit_logs`) for family membership changes and sensitive settings changes. These primitives are built to GDPR standard now so EU expansion is configuration later.

## Acceptance criteria

- [ ] Onboarding includes a plain-language explanation of shared vs. private data
- [ ] Trust center clearly states who can access which data
- [ ] User can export a complete, machine-readable JSON of their family data + own check-ins
- [ ] Family membership changes and sensitive settings changes are recorded in `audit_logs` and viewable
- [ ] Tests cover export completeness and audit-log capture of membership/sensitive changes

## Blocked by

- 07-caregiver-invite-two-role-rls.md
- 10-private-daily-checkin-per-user-bucket.md
