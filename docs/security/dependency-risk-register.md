# Dependency risk register

Updated 2026-08-15.

This register records dependency evidence without copying registry output or secrets. A release build must rerun `cd mobile && npm audit --omit=dev --audit-level=high` from a networked clean checkout and attach the command result to the release evidence.

| Risk | Current evidence | Decision | Owner and expiry |
|---|---|---|---|
| npm advisories in the Expo 54 tree | The SDK-aligned install on 2026-08-15 reported 25 findings (15 high, 10 moderate). A direct `npm audit --omit=dev --audit-level=high` could not reach `registry.npmjs.org`, so severity details still require a networked clean run. | Do not ship a public build until the clean-run audit is reviewed. Apply only Expo-compatible patches. | Release owner. Recheck before every preview build and expire this exception at the first beta distribution. |
| Native PowerSync and OP-SQLite packages | SDK 54 dependency graph is pinned in `mobile/package-lock.json`. `expo-asset` is declared directly because `expo-sqlite` imports it at runtime. | Keep the lockfile committed and run `npx expo install --check` in CI. | Mobile owner. Recheck on every Expo SDK update. |
| Edge Function remote imports | Functions use versioned Supabase JS and Deno standard-library URLs. | `deno task check` and `deno task test` are required CI checks. | Backend owner. Recheck on every function change. |

## Acceptance rule

No `npm audit fix --force` or Expo major upgrade is allowed as a blind remediation. Each changed package must pass the Expo compatibility check, TypeScript, lint, Jest, Android export, and iOS export before the risk is closed.
