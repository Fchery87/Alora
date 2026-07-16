# 02 — Local-first pipeline + family & baby setup

Status: ready-for-agent
Type: AFK

## What to build

Establish the local-first data pipeline and the first shared domain objects. Wire **PowerSync + on-device SQLite** (SQLite is the UI source of truth) against the Supabase Postgres backend. Create the `families`, `family_members`, and `babies` schema with Row-Level Security, and define the **family sync bucket** keyed on family membership. Build the onboarding flow that creates a family unit and one baby profile.

End-to-end behavior: an authenticated user creates a family and a baby profile; the records write to local SQLite immediately and reconcile to Supabase via PowerSync. First-run creation is online-only (it inherently needs the backend), but once created the data reads from the local store.

## Acceptance criteria

- [ ] PowerSync + SQLite integrated; UI reads from the local store
- [ ] `families`, `family_members`, `babies` tables exist with RLS restricting access to family members
- [ ] Family sync bucket pulls only the current user's family data to their device
- [ ] Onboarding creates a family + baby profile, collecting only the minimum required fields
- [ ] Created records appear immediately from local SQLite and sync to Postgres
- [ ] Tests cover schema/RLS access rules and the local-write → sync round trip

## Blocked by

- 01-app-shell-supabase-auth.md
