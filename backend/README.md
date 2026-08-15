# Alora backend foundation

> **Release status:** blocked. The SQL and edge-function foundation exists, but the 2026-08-13 validation found non-atomic trust operations, sync-rule privacy drift, and live-schema mismatches. Complete `../VALIDATION_TASKS.md` before provisioning a beta.

The production data layer for Alora's live mode: Postgres schema + Row-Level
Security, PowerSync sync rules, and the privileged Edge Functions. All artifacts
here are written and tested — provisioning the cloud services and supplying
credentials is the remaining step (it needs your accounts; see
`PROVISIONING.md`).

## What's here

| File | Purpose |
|---|---|
| `../supabase/migrations/` | Canonical versioned Postgres tables, enums, indexes, triggers, and Row-Level Security policies. Apply with the Supabase CLI. |
| `sync-rules.yaml` | PowerSync buckets: shared `family`, private `user_private`, read-only `global`. |
| `functions/generate-invite/` | Edge Function — issues a single-use, time-limited invite code for a chosen role (`partner` \| `limited`). |
| `functions/redeem-invite/` | Edge Function — redeems a single-use invite, enforces the **configured seat limit** (not a hard-coded cap), joins the family, consumes the token. |
| `functions/delete-account/` | Edge Function — transfer-then-scrub account deletion (promote partner / delete sole-owner family / hard-delete PII + private check-ins). |
| `supabase/tests/01-rls-security.test.sql` | pgTAP suite (52 assertions) — verifies RLS enforcement, the invite lifecycle, seat limits, and privacy isolation at the database layer. |

## Design decisions encoded

- **Roles**: `family_role` enum = `owner`, `partner`, `limited`. **`limited` is implemented** (Phase A) — a scoped caregiver seat (grandparent/nanny) that sees care events + timeline + own profile, but never private check-ins, trust actions, or the audit log.
- **Seat limits are a family setting, not a code constant**: `families.seat_limit` is nullable (unset = unlimited). Any non-limited member may change it; the `audit_seat_limit_change` definer trigger records actor + old/new values in the audit log. The database trigger enforces the cap, but invite redemption is not yet a single atomic operation. Trust actions are column-level: generic `UPDATE` on `families` is revoked, only `seat_limit` is granted.
- **`baby_events` has no sync-status column.** Sync state is a *client* concern owned by PowerSync's local queue; the server holds authoritative state only.
- **Soft delete** via `deleted_at` (propagates as a sync tombstone; sync rules include deleted rows, client filters them).
- **Invite tokens** are single-use (`used_at`), time-limited (`expires_at`, default 24h), revocable (`revoked_at`); `token_is_active()` gates redemption.
- **Private check-ins/reflections** are isolated at *both* layers: RLS (`user_id = auth.uid()`) and the per-user PowerSync bucket — a co-member's device never pulls them.

## To provision (your steps)

The full ordered runbook is [`PROVISIONING.md`](PROVISIONING.md) (~45–60 min), with a founder-facing checklist (including Sentry + privacy-URL steps and Phase A live checks) in `.scratch/launch-readiness/provisioning-checklist.md`. In short:

1. **Create a Supabase project** (US region for the US-only launch). Copy the project URL + anon key.
2. Apply the versioned migration history:
   ```bash
   supabase db push
   ```
   Seed `support_resources` (crisis-line copy still gated on MVP issue 13 sign-off).
3. **Create a PowerSync instance**, connect it to the Supabase Postgres (replication user), and paste `sync-rules.yaml` into its Sync Rules.
4. **Deploy the Edge Functions** (all three — note `generate-invite` is easy to miss):
   ```bash
   supabase functions deploy generate-invite
   supabase functions deploy redeem-invite
   supabase functions deploy delete-account
   ```
   They read `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the function environment (set automatically by Supabase, except the service-role key which you add as a secret: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`).
5. Put the credentials in the app env (never commit them):
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_POWERSYNC_URL=...
   EXPO_PUBLIC_SENTRY_DSN=...
   EXPO_PUBLIC_PRIVACY_POLICY_URL=...
   ```
6. In the app: the PowerSync dependencies and strict live-path typechecking are already wired. Connect the authenticated lifecycle to `startSync()` and sign in — `data/useData.ts` then selects the Supabase repository via the runtime mode resolver (`mobile/config/mode.ts`).

## Testing the security layer (pgTAP)

RLS cannot be meaningfully tested through the TypeScript adapter (the adapter
operates on the local SQLite, not the Postgres policies), so the policies and
invite lifecycle are verified at the database layer with pgTAP:

```bash
# Needs PostgreSQL + the pgTAP extension for your server version:
#   apt install postgresql postgresql-client postgresql-<ver>-pgtap
supabase test db
```

The local runner creates a throwaway database, applies
`../supabase/tests/support/00-mock-auth.sql` (a local stand-in for the
Supabase `auth` schema), then the canonical migration history. Pass with
`PGDATABASE=name ./tests/run-pgtap.sh` to override the database name.

Docker-free fallback: set `PGLTAP_DATABASE_URL` to a dedicated hosted
PostgreSQL/Supabase database and run the same script with
`PGLTAP_REMOTE_CONFIRM=I_UNDERSTAND_THIS_IS_A_DEDICATED_TEST_DATABASE`. The
remote target must already have the canonical migration. For a disposable
plain PostgreSQL target, also set `PGLTAP_APPLY_MIGRATION=1` and
`PGLTAP_USE_AUTH_MOCK=1`. The script uses `psql`, rolls back fixture data, and
refuses remote mode without the explicit confirmation value.

What the suite covers (52 assertions):

- A non-member cannot read family events, families, memberships, invite
  tokens, the audit log, or other users' profiles.
- The `members_self_join` hole is closed: a client-side insert into an
  existing family is rejected by RLS (0 rows).
- Onboarding still works: a user can create a family and take the owner seat
  (`members_owner_first` policy), and no one else can use that path.
- Invite issuance is owner-only; partners see no tokens and cannot issue them.
- `token_is_active()` gates redemption: used, revoked, and expired codes are
  rejected; exactly one redeemable code survives per family.
- **Seat limits (Phase A rework):** unset limit = unlimited; a configured cap
  rejects a third member at redeem even via the service role; the owner can
  raise the cap; a partner can change the limit (trust action) and the change
  is audit-logged; a **limited** member is blocked from seat-limit updates via
  RLS (`families_member_seat_limit`), cannot see the audit log, cannot create
  invites or private check-ins — but can still read care events.
- Private check-ins/reflections are invisible to co-caregivers and to
  non-members.

## Edge Functions

Privileged server logic that's more than RLS should allow a client to do. Each
authenticates the caller via their JWT, then acts with the service role.

- **generate-invite** — `POST {}` (or `{ role }`) → owner-only (RLS-gated; the
  function double-checks the caller's seat) issues a single-use code for
  `partner` or `limited`, with an expiry; audits the issue.
- **redeem-invite** — `POST { code }` → validates the token is active (unused,
  not revoked, unexpired), enforces the configured seat limit, upserts the
  profile, inserts the membership (with denormalized `display_name`), consumes
  the token, audits.
- **delete-account** — `POST {}` → for each owned family: promote the partner
  to owner or delete a sole-owner family; audit; then `auth.admin.deleteUser`,
  which cascades the user's PII/check-ins and sets `baby_events.created_by →
  NULL` ("former caregiver"). If the family has a configured seat limit, the
  transfer prefers a non-limited member as successor.

## Lives in the Expo app instead (`../mobile`)

- **Auth**: `lib/supabase.ts`, `lib/useAuth.tsx`, `app/(auth)/*`.
- **Local-first sync**: `powersync/{schema,system}.ts` + `data/supabaseRepository.ts`.
- **Runtime mode resolution**: `config/mode.ts` (demo / localFirst / live) drives which repository is active — the app runs on the mock adapter with zero env vars and switches to the Supabase adapter automatically once configured and signed in.
