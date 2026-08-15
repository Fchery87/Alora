#!/usr/bin/env bash
# Regression test: a passing hosted suite must return success after cleanup.

set -Eeuo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
RUNNER="${HERE}/run-pgtap.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf -- "$TMP_DIR"' EXIT

cat >"${TMP_DIR}/psql" <<'EOF'
#!/usr/bin/env bash
printf '1..1\nok 1 - mock pgTAP assertion\n'
EOF
chmod +x "${TMP_DIR}/psql"

if output="$(
  PATH="${TMP_DIR}:${PATH}" \
  PGLTAP_DATABASE_URL='postgresql://test.invalid/postgres' \
  PGLTAP_REMOTE_CONFIRM='I_UNDERSTAND_THIS_IS_A_DEDICATED_TEST_DATABASE' \
  bash "$RUNNER" 2>&1
)"; then
  case "$output" in
    *'ok 1 - mock pgTAP assertion'*) ;;
    *)
      printf 'FAIL: runner did not execute the mock pgTAP suite\n%s\n' "$output" >&2
      exit 1
      ;;
  esac
else
  printf 'FAIL: runner exited nonzero after a passing mock suite\n%s\n' "$output" >&2
  exit 1
fi
