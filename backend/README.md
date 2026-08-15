# Alora backend

The production data layer is Supabase Postgres plus PowerSync. The canonical
schema lives only in `../supabase/migrations/`; `sync-rules.yaml` controls what
reaches each device, and the Edge Functions are thin authenticated transports
over database transactions.

Release status is code-complete for the current beta contract. It is not yet a
launch approval: the five 2026-08-15 migrations still need to be applied to the
linked Supabase project, the hosted 74-assertion suite must pass, and PowerSync
and device journeys remain human-gated.

## What's here

| Path                                         | Purpose                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `../supabase/migrations/`                    | Versioned tables, ownership constraints, RLS policies, transactional bootstrap, invite redemption, duplicate resolutions, and account deletion trigger. |
| `sync-rules.yaml`                            | Shared family care data, role-scoped trust buckets, owner-only invite tokens, per-user private check-ins, and global resources.                         |
| `functions/generate-invite/`                 | Owner-authenticated invite issuance and audit.                                                                                                          |
| `functions/redeem-invite/`                   | JWT-authenticated transport for durable rate limiting and atomic `redeem_invite(...)`.                                                                  |
| `functions/delete-account/`                  | Retry-safe request creation plus Supabase Auth deletion; relational cleanup runs in the `auth.users` trigger.                                           |
| `tests/run-pgtap.sh`                         | Docker-free local or explicitly confirmed hosted pgTAP runner.                                                                                          |
| `tests/unit/`                                | Deno source-contract checks for Edge Function boundaries.                                                                                               |
| `../supabase/tests/01-rls-security.test.sql` | 74-assertion RLS, ownership, role, invite, bootstrap, and deletion matrix.                                                                              |

## Database contract

- Roles are `owner`, `partner`, and `limited`. Limited caregivers can read
  family care events but cannot access check-ins, invite tokens, audit data, or
  seat-limit management.
- `families.seat_limit` is nullable. A null value is unlimited. Seat checks lock
  the family row so concurrent redemptions cannot claim the last seat twice.
- Composite foreign keys keep babies, events, edits, check-ins, reflections,
  and duplicate resolutions inside one family. A partial unique index permits
  at most one owner per family.
- Invite redemption locks the token and family, applies the cap, inserts the
  member, consumes the token, and audits the join in one transaction. Retries
  by the winning user return the same success. Owner is not an invite-grantable
  role.
- `bootstrap_family(...)` is advisory-lock protected and idempotent for the
  authenticated user. It creates the family, owner, baby, and audit row as one
  operation.
- Private check-ins retain a user-private PowerSync bucket while carrying
  family context in Postgres. RLS allows only the author's non-limited seat.
- `event_duplicate_resolutions` persists keep-both and merged decisions. Merge
  soft-deletes only the selected loser; the shared history remains auditable.
- Account deletion creates a durable request, calls Auth Admin, and lets the
  `auth.users` deletion trigger transfer ownership deterministically or delete a
  sole-owner family. The request row survives Auth deletion and reaches a
  terminal state.

## Provisioning

Use [`PROVISIONING.md`](PROVISIONING.md) for the complete sequence.

```bash
supabase link --project-ref <20-character-project-ref>
supabase db push
supabase functions deploy generate-invite
supabase functions deploy redeem-invite
supabase functions deploy delete-account
```

Set only client-safe `EXPO_PUBLIC_*` values in the mobile environment. Keep the
service-role key in Supabase function secrets. Configure PowerSync with the
same project and deploy `sync-rules.yaml` there.

## pgTAP without Docker

The default local path needs PostgreSQL and pgTAP. A hosted disposable target
works with the installed `psql` client:

```bash
export PGLTAP_DATABASE_URL='postgresql://user:password@host:5432/postgres?sslmode=require'
export PGLTAP_REMOTE_CONFIRM=I_UNDERSTAND_THIS_IS_A_DEDICATED_TEST_DATABASE
./tests/run-pgtap.sh
```

Do not paste a multi-line URI. If the target is a disposable plain PostgreSQL
database, add `PGLTAP_APPLY_MIGRATION=1` and `PGLTAP_USE_AUTH_MOCK=1`. A linked
Supabase project should receive migrations with `supabase db push` first, then
run the suite with migration application disabled.

The fixture transaction rolls back. The runner rejects remote mode without the
explicit confirmation string and removes temporary local output on every path.

## Edge Function boundaries

- `generate-invite` validates the JWT and role, then performs the owner-only
  write through the authenticated database path.
- `redeem-invite` authenticates, applies the durable account/network limiter,
  calls `redeem_invite`, and maps unavailable or invalid outcomes to generic
  responses. It never reads a token into application memory first.
- `delete-account` authenticates, creates or reuses a deletion request, calls
  Auth Admin, and reports only terminal success or a retryable failure. It does
  not mutate family ownership itself.

## Mobile boundary

Runtime composition lives in `../mobile/runtime/`. The authenticated lifecycle
selects the Supabase repository, starts one PowerSync connection, exposes a
sanitized sync projection, and resets the repository on sign-out. The mock
repository is used only in demo mode or for explicitly offline contract tests.
