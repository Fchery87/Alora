# ADR-0001: Supabase + PowerSync backend

- **Status:** Accepted and implemented (pending cloud provisioning — see `backend/PROVISIONING.md`)
- **Scope:** `supabase/` migrations and tests, `backend/` sync rules and Edge Functions, and the mobile live-mode adapter

## Context

Alora's core promise is two-caregiver coordination: both caregivers must see the
same baby-care history even though each device is the local source of truth. That
requires a server that (a) reconciles offline edits between caregivers, (b) enforces
privacy so private daily check-ins never reach a co-caregiver's device, and
(c) enforces trust actions (invites, seat limits, account deletion) server-side,
because the client is not a trust boundary.

## Decision

Use **Supabase (Postgres, US region)** as the backend with **PowerSync** as the
bidirectional sync engine, with all access control enforced in the database:

- **Schema** (`supabase/migrations/`): `family_role` enum (`owner` / `partner` /
  `limited`), configurable `families.seat_limit` (nullable; unset = unlimited,
  change audit-logged by trigger), `baby_events` with **no sync-status column**
  (sync state is a client concern owned by PowerSync's local queue; the server
  holds authoritative state only), soft delete via `deleted_at` (propagates as a
  sync tombstone).
- **RLS** (included in the ordered `supabase/migrations/` history): Row-Level Security policies. Roles are enforced
  in Postgres; trust actions are column-level grants (e.g., only `seat_limit` is
  updatable on `families`); private check-ins/reflections are isolated by
  `user_id = auth.uid()`.
- **Sync rules** (`backend/sync-rules.yaml`): three PowerSync buckets — shared
  `family`, per-user `user_private` (check-ins — a co-member's device never pulls
  them), read-only `global` (support resources).
- **Edge Functions** (service-role + user JWT): `generate-invite` (single-use,
  time-limited, revocable, role-tagged), `redeem-invite` (enforces the configured
  seat limit atomically — not a hard-coded cap), `delete-account`
  (transfer-then-scrub: promote partner / delete sole-owner family / hard-delete
  PII + private check-ins).
- **Client posture**: the app holds only the Supabase anon key + user JWT;
  every table read/write is subject to RLS.

## Consequences

- Privacy is isolated at **both** layers: RLS and the per-user PowerSync bucket.
- The pgTAP suite (52 assertions) verifies RLS enforcement, the invite lifecycle,
  seat limits, and privacy isolation at the database layer.
- Live mode requires a development build (native PowerSync modules); demo and
  local-first modes work without the server.
- Provisioning is a runbook backed by versioned migrations: `backend/PROVISIONING.md`.
