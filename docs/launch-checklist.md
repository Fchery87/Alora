# Alora launch checklist

Alora is an Expo/React Native mobile app backed by Supabase Auth/Postgres and
Edge Functions, with PowerSync Cloud providing local-first SQLite sync. EAS
Build produces the installable iOS and Android binaries; Sentry receives
production crash reports.

Estimated operator time before a private beta: 4–8 hours spread across 1–2
days, plus the 2-week beta observation period. This excludes Apple/Google
review time and any dependency remediation.

## What is already proven

- Hosted Supabase migrations through `20260815000600` are applied.
- Hosted pgTAP security suite passes all 74 assertions (`Runner exit status: 0`).
- Mobile typecheck, lint, format, Jest, Expo compatibility, and Android/iOS
  exports pass locally.
- The remaining items below are external provisioning, native-device evidence,
  dependency disposition, or human/legal approval. They cannot be honestly
  marked complete from a source checkout alone.

### Legend

- 🧑 **You** — requires your account, payment details, secret, or approval.
- 🤖 **Agent** — can be performed in the repository or by a safe CLI command.
- 🤝 **Together** — the agent prepares the exact command/configuration and you
  perform the final dashboard click or secret entry.

Never paste a password, service-role key, JWT secret, Sentry auth token, or
database URI containing a password into chat, Git, screenshots, or evidence
files. A client `EXPO_PUBLIC_*` value is bundled into the app; it is not a
server secret.

## Phase 0 — establish the release evidence folder

- [ ] 🤖 **(5 min) Record the code and database baseline.** From the repository
  root, run:

  ```bash
  git status --short
  git log -1 --oneline
  ```

  Store the output and the hosted pgTAP result under
  `.scratch/launch-readiness/evidence/<YYYY-MM-DD>/` without credentials or
  personal data.

  > Agent prompt: “Create a redacted release-evidence index for the current
  > Alora commit. Include the commit SHA, local validation commands, and a
  > placeholder for hosted pgTAP, CI, native, Sentry, and store evidence. Never
  > copy secrets, emails, tokens, or family data.”

  **You'll know it worked when:** the folder contains a redacted evidence
  index, the worktree is clean, and the index points to the hosted 74/74
  pgTAP run.

## Phase 1 — deploy the Supabase Edge Functions (no Docker required)

Supabase's API deployment path does not require a local Postgres server or
Docker. The `--use-api` flag is the important part for this machine.

- [ ] 🧑 **(5 min) Confirm the production Supabase project.** Open the Supabase
  dashboard for the already-linked project (`toygdtupkzsbxqroxfia`), verify the
  region and project URL, and open **Edge Functions**. Do not use a staging
  project for the beta evidence.

  **You'll know it worked when:** the dashboard project ref matches the project
  used by the hosted pgTAP run and the database migration history is current.

- [ ] 🤝 **(5 min) Authenticate and link the CLI.** From `backend/`:

  ```bash
  supabase login
  supabase link --project-ref <your-project-ref>
  ```

  **You'll know it worked when:** `supabase link` finishes without an invalid
  project-ref error and names the intended project.

- [ ] 🧑 **(5 min) Store the service-role key only in Supabase.** In the
  dashboard, go to **Project Settings → API**, copy the `service_role` key, and
  add it to **Edge Functions → Secrets** as `SUPABASE_SERVICE_ROLE_KEY`.
  Alternatively, enter it locally without putting it in shell history:

  ```bash
  read -rsp 'Service-role key: ' SUPABASE_SERVICE_ROLE_KEY; printf '\n'
  supabase secrets set "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
  unset SUPABASE_SERVICE_ROLE_KEY
  ```

  **You'll know it worked when:** `supabase secrets list` shows the secret name
  (not its value). The key must never appear in the mobile `.env` file.

- [ ] 🤝 **(10 min) Deploy each function through the Supabase API.** Run from
  `backend/`:

  ```bash
  supabase functions deploy generate-invite --use-api
  supabase functions deploy redeem-invite --use-api
  supabase functions deploy delete-account --use-api
  ```

  **You'll know it worked when:** all three dashboard functions show a current
  deployment and no deploy command asks for Docker.

- [ ] 🤝 **(10–15 min) Smoke-test the function boundary.** Use two synthetic
  beta accounts: owner issues an invite, partner redeems it, and a disposable
  account exercises account deletion. Do not delete a real owner account.
  Inspect **Edge Functions → Logs** for HTTP 2xx responses and sanitized errors.

  **You'll know it worked when:** invite issue, single-use redemption, and
  disposable-account deletion all complete through the deployed functions, and
  logs contain no access tokens, passwords, or private check-in content.

References: [Supabase Edge Function deployment](https://supabase.com/docs/guides/functions/quickstart)
and [Supabase function secrets](https://supabase.com/docs/guides/functions/secrets).

## Phase 2 — provision PowerSync Cloud

PowerSync uses Postgres logical replication to feed each device's local SQLite
database. This is a hosted PowerSync setup; no local Docker installation is
needed.

- [ ] 🧑 **(5 min) Create the PowerSync Cloud instance.** In the PowerSync
  dashboard, create an instance in a region compatible with the Supabase
  project. Name it `alora-beta` and keep the instance URL private until it is
  entered into the app configuration.

  **You'll know it worked when:** the instance is provisioned and has a
  Database Connections and Client Auth section.

- [ ] 🧑 **(10 min) Create the dedicated replication role and publication.** In
  Supabase **SQL Editor**, run this once with a long random password generated
  by a password manager. Replace the placeholder locally; never commit it:

  ```sql
  create role powersync_role
    with replication bypassrls login password '<generate-a-unique-password>';
  grant select on all tables in schema public to powersync_role;
  alter default privileges in schema public
    grant select on tables to powersync_role;
  create publication powersync for all tables;
  ```

  If the role or publication already exists, stop and inspect the existing
  object instead of creating a second one. `BYPASSRLS` is for PowerSync's
  replication reader; user-specific filtering still comes from the deployed
  sync rules and the app's Supabase authorization path.

  **You'll know it worked when:** the SQL completes, `powersync_role` has only
  the intended read/replication access, and publication `powersync` exists.

- [ ] 🤝 **(10 min) Connect PowerSync to Supabase.** In PowerSync **Database
  Connections → Connect to Source Database → Postgres**, paste the **Direct
  connection** URI from Supabase **Connect**. Replace only the username and
  password with `powersync_role` and its generated password. Use SSL mode
  `verify-full`, click **Test Connection**, then **Save Connection**.

  Do not use the Supabase pooler URI for this PowerSync source connection. Keep
  the URI on one line if you use it in a tool.

  **You'll know it worked when:** PowerSync's connection test succeeds and the
  instance reports a healthy source connection.

- [ ] 🤝 **(10 min) Enable Supabase Auth in PowerSync.** In PowerSync **Client
  Auth**, enable **Use Supabase Auth**. Leave the legacy JWT secret empty when
  the Supabase project uses the newer JWT signing keys; otherwise enter the
  legacy JWT secret directly in the dashboard. Click **Save and Deploy**.

  **You'll know it worked when:** the client-auth configuration is deployed and
  the dashboard accepts a Supabase user JWT during its connection test.

- [ ] 🤝 **(10 min) Deploy the Alora sync rules.** Paste the exact contents of
  `backend/sync-rules.yaml` into the PowerSync sync configuration and deploy it.
  Do not hand-edit the private buckets: `parent_check_ins` and
  `parent_reflections` must remain user-private; invite tokens must remain
  owner-only.

  **You'll know it worked when:** PowerSync reports a deployed configuration
  containing family, trust, owner-trust, user-private, and global data paths.

References: [PowerSync Supabase integration](https://docs.powersync.com/integrations/supabase/guide),
[PowerSync setup](https://docs.powersync.com/intro/setup-guide), and
[Supabase source connection](https://docs.powersync.com/configuration/source-db/connection).

## Phase 3 — configure mobile and create installable builds

- [ ] 🤝 **(10 min) Configure non-secret client environment.** Copy the template
  and fill these values in your local, gitignored `mobile/.env`:

  ```bash
  cd mobile
  cp .env.example .env
  # set EXPO_PUBLIC_SUPABASE_URL
  # set EXPO_PUBLIC_SUPABASE_ANON_KEY
  # set EXPO_PUBLIC_POWERSYNC_URL
  # set EXPO_PUBLIC_SENTRY_DSN after Phase 6
  # set EXPO_PUBLIC_PRIVACY_POLICY_URL after Phase 7
  ```

  These `EXPO_PUBLIC_*` values are intentionally client-visible. Never add the
  Supabase service-role key, database password, PowerSync replication password,
  or Sentry auth token here.

  **You'll know it worked when:** `mobile/.env` exists locally, is ignored by
  Git, and contains no server credential.

- [ ] 🤝 **(10 min) Set EAS environments.** In the Expo dashboard, open the
  Alora project → **Environment variables** and add the three Supabase/PowerSync
  client values to the `preview` and `production` environments. Add the Sentry
  DSN and privacy-policy URL when those phases are ready. Keep build-upload
  credentials and Sentry auth tokens as secret/private values.

  **You'll know it worked when:** the intended variable names are visible in
  the correct EAS environment and their values are not printed in the dashboard
  list or build logs.

- [ ] 🤝 **(15–30 min) Create an internal preview build.** Run:

  ```bash
  eas login
  eas build --platform android --profile preview
  eas build --platform ios --profile preview
  ```

  Android's preview profile creates an APK. iOS internal distribution requires
  registered test devices/ad-hoc provisioning; use the EAS device prompt or
  `eas device:create` when asked.

  **You'll know it worked when:** both builds finish, each has an install URL,
  and the installed app reaches the authenticated Alora tabs instead of demo
  mode.

- [ ] 🤝 **(15 min) Confirm signing ownership before a store build.** In EAS
  credentials, verify that the iOS bundle ID and Android application ID are both
  `app.alora.mobile`, and that the Apple Developer and Google Play accounts are
  owned by the release owner. Let EAS manage signing, but do not let a personal
  account become the only recovery path.

  **You'll know it worked when:** EAS shows valid iOS distribution and Android
  upload credentials for the production owner, and a preview install succeeds
  on a physical device.

References: [EAS build profiles](https://docs.expo.dev/build/eas-json/),
[internal distribution](https://docs.expo.dev/build/internal-distribution/), and
[EAS environment variables](https://docs.expo.dev/eas/environment-variables/).

## Phase 4 — run the native two-device and offline/reconnect journey

Use synthetic accounts and a disposable family. Record build number, OS version,
device model, network state, timestamp, and pass/fail. Do not record names,
emails, invite codes, tokens, or baby data.

- [ ] 🧑 **(10 min) Prepare the two-device test.** Device A is the owner and
  Device B is the partner. Install the same preview build on both. Create the
  family on A, issue an invite, and redeem it on B.

  **You'll know it worked when:** both devices show the same family and baby,
  while each account has its intended role.

- [ ] 🤝 **(15 min) Prove offline durability.** On A, enable airplane mode,
  create a care event, force-kill the app, reopen it, and confirm the event is
  still visible with a pending/offline indicator.

  **You'll know it worked when:** the event survives a cold restart without a
  network and no credential or private check-in appears in logs.

- [ ] 🤝 **(15 min) Prove reconnect and convergence.** Disable airplane mode on
  A, wait for upload, then open or refresh B. Edit the event on both devices,
  restart both, and verify the documented last-write-wins behavior plus retained
  `event_edits` history.

  **You'll know it worked when:** the pending count clears, B receives A's
  event, and both devices converge to the same final state after restart.

- [ ] 🤝 **(15 min) Prove duplicate decisions.** Create overlapping synthetic
  events and exercise both keep-both and merge. Restart both devices and verify
  the decision remains available.

  **You'll know it worked when:** no event silently disappears and the duplicate
  resolution is present on both devices after a cold start.

- [ ] 🤝 **(15 min) Prove privacy buckets.** Create a private check-in on A;
  confirm B cannot see it. Confirm a limited-caregiver build cannot create a
  private check-in, read audit history, or issue an invite.

  **You'll know it worked when:** privacy is correct in the UI and after a
  logout/login plus local database refresh.

- [ ] 🤝 **(15 min) Prove deletion propagation.** On a disposable family, delete
  the owner account. Verify the deterministic partner ownership transfer, or
  sole-owner family deletion, and that former-owner personal data is gone.

  **You'll know it worked when:** the deletion request reaches completed,
  ownership behavior matches the 74/74 pgTAP contract, and no stale owner
  profile remains.

## Phase 5 — run native accessibility checks

- [ ] 🧑 **(30 min) Run VoiceOver and TalkBack.** On iOS enable **Settings →
  Accessibility → VoiceOver**. On Android enable **Settings → Accessibility →
  TalkBack**. Walk sign-in, onboarding, tabs, event creation/editing, invite,
  error/retry, account deletion, and the trust/privacy screens.

  **You'll know it worked when:** every control announces its purpose and
  state, focus order follows the visual order, dialogs have a reachable close
  action, and no action depends on color alone.

- [ ] 🧑 **(20 min) Test large text and reduced motion.** Set the largest
  practical system text size and enable Reduce Motion on both platforms.

  **You'll know it worked when:** text does not clip, buttons remain reachable,
  content scrolls, and animations become static or reduced without breaking a
  task.

- [ ] 🤝 **(15 min) Capture the accessibility matrix.** Use the matrix in
  `docs/plans/2026-08-14-production-readiness/testing.md`; attach only redacted
  screenshots or a pass/fail table to the evidence folder.

  **You'll know it worked when:** every critical screen has a named tester,
  device/OS, date, and pass/fail result, with zero open blocker findings.

## Phase 6 — observe CI and disposition dependency advisories

- [ ] 🤖 **(5 min) Run the same checks locally from a clean dependency install.**
  ```bash
  cd mobile
  npm ci
  npm run format
  npm run typecheck
  npm run lint
  npm test -- --runInBand
  npx expo install --check
  npm run export:android
  npm run export:ios
  npm audit --omit=dev --audit-level=high
  cd ../backend
  deno task check
  deno task test
  ```

  > Agent prompt: “Run the repository's release checks from a clean checkout,
  > report the first failing command with its complete non-secret error, and do
  > not modify lockfiles or dependencies without an explicit remediation plan.”

  **You'll know it worked when:** every non-advisory command exits 0 and the
  audit output is saved without credentials.

- [ ] 🧑 **(10 min) Observe one clean GitHub Actions run.** Open the repository's
  **Actions → CI** workflow for the release commit. The required **CI gate** must
  pass: format, TypeScript, lint, tests/coverage, Expo compatibility, Android
  and iOS exports, and backend Deno checks.

  **You'll know it worked when:** the workflow is green and the branch rule
  requires the `CI gate` status before merging to `main`.

- [ ] 🤝 **(10 min) Enable hosted pgTAP in CI, if desired.** Add repository
  secrets `PGLTAP_DATABASE_URL` and `PGLTAP_DATABASE_PASSWORD` using a dedicated
  test database. The current workflow runs this job only when the URL secret is
  present, and it is intentionally not part of `ci-ok` until you choose to make
  it a required branch check.

  **You'll know it worked when:** the hosted job reports all 74 assertions and
  the URL/password never appear in logs. Do not use a personal production
  database as a CI fixture.

- [ ] 🤝 **(30–90 min) Resolve or formally accept advisories.** The current
  register records a networked audit requirement and previously observed high
  and moderate findings. For each finding: upgrade an Expo-compatible direct
  dependency and rerun the full checks; or document why it is transitive/not
  exploitable, the mitigation, owner, and an expiry date in
  `docs/security/dependency-risk-register.md`.

  **You'll know it worked when:** there are no unresolved critical/high runtime
  advisories, or every exception is written, approved, time-bounded, and not
  hiding a critical exploit.

## Phase 7 — verify Sentry ingestion and privacy-safe diagnostics

- [ ] 🧑 **(10 min) Create the Sentry project.** Create a React Native project
  in Sentry, record the organization slug, project slug, and DSN. Configure data
  scrubbing so event payloads cannot contain emails, invite codes, tokens,
  check-in text, or baby names.

  **You'll know it worked when:** the project exists with an explicit retention
  and scrubbing policy, and the DSN is available for the preview/production EAS
  environment.

- [ ] 🤝 **(10 min) Configure build-time source-map upload.** Put the DSN in
  `EXPO_PUBLIC_SENTRY_DSN` and put `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
  `SENTRY_PROJECT` only in the EAS build environment as private values. The
  repository already includes the Sentry config plugin and DSN-gated runtime;
  the auth token is for build upload, not the mobile app.

  **You'll know it worked when:** a production-style EAS build no longer emits
  the “missing Sentry organization/project” warning and Sentry shows the build's
  release artifacts/source maps.

- [ ] 🤝 **(15 min) Send one controlled test event.** Install a non-production
  preview build, trigger an intentional test error through the existing error
  boundary or a temporary internal-only test path, then remove/disable that path
  before beta. Check Sentry for the event, release, platform, and environment.

  **You'll know it worked when:** the event appears within a few minutes,
  stack frames map to source files, and the event contains no private user data.

References: [Sentry source-map upload guidance](https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/sourcemaps/uploading/esbuild)
and [Sentry token permissions](https://docs.sentry.io/api/permissions/).

## Phase 8 — privacy policy, store declarations, and signing

- [ ] 🧑 **(60–120 min) Publish the privacy policy.** Publish a stable HTTPS
  privacy-policy URL describing Supabase, PowerSync, Sentry, Expo/EAS, data
  categories (account, family membership, care events, private check-ins,
  diagnostics), retention, support contact, export, and account deletion.
  Add the URL to `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS and verify the in-app
  trust/privacy screen opens it.

  **You'll know it worked when:** the URL works in an incognito browser, matches
  actual SDK behavior, and the app opens the same policy on iOS and Android.

- [ ] 🧑 **(30–60 min) Complete Apple declarations.** In App Store Connect,
  create the app for bundle ID `app.alora.mobile`, complete App Privacy
  details, age rating, support URL, privacy-policy URL, account deletion
  instructions, and the beta/TestFlight notes. Declare Sentry and the other
  processors consistently with the policy.

  **You'll know it worked when:** App Store Connect accepts the metadata with no
  missing privacy or account-deletion fields.

- [ ] 🧑 **(30–60 min) Complete Google Play declarations.** In Play Console,
  create the app for package `app.alora.mobile`, complete **App content → Data
  safety**, privacy-policy URL, target audience/content rating, and account
  deletion. Ensure declarations match the actual SDKs and policy.

  **You'll know it worked when:** Play Console shows all required declarations
  complete and the account-deletion URL/path works without support intervention.

  Reference: [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
  and [Google Play user-data policy](https://support.google.com/googleplay/android-developer/answer/10144311).

- [ ] 🤝 **(20 min) Produce store-signed candidates.** After the preview journey
  passes, run the production profiles:

  ```bash
  eas build --platform android --profile production
  eas build --platform ios --profile production
  ```

  Install the artifacts in a private/internal track first. Submit only after
  privacy, support, screenshots, metadata, and beta exit criteria are approved.

  **You'll know it worked when:** both production builds install, show the
  expected version/build number, connect to the production backend, and do not
  fall back to demo mode.

## Phase 9 — private-beta exit and go/no-go

- [ ] 🧑 **(15 min) Recruit 3–5 consenting test families.** Explain that this is
  a private beta, what data is collected, how to delete an account, and how to
  report a problem. Use synthetic or minimal real data and obtain consent.

  **You'll know it worked when:** every tester has a recorded consent/feedback
  contact and a tested deletion path.

- [ ] 🤝 **(2 weeks) Observe the beta.** Track onboarding completion, invite
  success, offline event survival, reconnect convergence, private-check-in
  isolation, deletion completion, support response time, and crash-free sessions.
  The beta target is 14 consecutive crash-free days.

  **You'll know it worked when:** the two-device tracer remains green across the
  beta, Sentry has no untriaged release-blocking issue, and the 14-day criterion
  is met.

- [ ] 🧑 **(30 min) Hold the go/no-go review.** Block release for any unresolved
  security, privacy, data-loss, account-access, ownership-transfer, signing, or
  crash issue. Record the decision, approver, build IDs, CI URL, pgTAP evidence,
  native/accessibility matrix, dependency disposition, Sentry event, privacy
  policy URL, and store declaration status.

  **You'll know it worked when:** one person is accountable for the decision,
  every gate is either green or has a documented time-bounded exception, and the
  approved build cannot change without restarting this review.

## Operational rollback

If PowerSync or a function is unhealthy, stop beta installs, keep the Supabase
database intact, and disable only the affected EAS environment or PowerSync
instance while investigating. Do not delete the project to “reset” a failure.
For a disposable test family, use the app's deletion flow and record the result;
never run destructive tests against the production owner account.
