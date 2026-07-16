# 08 — Split-by-case conflict handling

Status: ready-for-agent
Type: AFK

## What to build

Deterministic conflict resolution for shared caregiving, split by case rather than blanket last-write-wins:

- **Concurrent creates** of overlapping events (e.g., both caregivers log a 2pm feed) → preserve both rows; surface a "possible duplicate" chip in the Timeline with merge/dismiss options. Nothing is silently merged.
- **Concurrent edits** to the same existing event → last-write-wins, with prior values recorded in `event_edits` and an "edited by X" marker shown.

Requires two caregivers to exercise, so it builds on the invite flow and the timeline.

## Acceptance criteria

- [ ] Two caregivers creating overlapping events both persist; neither is dropped
- [ ] A "possible duplicate" chip appears for overlapping creates, with merge and dismiss actions
- [ ] Concurrent edits to one event resolve last-write-wins with prior values kept in `event_edits`
- [ ] Resolution behaves identically whether the conflict surfaces online or after offline sync
- [ ] Tests simulate concurrent create-create and edit-edit from two devices

## Blocked by

- 06-shared-timeline-edit-soft-delete.md
- 07-caregiver-invite-two-role-rls.md
