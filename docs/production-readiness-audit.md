# Alora — Production Readiness Audit

> **Date:** Audit performed against the current codebase (demo-mode build).
> **Scope:** Full six-phase audit — project understanding, implementation review, user-workflow mapping, competitive benchmarking, enterprise-readiness checklist, and final scored report.

---

## Project Summary

**Alora** is a cross-platform (iOS/Android) Expo + React Native app for first-time parents with babies aged 0–9 months, built around a local-first baby-care logging workflow (feed/diaper/sleep) with two-caregiver handoff coordination and a private, non-clinical daily check-in. The app is designed to run offline-first (on-device SQLite as source of truth, synced to Supabase Postgres via PowerSync) and currently ships in **demo mode** — all screens read from a mock repository, with the live Supabase + PowerSync backend designed but not provisioned. It targets a US-only consumer launch.

---

## What's Working Well

The demo-mode experience is **genuinely polished** — well above typical prototype quality:

1. **Design system is professional-grade.** `theme/tokens.ts` defines a complete token system ("Quiet Dawn" dawn/night palettes, typography with Fraunces + Hanken Grotesk, spacing/radius/motion constants). `ThemeProvider.tsx` is clean and both schemes are fully implemented. Design is consistent across all 11 screens.

2. **Local-first persistence actually works.** Care events (`localCareEventStore.ts`), sleep timer (`localSleepTimerStore.ts`), and reminder preferences (`localReminderPreferenceStore.ts`) all persist to Expo SQLite and survive app restarts. The hydration logic in `mockRepository.ts` (lines 40–83) correctly merges stored events with seed data.

3. **Clean data-layer abstraction.** The `AloraRepository` interface (`data/repository.ts`) decouples screens from data sources. All screens consume hooks via `useData.ts` — swapping the adapter requires changing one line. This is textbook strangler-pattern readiness.

4. **Notification scheduling is well-engineered.** `lib/notifications.ts` + `lib/reminderSchedule.ts` implement quiet-hours-aware notification planning (windowed daily one-shots at allowed hours vs. repeating interval triggers). It is the most-tested code in the repo.

5. **Backend SQL is carefully designed.** `schema.sql` encodes the 2-seat cap, soft-delete tombstones, invite token lifecycle, edit history. `rls.sql` double-enforces the sync-rules at the DB layer. `sync-rules.yaml` cleanly separates family/private/global buckets.

6. **Error/loading/empty states are handled** on Home (`HomeSkeleton`, error CTA), Timeline (loading skeletons, empty state, error retry), Reminders, Trust. Check-in screen has proper privacy framing + non-clinical disclaimer + crisis resources.

7. **TypeScript strict mode passes clean** (`tsc --noEmit`, zero errors). No `any` types in production code. No hardcoded secrets. No `console.log` in app code.

8. **Thoughtful UX details:** hold-to-delete animation (`delete-account.tsx`), spring confirm badges, staggered card reveals, breathing orb, haptic feedback throughout.

---

## Critical Issues (🔴) — Blocks production launch

### 1. The core value proposition is not functional: no live backend, incomplete sync adapter

The PRD's entire reason for existing is two-caregiver local-first coordination. But:

- `data/useData.ts:10` hardwires `export const repository = mockRepository` — the app runs on in-memory mock data only.
- `data/supabaseRepository.ts` implements only **3 of 19** interface methods (`getTimeline`, `getRecentActivity`, `getBabyStatus`). The remaining 16 methods (`createEvent`, `startSleep`, `stopSleep`, `updateEvent`, `softDeleteEvent`, `createCheckIn`, `setReminder`, `generateInvite`, `revokeInvite`, `deleteAccount`, `exportMyData`, etc.) **do not exist**. If you swapped it in today, the app would crash.
- It is also **excluded from TypeScript checking** (`tsconfig.json:20-21`), so type-safety for the entire live path is unverified.
- No Supabase project provisioned, no PowerSync deps installed, no `.env` file exists.

### 2. No version control whatsoever

There is no git repository (`git log` exits 128), no root `.gitignore`, and no commit history. There is **no rollback strategy**, no change tracking, no blame capability. For a product handling sensitive baby data and PII, shipping without VCS is unconscionable.

### 3. RLS authorization bypass in `members_self_join` policy

`backend/rls.sql:76` — `create policy members_self_join on family_members for insert with check (user_id = auth.uid())`. This policy allows **any authenticated user to insert themselves as `role = 'owner'` into ANY `family_id`** — it checks only that the inserting `user_id` is the caller's own, but does not verify an invitation exists, does not check the family is theirs, and does not constrain the `role` column. A knowledgeable attacker who guesses or obtains a `family_id` (a UUID, but one they might receive via a shared invite link) could bypass the entire invite flow and gain owner access to another family's baby data. The `redeem-invite` edge function is the intended path, but RLS must be defense-in-depth — this policy is a hole in the last line of defense.

### 4. No CI/CD pipeline and no automated test gate

There is no `.github/workflows/`, no pre-commit hooks, no automated build verification. The only verification is `npm run typecheck` + `npm test` run manually. With 6 tests total (covering only SQLite round-trip and reminder scheduling), the actual app behavior — auth, event creation, conflict resolution, deletion — is completely untested. A regression could ship undetected.

### 5. No invite token issuance mechanism exists

The mock's `generateInvite()` (`mockRepository.ts:147-152`) cycles through hardcoded codes (`["M4-Q2X", "L8-P6C", ...]`). The backend has a `redeem-invite` edge function and an `invitation_tokens` table, but **no function or mechanism generates the token `code` string**. There is no `issue-invite` edge function, and the `code` column has no default generation logic. The owner would need to manually insert a row with a self-generated code via raw SQL, or this feature is incomplete.

---

## Important Issues (🟡) — Quality and UX gaps

### 6. Hardcoded demo data baked into production screens

Multiple screens contain literal mock strings that would show to real users:

- `app/(tabs)/index.tsx:97` — `"Good morning, Alex."` (hardcoded name)
- `app/(tabs)/index.tsx:138` — `"Next feed likely around 3:15pm"` (hardcoded prediction, not computed)
- `app/(tabs)/index.tsx:155` — `"1 change syncing · last synced 14m ago"` (static text, not real sync state)
- `app/(tabs)/settings.tsx:53` — `"Maya's family · 2 caregivers"`, hardcoded member rows "Alex", "Sam"
- `app/(tabs)/log.tsx:108` — Repeat-last card shows `"Bottle · 120 ml · Sam, 2h ago"` regardless of actual last event
- `lib/notifications.ts:102` — Bedtime notification body: `"Start Maya's bedtime wind-down."` (hardcoded baby name)

These are fine for demo, but every one needs to be wired to real data before launch.

### 7. Home screen re-renders every second

`app/(tabs)/index.tsx:25-28` — `setInterval(() => tick((n) => n + 1), 1000)` forces a full component re-render every second just to update a sleep duration timer. This is wasteful battery/CPU usage, especially on a backgrounded app. Should use Reanimated's shared values or a localized timer component.

### 8. No global error boundary

`app/_layout.tsx` wraps the app in providers but has no React error boundary. A render crash on any screen produces a blank screen with no recovery path. The local async states handle *data* errors well, but uncaught render errors are unhandled.

### 9. `delete-account` edge function has partial-failure risk

`backend/functions/delete-account/index.ts:44-62` — Ownership transfer, family deletion, and audit logging all happen *before* `auth.admin.deleteUser()` on line 65. If the final `deleteUser` fails (returns error on line 67), the ownership has already been transferred to the partner AND the original user's auth account still exists — leaving the system in an inconsistent state. The operations should be ordered so the auth deletion doesn't leave orphaned mutations, or wrapped in compensating logic.

### 10. Support resources are inconsistent between mock and screen

`mockRepository.ts:29-33` defines three resources ("postpartum-support", "safe-sleep", "urgent-help"), but `app/(tabs)/checkin.tsx:96-97` hardcodes two *different* resources ("988 Suicide & Crisis Lifeline", "Postpartum Support International") inline rather than reading from the repository. The Trust screen (`app/trust.tsx`) reads from `useSupportResources()` and shows the mock's set. Two different crisis resource lists are shown to the user depending on which screen they are on. The PRD requires the curated list to be reviewed and approved (`[needs sign-off]`) — right now it is not even consistent.

### 11. No input validation on auth forms

`components/AuthForm.tsx:36-47` — Email/password are passed directly to Supabase with no client-side validation beyond "not empty." No email format check, no password strength requirement, no length minimum enforced in the UI (Supabase's default minimum will reject, but the error surfaces raw).

### 12. Test coverage is critically thin for the domain

6 tests exist: 3 for SQLite care-event round-trip, 3 for reminder schedule planning. There are **zero tests** for: the repository contract, auth flow, event creation logic, sleep timer lifecycle, conflict resolution, duplicate detection, account deletion semantics, RLS policies, or any UI behavior. The PRD's own architecture plan (`docs/architecture-deepening-plan.md`) calls for comprehensive module-interface tests — none are implemented.

### 13. No rate limiting or brute-force protection

Supabase Auth has built-in rate limiting, but the custom edge functions (`redeem-invite`, `delete-account`) have none. An attacker could hammer `redeem-invite` with guessed codes with no throttling, lockout, or exponential backoff.

### 14. No pagination on timeline

`data/repository.ts:41` — `getTimeline()` returns all events. `supabaseRepository.ts:47` queries `SELECT * FROM baby_events ... ORDER BY start_at DESC` with no `LIMIT`. As families accumulate months of feed/diaper/sleep logs, this will fetch the entire history on every screen focus.

---

## Suggestions (🟢) — Improvements, not bloat

### 15. Add ESLint + Prettier

No linting or formatting tooling exists. With strict TypeScript passing, adding ESLint + the Expo preset would catch unused imports and React Hooks violations (the `useAsync` hook already has an `eslint-disable` for exhaustive-deps on line 43).

### 16. Extract duplicate `Switch` component

`app/(tabs)/settings.tsx:158` and `app/reminders.tsx:173` both define a `Switch` with slightly different props. Should be one shared component.

### 17. Add `expo-updates` for OTA updates

Not in scope for MVP but important for a baby-data app — you will need to push critical fixes without app store review delays.

### 18. Consider Sentry or equivalent error tracking

Currently zero observability. Even a free Sentry tier would catch crashes in beta. The PowerSync production guide explicitly recommends client-side sync diagnostics.

### 19. `isSyncConfigured` is dead code

`config/env.ts:14` exports `isSyncConfigured` but it is never imported anywhere. The runtime composition module described in the architecture plan would consume it, but that module does not exist yet.

### 20. Prototype is included in the repo

`prototype/` is a Vite web build (React 18, different dependencies). It adds noise and potential confusion. Consider archiving it once the RN app is the sole surface.

---

## Feature Gap Report

| Feature / Element | This Project | Industry Standard (Huckleberry, Baby Tracker, Pebbi) | Priority |
|---|---|---|---|
| Local-first offline logging | 🟡 Partial (works in demo; no sync) | ✅ Standard (Huckleberry, Pebbi both sync) | 🔴 |
| Multi-caregiver real-time sync | ❌ Not functional | ✅ Standard across all competitors | 🔴 |
| Invite-based caregiver onboarding | 🟡 UI done, no token issuance backend | ✅ Standard (shareable codes/links) | 🔴 |
| Feed/diaper/sleep logging | ✅ Demo UI complete | ✅ Standard | 🟡 |
| Growth charts / analytics | ❌ Deferred (Phase 2) | ✅ Most competitors ship this | 🟢 |
| Smart sleep predictions | ❌ Not in scope | ✅ Huckleberry's flagship feature | 🟢 |
| Local notifications + quiet hours | ✅ Well-implemented | 🟡 Partial — some competitors lack this | ✅ Done |
| Private check-in (wellbeing) | 🟡 UI done, not persisted to backend | 🟡 Uncommon, privacy-positive differentiator | 🟡 |
| Data export (JSON) | ✅ Demo works (Share sheet) | ✅ Standard | ✅ Done |
| Account deletion w/ ownership transfer | 🟡 UI + edge function written, not deployed | 🟡 Uncommon — most just hard-delete | ✅ Above standard |
| Audit log visibility | 🟡 UI + schema done, not connected | ❌ Rare in consumer baby apps | ✅ Differentiator |
| App store readiness (metadata, screenshots) | ❌ Not present | ✅ Required | 🔴 |
| Error tracking / crash reporting | ❌ None | ✅ Standard (Sentry/Crashlytics) | 🟡 |
| CI/CD with test gate | ❌ None | ✅ Standard | 🔴 |

---

## Production Readiness Score

| Category | Grade | % | Notes |
|---|---|---|---|
| **Security** | 🟡 Partial | 40% | RLS self-join bypass (`rls.sql:76`); auth scaffolded but inert; no rate limiting; no client-side input validation. Schema/RLS design is otherwise thoughtful. |
| **Reliability** | 🟡 Partial | 45% | Good async error/loading/empty states in UI; no global error boundary; no sync retry logic (PowerSync not wired); partial-failure risk in delete-account edge function. |
| **Observability** | ❌ Missing | 5% | Zero structured logging, no error tracking, no APM, no uptime monitoring, no audit logging connected. |
| **Performance** | 🟡 Partial | 45% | No pagination on timeline; 1-second full re-render timer on Home; no caching strategy; but demo-mode latency is well-tuned (650ms). |
| **Scalability + DevOps** | ❌ Missing | 10% | No git repo, no CI/CD, no migration management (manual SQL paste per PROVISIONING.md), no containerization, no rollback strategy. |
| **Developer Experience** | 🟡 Partial | 50% | README is excellent; TypeScript strict passes clean; no `any`; but no ESLint/Prettier, no pre-commit hooks, 6 tests only, incomplete live adapter excluded from typecheck. |
| **Accessibility + UX** | ✅ Good | 65% | Semantic components, consistent touch targets, proper loading/empty/error states, dark mode. Missing: no automated a11y testing, no dynamic type support verified. |

---

## Overall Score: 35 / 100

The 35 reflects production readiness, not build quality. The demo-mode app is genuinely excellent — probably a 70/100 as a polished prototype. But "production-ready" means the core product works end-to-end with real users, real data, and real safety rails. Right now:

- **The sync/collaboration engine — the product's entire reason for existing — is non-functional** (3 of 19 adapter methods, backend unprovisioned).
- **There is no version control** — the project cannot be safely iterated or rolled back.
- **There is no CI** — regressions will ship undetected.
- **There is a real authorization vulnerability** in the RLS design.
- **There is zero observability** — you cannot know if real users are hitting errors.

The path forward is clear and the codebase is well-architected for it. The strangler-pattern data layer, the carefully-designed schema/RLS/sync-rules, and the clean screen→hook→repository flow mean that fixing these gaps is execution work, not redesign. The README's "Pending" section is honest about what remains. But until the backend is provisioned, the live adapter is completed (all 19 methods), the RLS hole is patched, and a CI pipeline with real test coverage exists, this is not production-ready.

### Recommended immediate priorities (in order)

1. `git init` + `.gitignore` + push to a remote.
2. Fix `rls.sql:76` — constrain `members_self_join` to require a valid, active invite token (or restrict it to insert only via the edge function using `security definer`).
3. Complete `supabaseRepository.ts` (all 19 methods) and remove it from `tsconfig` exclude.
4. Add an `issue-invite` edge function (or a `security definer` function) that generates cryptographically-random codes.
5. Set up CI (GitHub Actions: typecheck + test + lint on every PR).
6. Add a global error boundary + Sentry.
7. Wire all hardcoded demo strings to real data.

---

## Audit Methodology

This audit followed a six-phase methodology:

1. **Phase 1 — Understand the project:** Read the README, PRD (`alora_updated_prd.md`), all config files, CONTEXT.md, architecture docs, and mapped the full folder structure.
2. **Phase 2 — Audit implementation:** Read and traced every source file across `backend/`, `mobile/`, and `prototype/`. Ran `npm run typecheck` (passes clean) and `npm test` (6/6 pass).
3. **Phase 3 — Map user workflow:** Walked the app as a user would in demo mode, identifying gaps, broken paths, and edge states.
4. **Phase 4 — Benchmark against competitors:** Researched Huckleberry, Baby Tracker, Pebbi, and others. Researched COPPA 2024 amendments, HIPAA, PowerSync production readiness, and Apple App Store wellness app guidelines.
5. **Phase 5 — Production/enterprise readiness checklist:** Graded all 6 categories with specific file/line evidence.
6. **Phase 6 — Final report:** This document.
