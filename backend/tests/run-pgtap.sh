#!/usr/bin/env bash
# Alora — pgTAP RLS/security test runner
# ---------------------------------------------------------------------------
# Creates a throwaway database, applies the local auth mock, the production
# schema + RLS policies, then runs the pgTAP suite (backend/tests/01-rls-security.sql)
# as the postgres superuser. Identity is simulated per-test via
# `set local role authenticated` + request.jwt.claims (see the suite header).
#
# Requirements:
#   * PostgreSQL running locally, with `psql`/`createdb`/`dropdb` on PATH
#     (Debian/Ubuntu: apt install postgresql postgresql-client)
#   * pgTAP extension (Debian/Ubuntu: apt install postgresql-<ver>-pgtap)
#   * The current OS user must be able to connect as a superuser
#     (e.g. `sudo -u postgres ./run-pgtap.sh`).
#
# Usage:
#   ./run-pgtap.sh                 # uses database "alora_pgtap"
#   PGDATABASE=my_db ./run-pgtap.sh
#
# On success the last line is "All tests successful." (pgTAP summary).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="${PGDATABASE:-alora_pgtap}"
PSQL=(psql -v ON_ERROR_STOP=1 -X -q)

echo "==> (re)creating throwaway database '${DB}'"
dropdb --if-exists "${DB}"
createdb "${DB}"

echo "==> installing pgTAP"
"${PSQL[@]}" -d "${DB}" -c "create extension if not exists pgtap;"

echo "==> applying local auth mock + schema + RLS"
"${PSQL[@]}" -d "${DB}" -f "${HERE}/00-mock-auth.sql"
"${PSQL[@]}" -d "${DB}" -f "${HERE}/../schema.sql"
"${PSQL[@]}" -d "${DB}" -f "${HERE}/../rls.sql"
# Mirror Supabase grants (authenticated has broad table grants; RLS is the
# fine-grained gate). Applied after the tables exist.
"${PSQL[@]}" -d "${DB}" -c "grant usage on schema public to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated;"

echo "==> running pgTAP suite"
psql -X -q -d "${DB}" -v ON_ERROR_STOP=0 -f "${HERE}/01-rls-security.sql"

echo "==> cleanup: dropdb --if-exists ${DB}"
