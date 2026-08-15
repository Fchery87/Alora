# Testing Alora

The mobile test command is the canonical fast feedback loop. Run it from the
`mobile/` directory:

```bash
npm test
npm run test:app
npm run test:contracts
npm run test:coverage
npm run typecheck
npm run lint
```

Jest uses the Expo preset and React Native Testing Library. The suites cover
domain calculations, repository contracts for both adapters, the root error
boundary, authenticated route redirects, and accessibility roles for shared
buttons and chips. Coverage is collected from application TypeScript while
excluding tests, generated Expo output, and dependencies. Phase 2 records the
baseline; enforcement thresholds are intentionally deferred until the source
coverage baseline is stable.

Baseline recorded on 2026-08-14: 10 suites and 86 tests passed; collected
source coverage is 49.50% lines, 46.46% statements, 45.02% functions, and
41.71% branches. The report is intentionally descriptive for this phase.

The database security suite is owned by Supabase CLI:

```bash
supabase test db
```

It runs `supabase/tests/01-rls-security.test.sql` against the local project
after applying the migrations. Docker must be running and the local Supabase
stack must include pgTAP. The support SQL under `supabase/tests/support/` is
kept for standalone PostgreSQL fixtures and does not contain production data.

If Docker is not available, use the Docker-free runner with a dedicated hosted
database and a lightweight `psql` client:

```bash
PGLTAP_DATABASE_URL='postgresql://…' \
PGLTAP_REMOTE_CONFIRM=I_UNDERSTAND_THIS_IS_A_DEDICATED_TEST_DATABASE \
./backend/tests/run-pgtap.sh
```

The target must already contain the canonical migration. For a disposable
plain PostgreSQL database, add `PGLTAP_APPLY_MIGRATION=1` and
`PGLTAP_USE_AUTH_MOCK=1`. Never point this at production: the fixture IDs are
deterministic, and remote mode is intentionally blocked without the explicit
confirmation value.

The runner's database-free cleanup regression test is:

```bash
bash backend/tests/run-pgtap-cleanup.test.sh
```

The full release matrix, native journeys, and evidence requirements live in
the [production-readiness testing matrix](plans/2026-08-14-production-readiness/testing.md).
