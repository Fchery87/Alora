# 12 — Account deletion: transfer-then-scrub

Status: ready-for-agent
Type: AFK

## What to build

Account deletion with defined shared-data semantics, orchestrated server-side (Supabase Edge Function) so both Postgres and downstream copies are purged:

- **Owner deletes while a partner exists** → ownership transfers to the partner; the departing owner's PII and private check-ins/reflections are hard-deleted; shared baby/event history is retained with `created_by` reattributed to a "former caregiver" placeholder.
- **Owner is the only member** → the entire family, baby, and associated data are hard-deleted.
- **Partner deletes** → the partner's PII and private check-ins are hard-deleted; family and shared history remain with the owner.

## Acceptance criteria

- [ ] Owner-deletes-with-partner transfers ownership and scrubs owner PII + check-ins, retaining shared events reattributed to "former caregiver"
- [ ] Sole-owner deletion hard-deletes the entire family and its data
- [ ] Partner deletion scrubs only the partner's PII + check-ins, leaving family intact
- [ ] Deletion runs server-side and purges Postgres + any downstream copies
- [ ] Tests cover all three deletion paths and verify no orphaned PII or check-in rows remain

## Blocked by

- 07-caregiver-invite-two-role-rls.md
- 10-private-daily-checkin-per-user-bucket.md
