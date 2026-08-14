# Alora Launch Checklist

Alora is an Expo and React Native mobile app backed by Supabase, PowerSync, PostgreSQL, EAS, and Sentry. The current build is a polished demo. Production launch work remains.

Estimated work: 4 to 8 engineering weeks, followed by a 2-week private beta and store review.

Legend:

- 🧑 **You**. Needs your identity, accounts, payment details, legal approval, or a product decision.
- 🤖 **Agent**. Can be completed in the repository or command line.
- 🤝 **Together**. The agent prepares the work, then you supply a value or approve the external action.

Never paste production secrets into chat or commit them. Put secrets directly into Supabase, EAS, Sentry, or the local ignored `.env` file.

## Phase 0. Clear release blockers

- [ ] 🤖 **Make the production bundle compile and typecheck.** 1 to 2 days.

  Install Expo-compatible PowerSync dependencies. Remove the dummy module declarations, TypeScript exclusions, and `@ts-nocheck` directives. Fix all resulting errors. Add Android and iOS export checks to CI.

  > Audit `VALIDATION_TASKS.md` tasks VAL-001 and VAL-004. Implement them test first. Do not provision external services or paste secrets. Verify both platform exports.

  **You'll know it worked when:** both platform bundle exports finish with exit code 0 and all live-path files pass strict TypeScript.

- [ ] 🤖 **Complete runtime composition and local-first sync.** 3 to 5 days.

  Replace the silent mock fallback with a fail-closed runtime state. Start PowerSync only for an authenticated live session. Stop and clear it on sign-out. Make pending and synced states truthful.

  > Implement VAL-002 and the sync-state portion of VAL-015. Add lifecycle race tests and prove live configuration never exposes demo family data.

  **You'll know it worked when:** an authenticated production build starts sync, survives offline restart, reconnects, and never shows Maya or Sam unless they are real family data.

- [ ] 🤖 **Complete account, family, invite, and recovery journeys.** 4 to 7 days.

  Build the first-owner family transaction, baby setup, invite deep link redemption, and password recovery. A deep link is a URL that opens the matching app screen.

  > Implement VAL-003 with end-to-end tests for a clean first device and invited second device. Include email confirmation on and off.

  **You'll know it worked when:** two new accounts can create and join one family without manual database rows.

- [ ] 🤖 **Fix backend privacy and atomicity.** 4 to 7 days.

  Move invite redemption and deletion orchestration into retry-safe database operations. Split PowerSync buckets so restricted trust data never reaches limited-caregiver devices.

  > Implement VAL-005, VAL-006, VAL-007, and VAL-014. Add pgTAP concurrency, cross-tenant, and partial-failure cases.

  **You'll know it worked when:** concurrent invite redemption has one winner, deletion retries converge, and restricted rows are absent from a limited user's local database.

- [x] 🤖 **Record the private-beta scope.**

  The private beta preserves the implemented growth charts, pediatrician report, handoff briefing, and limited caregiver role. This readiness pass freezes those surfaces and adds no related features. Public-launch scope remains a post-beta decision.

  **You'll know it worked when:** `alora_updated_prd.md`, `CONTEXT.md`, the remediation PRD, roadmap, README, navigation, and backend roles describe the same beta contract.

- [ ] 🤖 **Upgrade dependencies and close advisories.** 1 to 3 days.

  Start with Expo SDK 54 compatible patch releases. Then perform the smallest supported Expo SDK upgrade needed to clear remaining advisories. Rebuild after each accepted update.

  > Resolve VAL-008 without `npm audit fix --force`. Preserve Expo's supported version matrix and record every remaining advisory with an exploitability decision.

  **You'll know it worked when:** the release audit has no unresolved critical or high finding and both native builds pass.

- [ ] 🤖 **Make CI match the release contract.** 1 to 2 days.

  Add formatting, bundle exports, dependency policy, schema alignment, real coverage, and pgTAP. CI means the automated checks that run before changes merge.

  > Implement VAL-009, VAL-010, and VAL-017. Make the final GitHub Actions gate depend on every required job.

  **You'll know it worked when:** deliberately breaking the bundle, RLS, formatting, or a domain test makes the final CI gate fail.

- [ ] 🤖 **Add accessibility semantics and device checks.** 2 to 4 days.

  Encode roles, labels, selected states, disabled states, and hints in shared controls. Verify screen readers, large text, reduced motion, color contrast, and one-handed touch targets.

  > Implement VAL-012 through shared primitives first. Test VoiceOver on iOS and TalkBack on Android. Record any justified exception.

  **You'll know it worked when:** every interactive control has an announced purpose and state on both platforms.

## Phase 1. Create production accounts and configuration

- [ ] 🧑 **Create the service accounts.** 1 to 2 hours. Supabase, PowerSync, and Sentry have free starter tiers. Apple Developer costs $99 per year. Google Play registration costs $25 once.

  Create a US-region Supabase project, PowerSync instance, and Sentry React Native project. Enroll in Apple Developer and Google Play Console. Enable multifactor authentication on every owner account.

  **You'll know it worked when:** each dashboard is accessible to you and recovery methods are stored outside the repository.

- [ ] 🤝 **Provision the backend from versioned migrations.** 2 to 4 hours.

  Apply the ordered files under `supabase/migrations/` with the Supabase CLI. A migration is a versioned database change that can be applied and audited repeatedly. Keep future schema changes in new migration files.

  **You'll know it worked when:** a fresh staging project can be created from version control and the complete pgTAP suite passes against it.

- [ ] 🤝 **Configure secrets and public settings.** 1 hour.

  Put the Supabase URL and anon key, PowerSync endpoint, Sentry DSN, and privacy-policy URL into EAS environment variables. Put the service-role key only in Supabase function secrets.

  **You'll know it worked when:** `eas env:list` shows the expected variable names, no secret is tracked by Git, and a preview build enters live mode.

## Phase 2. Legal, safety, and store identity

- [ ] 🧑 **Finish legal and safety review.** 1 to 2 weeks of calendar time.

  Fill in the operator, contact, and effective-date fields in the privacy-policy draft. Have a qualified advisor approve crisis-resource and non-clinical copy. Have legal counsel approve the COPPA and state-law posture. Publish the policy at a stable HTTPS URL.

  **You'll know it worked when:** the signed-off policy is public, the in-app link opens it, and issues 13 and 14 are no longer `ready-for-human`.

- [ ] 🤝 **Create store assets and release metadata.** 1 to 3 days.

  Add the final 1024-pixel app icon, Android adaptive icon, splash screen, descriptions, support URL, privacy URL, screenshots, content rating, and data-safety answers. Link the EAS project ID in `app.json`.

  **You'll know it worked when:** Expo config shows every required field and both store records accept the metadata without placeholders.

## Phase 3. Staging and private beta

- [ ] 🤝 **Build staging releases.** 2 to 4 hours plus queue time.

  Use EAS Build for one iOS TestFlight build and one Android internal-testing build. EAS Build is Expo's hosted native build service.

  **You'll know it worked when:** both builds install on clean physical devices and report the expected release to Sentry.

- [ ] 🤝 **Run the two-caregiver smoke test.** 2 hours.

  On two clean devices, sign up, create a family, redeem an invite, log offline, restart offline, reconnect, edit and merge events, verify private check-in isolation, export, revoke, and delete accounts.

  **You'll know it worked when:** every result matches the PRD and neither device contains unauthorized local rows.

- [ ] 🧑 **Operate the private beta.** At least 2 weeks.

  Enroll 3 to 5 known families. Follow `.scratch/launch-readiness/beta-operating-doc.md`. Triage every report and watch Sentry daily.

  **You'll know it worked when:** at least 3 families log daily for 2 weeks, both platforms pass live workflows, and there are 14 days without a logging-affecting crash.

## Phase 4. Store submission and operations

- [ ] 🤝 **Submit the verified release.** 2 hours plus store review.

  Promote the exact beta-tested build. Do not rebuild from a different commit. Apple and Google review can take days and may request changes.

  **You'll know it worked when:** both stores show the same approved version and the production download passes the smoke test.

- [ ] 🧑 **Run first-week operations.** 30 minutes daily.

  Review Sentry, support mail, Supabase usage, PowerSync usage, backups, and store reviews. Keep an incident note for any data-loss, privacy, auth, or sync issue.

  **You'll know it worked when:** every alert has an owner, backups have a tested restore path, and user-impacting incidents are acknowledged within the beta support targets.
