#!/usr/bin/env bash
# Alora — pgTAP RLS/security test runner
#
# Local mode creates a throwaway PostgreSQL database and needs no Supabase CLI.
# Remote mode runs against a dedicated hosted PostgreSQL/Supabase database and
# does not need Docker. Remote mode is opt-in and requires an explicit safety
# acknowledgement because the fixture IDs are deterministic.

set -Eeuo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
TEST_FILE="${HERE}/../../supabase/tests/01-rls-security.test.sql"
MIGRATION_FILE="${HERE}/../../supabase/migrations/20260814000100_alora_baseline.sql"
AUTH_SUPPORT_FILE="${HERE}/../../supabase/tests/support/00-mock-auth.sql"
LOCAL_DB="${PGDATABASE:-alora_pgtap}"
REMOTE_URL="${PGLTAP_DATABASE_URL:-}"
REMOTE_CONFIRMATION="I_UNDERSTAND_THIS_IS_A_DEDICATED_TEST_DATABASE"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: required command not found: $1" >&2
    return 1
  }
}

check_tap_result() {
  local -r output_file="$1"
  if grep -Eq '(^|[[:space:]])not ok([[:space:]]|$)|# Failed tests: [1-9]' "$output_file"; then
    echo "ERROR: pgTAP reported one or more failed assertions." >&2
    return 1
  fi
}

run_suite() {
  local output_file
  output_file="$(mktemp)"
  trap 'rm -f -- "$output_file"' RETURN

  set +e
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=0 -f "$TEST_FILE" 2>&1 | tee "$output_file"
  local -r psql_status="${PIPESTATUS[0]}"
  set -e

  if ((psql_status != 0)); then
    echo "ERROR: psql exited with status ${psql_status}." >&2
    return "$psql_status"
  fi
  check_tap_result "$output_file"
}

run_remote() {
  [[ "${PGLTAP_REMOTE_CONFIRM:-}" == "$REMOTE_CONFIRMATION" ]] || {
    echo "ERROR: remote mode requires PGLTAP_REMOTE_CONFIRM=${REMOTE_CONFIRMATION}" >&2
    echo "       Use a dedicated disposable database, never production." >&2
    return 1
  }

  PSQL_ARGS=("$REMOTE_URL" -X -q)
  echo "==> running pgTAP against the explicitly confirmed remote test database"
  echo "    schema migration: ${PGLTAP_APPLY_MIGRATION:-0}"
  echo "==> enabling pgTAP"
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -c "create extension if not exists pgtap;"

  if [[ "${PGLTAP_APPLY_MIGRATION:-0}" == "1" ]]; then
    if [[ "${PGLTAP_USE_AUTH_MOCK:-0}" == "1" ]]; then
      echo "==> applying standalone auth support"
      psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -f "$AUTH_SUPPORT_FILE"
    fi
    echo "==> applying canonical baseline migration"
    psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
  fi

  # A hosted Supabase project already has these grants. They are harmless on a
  # dedicated test database and are required for a plain PostgreSQL target.
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -c "grant usage on schema public to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated; revoke update on families from authenticated; grant update (seat_limit) on families to authenticated;"
  run_suite
}

run_local() {
  require_command dropdb
  require_command createdb

  PSQL_ARGS=(-d "$LOCAL_DB" -X -q)
  trap 'dropdb --if-exists "$LOCAL_DB" >/dev/null 2>&1 || true' EXIT

  echo "==> (re)creating throwaway database '${LOCAL_DB}'"
  dropdb --if-exists "$LOCAL_DB"
  createdb "$LOCAL_DB"

  echo "==> installing pgTAP"
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -c "create extension if not exists pgtap;"

  echo "==> applying local auth mock + canonical baseline migration"
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -f "$AUTH_SUPPORT_FILE"
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
  psql "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -c "grant usage on schema public to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated; revoke update on families from authenticated; grant update (seat_limit) on families to authenticated;"

  echo "==> running pgTAP suite"
  run_suite
  echo "==> cleanup: dropping '${LOCAL_DB}'"
}

require_command psql
if [[ -n "$REMOTE_URL" ]]; then
  run_remote
else
  run_local
fi
