# 10 — Private daily check-in + per-user bucket

Status: implemented
Type: AFK

## What to build

The private, non-clinical daily check-in. One mood input plus one optional short reflection field, stored in `parent_check_ins` / `parent_reflections`. Privacy is enforced at the **sync layer**: these rows belong to a per-user PowerSync bucket keyed on `user_id` and are never included in the family bucket, so a partner's device never receives them (RLS double-enforces). After completion, show a context-safe supportive message. Include an always-available, non-triggered support-resource surface and a non-clinical disclaimer (placeholder copy; final wording is finalized in issue 13).

The check-in performs **no** mood inference, scoring, or automated triggering.

## Acceptance criteria

- [ ] User can submit a daily mood + optional reflection; data persists local-first
- [ ] Check-in data syncs only to the authoring user's own devices (per-user bucket)
- [ ] A partner's device never pulls another user's check-ins (verified at sync + RLS layers)
- [ ] A supportive message shows after completion; no scoring/inference/auto-triggered panels exist
- [ ] A persistent "Need support?" surface links to support resources with a non-clinical disclaimer (placeholder copy)
- [ ] Tests assert cross-user isolation of check-in data and absence of any triggering logic

## Blocked by

- 02-local-first-pipeline-family-baby-setup.md
