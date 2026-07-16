# 14 — [needs sign-off] COPPA / state-law compliance posture

Status: ready-for-human
Type: HITL

## What to build

A legal owner reviews and signs off on the US compliance posture before launch. Confirm data-retention periods, data-minimization practices, and third-party processor handling against the post-April-2026 COPPA overhaul and applicable US state children's-privacy laws. Although users are adults providing data about their own child (softening classic COPPA "collected from a child" applicability), the sensitivity and current regime warrant conservative, signed-off limits. The GDPR-ready primitives (hard-delete, export, retention limits) from issues 11–12 provide the technical basis.

This is a human legal review task, not an implementation task.

## Acceptance criteria

- [ ] Data-retention periods are defined and approved by a legal owner
- [ ] Data-minimization and third-party processor handling reviewed against COPPA + state laws
- [ ] COPPA/state-law applicability determination is documented
- [ ] Any required changes are filed as follow-up issues; posture is recorded for launch

## Blocked by

- 11-privacy-trust-center-export-audit.md
- 12-account-deletion-transfer-then-scrub.md
