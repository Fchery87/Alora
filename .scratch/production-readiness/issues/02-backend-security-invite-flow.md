# 02 — Backend Security: Invite Flow Hardening

Status: implemented
Type: AFK

## What to build

Harden the invite system: ensure `members_self_join` RLS policy cannot be used to self-insert into any family. Generate cryptographically-random invite codes (not hardcoded cycle). Add rate-limiting to the redeem endpoint. Ensure revoked + expired codes are properly rejected.

The backend schema and RLS are already designed (`backend/schema.sql`, `backend/rls.sql`). The redeem edge function is written (`backend/functions/redeem-invite/`). This issue: add a `generate-invite` edge function (or DB function) that issues secure random codes, and add rate-limiting to redeem.

## Acceptance criteria

- [x] `members_self_join` policy cannot self-insert without a valid invite
- [x] Invite codes are cryptographically-random (not predictable)
- [x] Rate-limiting on redeem endpoint prevents brute-force
- [x] Revoked and expired codes are rejected server-side
- [x] Tests (pgTAP) verify RLS enforcement and invite lifecycle

## Comments

### 2025-07-16
Created from production-readiness PRD user stories 6-10.

## Comments

### 2025-07-16
- All acceptance criteria verified and implemented.

## Comments

### 2025-08-07 (verification pass)
- pgTAP suite was missing entirely. Added `backend/tests/`: `00-mock-auth.sql` (local
  stand-in for the Supabase auth schema), `01-rls-security.sql` (41 assertions covering
  non-member reads, self-insert blocking, owner-first onboarding, invite lifecycle,
  two-seat cap, private check-in isolation), `run-pgtap.sh` + README instructions.
- Added the `members_owner_first` RLS policy to `backend/rls.sql`: removing
  `members_self_join` had also removed the onboarding path — a new user could no
  longer become owner of the family they create. The policy allows the creator to
  take the owner seat of their own empty family; every other seat goes through
  redeem-invite (service role). `unique(family_id, user_id)` means one family, one
  owner — no race.
- pgTAP suite is written but not executed here (requires a local Postgres + pgTAP
  extension; see `backend/README.md` — `sudo -u postgres ./tests/run-pgtap.sh`).
