# Phase 12: Package the App and Run the Beta Gate

## Goal

Produce store-representative iOS and Android builds, complete release metadata and privacy configuration, and require a measured family beta before public launch.

## Why This Phase Comes Last

Packaging should validate the production system, not compensate for unfinished runtime or backend contracts. The beta gate needs stable builds, observability, privacy behavior, and repeatable tracer evidence.

## Release Boundary

The first release includes the journeys marked committed in `alora_updated_prd.md`, `CONTEXT.md`, and `docs/backend-contract.md` after Phase 1 reconciliation.

Do not expand growth tracking, reporting, clinical interpretation, or new handoff features during this phase. If an implemented deferred feature remains in the binary, it must have an explicit support and privacy decision.

## Files

- Update `mobile/app.json`.
- Update `mobile/eas.json`.
- Create or update store assets under `mobile/assets/`.
- Update `docs/privacy-policy-draft.md`.
- Update `docs/launch-checklist.md`.
- Update `VALIDATION_TASKS.md`.
- Create `.scratch/production-beta/beta-plan.md`.
- Create `.scratch/production-beta/evidence-index.md`.

## Tasks

### 1. Complete application identity and native metadata

Set final bundle and package identifiers, versioning policy, supported orientations, icons, splash assets, deep-link scheme, associated domains where required, permission strings, and privacy manifest inputs.

Run `eas init` only with the approved Expo organization and project. Treat the resulting project identifier as release configuration that must match the intended account.

### 2. Define build profiles and environment boundaries

Create development, internal preview, and production profiles. Pin runtime and update behavior. Keep production signing and environment values out of Git.

Configure Supabase, PowerSync, error reporting, and Expo secrets directly in their approved control planes. Verify variable names and access without printing values into chat, logs, screenshots, or evidence files.

### 3. Finish privacy and store declarations

Replace all privacy-policy placeholders. Align data collection, retention, deletion, diagnostics, and caregiver sharing statements with shipped behavior.

Complete Apple privacy nutrition labels, Google Play Data Safety, age and content ratings, support contact, account-deletion instructions, and review notes. Legal or product ownership must approve the final declarations.

### 4. Build store-representative artifacts

Create internal iOS and Android builds from the release commit. Install them through the same distribution path intended for testers.

Verify deep links, password recovery, invite redemption, background and foreground sync, offline queueing, notification or permission prompts if present, crash ingestion, and production API routing.

### 5. Run the two-device tracer

Use two real devices and two caregiver accounts. Complete the full tracer in `testing.md` while alternating offline and online states.

Capture timestamps, build identifiers, device and OS versions, account roles, expected outcomes, actual outcomes, and sanitized evidence links. Do not capture baby names, check-in text, tokens, or authentication details.

### 6. Run the family beta

Recruit three to five consenting test families. Run the beta for at least two weeks. Require at least 14 consecutive crash-free days on the release candidate before the public submission decision.

Track onboarding completion, successful invite pairing, logging reliability, duplicate rate, sync recovery, check-in privacy incidents, deletion outcomes, crashes, and support burden. Define owners and stop conditions before distribution.

### 7. Hold the go or no-go review

Review every open item in `VALIDATION_TASKS.md` and `docs/launch-checklist.md`. Every unresolved blocker needs an owner, severity, evidence, and explicit launch decision.

Do not submit while a security, privacy, data-loss, account-access, ownership, or crash blocker is open.

## Static Verification

Run:

- `cd mobile && npx expo config --type public`
- `cd mobile && npx expo-doctor`
- `cd mobile && npm run export:android`
- `cd mobile && npm run export:ios`
- The full required CI pipeline from Phase 11.

Review the resolved Expo configuration for correct identifiers, routes, assets, permissions, and environment selection. Confirm no secret is embedded in public Expo configuration unless it is explicitly safe for a client application.

## Runtime Verification

Install the release candidate on at least one supported iOS device and one supported Android device. Run the tracer, accessibility matrix, account recovery, role privacy checks, sync recovery, and account deletion.

Confirm crash and error events arrive in the production observability project with release and environment tags. Confirm sensitive check-in text, invite tokens, and authentication material are absent.

The following steps require human-controlled accounts or judgment:

- Expo organization and EAS project ownership.
- Apple and Google developer accounts and signing.
- Production service secrets.
- Legal and privacy approval.
- Store privacy and data-safety forms.
- Beta recruitment, consent, and support.
- Final submission approval.

## Exit Criteria

- Store-representative iOS and Android builds pass the full tracer.
- Production deep links and service routing are verified.
- Privacy declarations match shipped behavior.
- Observability works without leaking sensitive data.
- The beta completes with three to five families and 14 consecutive crash-free days.
- Every launch blocker is closed or has an explicit no-go decision.
