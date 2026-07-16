# Alora backend foundation

The applyable data layer for backlog issues **01–02** (`.scratch/alora-mvp/issues/`).
These artifacts are ready to apply, but provisioning the cloud services and
supplying credentials is a step only you can do (it needs your accounts).

## What's here

| File | Purpose |
|---|---|
| `schema.sql` | Postgres tables, enums, indexes, triggers (2-seat cap, soft delete, invite-token lifecycle). |
| `rls.sql` | Row-Level Security policies — backend-enforced access control (apply after `schema.sql`). |
| `sync-rules.yaml` | PowerSync buckets: shared `family`, private `user_private`, read-only `global`. |
| `functions/redeem-invite/` | Edge Function — redeems a single-use invite, enforces the 2-seat cap, joins the family, consumes the token. |
| `functions/delete-account/` | Edge Function — transfer-then-scrub account deletion (promote partner / delete sole-owner family / hard-delete PII). |

## Design decisions encoded

- **Two MVP roles** (`owner`, `partner`); `family_role` enum is extensible — `limited` is Phase 2. A trigger caps families at 2 seats.
- **`baby_events` has no sync-status column.** Sync state is a *client* concern owned by PowerSync's local queue; the server holds authoritative state only.
- **Soft delete** via `deleted_at` (propagates as a sync tombstone; sync rules include deleted rows, client filters them).
- **Invite tokens** are single-use (`used_at`), time-limited (`expires_at`, default 24h), revocable (`revoked_at`); `token_is_active()` gates redemption.
- **Private check-ins/reflections** are isolated at *both* layers: RLS (`user_id = auth.uid()`) and the per-user PowerSync bucket — a co-member's device never pulls them.

## To provision (your steps)

1. **Create a Supabase project** (US region for the US-only launch). Copy the project URL + anon key.
2. Apply schema then policies:
   ```bash
   supabase db push            # or paste schema.sql then rls.sql into the SQL editor
   ```
3. **Create a PowerSync instance**, connect it to the Supabase Postgres (replication user), and paste `sync-rules.yaml` into its Sync Rules.
4. Put the credentials in the app env (never commit them):
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_POWERSYNC_URL=...
   ```
5. The prototype's `src/data/supabaseRepository.ts` is the adapter skeleton that reads from these once configured; swap it in for `mockRepository` via `src/data/repository.ts`.

## Edge Functions

Privileged server logic that's more than RLS should allow a client to do. Both
authenticate the caller via their JWT, then act with the service role.

```bash
supabase functions deploy redeem-invite
supabase functions deploy delete-account
```

They read `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from
the function environment (set automatically by Supabase, except the service-role key
which you add as a secret: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`).

- **redeem-invite** — `POST { code }` → validates the token is active (unused, not
  revoked, unexpired), enforces the 2-seat cap, upserts the profile, inserts the
  membership (with denormalized `display_name`), consumes the token, audits.
- **delete-account** — `POST {}` → for each owned family: promote the partner to owner
  or delete a sole-owner family; audit; then `auth.admin.deleteUser`, which cascades
  the user's PII/check-ins and sets `baby_events.created_by → NULL` ("former caregiver").

## Lives in the Expo app instead (`../mobile`)

- **Auth** (issue 01): `lib/supabase.ts`, `lib/useAuth.tsx`, `app/(auth)/*`.
- **Local-first sync** (issue 02): `powersync/{schema,system}.ts` + `data/supabaseRepository.ts`.
