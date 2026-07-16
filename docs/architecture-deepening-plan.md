# Alora Architecture Deepening Plan

This plan follows the architecture review and grilling loop for all six accepted deepening candidates. It uses the project domain language from `CONTEXT.md` and the architecture vocabulary: module, interface, implementation, depth, seam, adapter, leverage, locality, and deletion test.

## Accepted direction

The review crystallized these decisions in `CONTEXT.md`:

- **Live mode** means Supabase auth plus PowerSync local-first sync. Expo SQLite remains the local source of truth; Supabase/PowerSync are adapters for live sync.
- **Demo mode** uses the same local Expo SQLite persistence modules as local-first mode, namespaced so demo data stays isolated.
- **Private daily check-ins** are private to the author and can sync only to the author's own devices, never to the co-caregiver.
- **Reminders** are family baby-care routine definitions; **notification preferences** are per-user.
- **Caregiver trust** includes invite, revoke, role display, audit, export, and account deletion.
- The broad `AloraRepository` interface should be replaced by domain-shaped modules through strangler migration.

## Recommended order

1. Baseline verification
2. Runtime composition module
3. Data module foundation / strangler facade
4. Baby-care logging module
5. Reminder module
6. Private daily check-in module
7. Caregiver trust module
8. Delete the broad repository

This order preserves locality while avoiding shallow-module churn. Runtime composition comes first because mode and adapter selection affect every later module. The data module foundation comes next because the current `AloraRepository` interface is the wide shallow module all later work needs to escape.

---

## Phase 0 — Baseline verification

Before changing architecture, record the current verification state.

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

Purpose:

- Separate existing failures from refactor regressions.
- Confirm `mobile/tsconfig.json` still excludes inert PowerSync code until dependencies are intentionally enabled.
- Establish the first test surface before changing any module seam.

Files touched: none.

---

## Phase 1 — Runtime composition module

Create one deep module that owns runtime mode, adapter choice, and sync lifecycle.

### Module responsibility

The runtime composition module owns:

- `demo`
- `local-first`
- `live`
- mode resolver
- adapter selection
- sync lifecycle

### Likely files

- `mobile/runtime/modeResolver.ts`
- `mobile/runtime/runtimeComposition.ts`
- `mobile/runtime/syncLifecycle.ts`
- `mobile/__tests__/runtimeComposition.test.js`
- update `mobile/lib/useAuth.tsx`
- update the app layout where sync lifecycle starts/stops

### Implementation shape

Create a pure mode resolver interface such as:

- input: environment configuration + auth/session state
- output: `demo`, `local-first`, or `live`

Create a `SyncLifecycle` interface with:

- no-op adapter for demo/local-first without sync
- fake adapter for tests
- later PowerSync adapter when dependencies are explicitly installed

Do **not** import PowerSync directly in included TypeScript during this phase. PowerSync files are currently inert/excluded and may require missing dependencies.

### Verification

Test the mode-to-adapter matrix:

- no backend env → `demo`
- backend configured, signed out → auth gate / no sync
- backend configured, signed in, no PowerSync URL → `local-first` / no sync
- backend + PowerSync configured, signed in → `live` / sync starts through injected adapter
- sign-out → sync stops

Commands:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

### Deletion test

Deleting the runtime composition module should concentrate mode complexity in one place. If screens, auth, data hooks, and sync code all start reading raw env booleans again, the module is deep enough to justify the seam.

---

## Phase 2 — Data module foundation / strangler facade

Keep `mobile/data/useData.ts` as the screen-facing seam while moving implementation behind deeper domain-shaped modules.

### Target modules

- runtime composition
- baby-care logging
- reminders
- private daily check-in
- caregiver trust

### Likely files

- `mobile/modules/babyCareLogging/interface.ts`
- `mobile/modules/reminders/interface.ts`
- `mobile/modules/privateDailyCheckIn/interface.ts`
- `mobile/modules/caregiverTrust/interface.ts`
- `mobile/data/dataModules.ts`
- `mobile/data/useData.ts`
- possibly `mobile/data/localDatabase.ts`

### Migration rule

Use strangler migration:

1. Keep current screen imports stable.
2. Introduce domain module interfaces behind `useData.ts`.
3. Delegate old hook/action exports to the new modules one domain slice at a time.
4. Delete legacy repository code only after every slice has moved.

### Adapter rule

Create an adapter seam only when two real adapters justify it, or when a real side-effect adapter needs a test fake. One adapter is still hypothetical and should not create a shallow seam by itself.

### Verification

- Existing screens compile without import churn.
- Existing behavior still passes.
- `useData.ts` becomes thinner over time.
- No new module interface simply mirrors the old broad repository interface.

Commands:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

---

## Phase 3 — Baby-care logging module

Deepen the core Alora module first.

### Module responsibility

The baby-care logging module owns:

- event shaping
- defaults
- repeat-last
- sleep timer
- active baby status
- edit
- duplicate resolution
- soft deletion
- conflict reconciliation for offline sleep actions

Screens should own display state and submit user intent only.

### Likely files

- `mobile/modules/babyCareLogging/index.ts`
- `mobile/modules/babyCareLogging/types.ts`
- `mobile/modules/babyCareLogging/localBabyCareLogging.ts`
- `mobile/modules/babyCareLogging/inMemoryBabyCareLogging.ts`
- `mobile/modules/babyCareLogging/babyCareLoggingRules.ts`
- `mobile/data/localCareEventStore.ts`
- `mobile/data/localSleepTimerStore.ts`
- `mobile/data/useData.ts`
- `mobile/app/(tabs)/log.tsx`
- `mobile/app/(tabs)/index.tsx`
- `mobile/__tests__/babyCareLoggingModule.test.js`

### Required behavior

- Repeat-last means the last visible family care event of that type.
- There is one in-progress sleep timer per baby/family.
- Conflicting offline sleep actions preserve both actions.
- Baby status reconciles from the latest valid timeline state.
- Screens stop shaping care events directly.

### Verification

Module interface tests should cover:

- create/list/recent timeline
- baby status
- repeat-last
- start/stop sleep
- one active sleep timer
- conflicting sleep actions
- edit
- duplicate resolution
- soft deletion

Commands:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

### Deletion test

Deleting baby-care logging rules should force repeat-last, sleep, edit, and delete complexity back into multiple screens or stores. If deleting it only renames functions, the module is still shallow.

---

## Phase 4 — Reminder module

Deepen reminders so preference persistence and notification scheduling share locality.

### Module responsibility

The reminder module owns:

- family reminder definitions
- per-user notification preferences
- quiet-hours suppression
- stale notification cancellation
- windowed one-shot notification planning
- retry/warning when scheduling fails

### Likely files

- `mobile/modules/reminders/index.ts`
- `mobile/modules/reminders/types.ts`
- `mobile/modules/reminders/localReminderStore.ts`
- `mobile/modules/reminders/notificationPlanner.ts`
- `mobile/modules/reminders/expoNotificationAdapter.ts`
- `mobile/modules/reminders/inMemoryReminderAdapter.ts`
- `mobile/data/localReminderPreferenceStore.ts`
- `mobile/lib/reminderSchedule.ts`
- `mobile/lib/notifications.ts`
- `mobile/app/reminders.tsx`
- `mobile/__tests__/reminderModule.test.js`

### Required behavior

- Quiet hours suppress local notification delivery only.
- Quiet hours do not mutate family reminder definitions.
- The module plans windowed one-shot notifications and refreshes them.
- If preference persistence succeeds but notification scheduling fails, keep the preference saved and surface warning/retry behavior.

### Verification

Module interface tests should cover:

- preference-to-notification planning
- quiet-hours suppression
- stale notification cancellation
- scheduling failure with saved preference
- retry behavior
- fake notification adapter calls

Commands:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

### Deletion test

Deleting the reminder module should make preference persistence, quiet-hours logic, and notification adapter orchestration scatter back into screen code and notification helpers. If the pure schedule helper is the only meaningful logic, the module has not gained enough depth.

---

## Phase 5 — Private daily check-in module

Deepen the privacy seam.

### Module responsibility

The private daily check-in module owns:

- create/list private daily check-ins
- reflection storage
- author-only export
- author-only sync semantics
- deletion scrub
- static support resources

### Likely files

- `mobile/modules/privateDailyCheckIn/index.ts`
- `mobile/modules/privateDailyCheckIn/types.ts`
- `mobile/modules/privateDailyCheckIn/localPrivateCheckInStore.ts`
- `mobile/modules/privateDailyCheckIn/privateExport.ts`
- `mobile/modules/privateDailyCheckIn/staticSupportResources.ts`
- `mobile/app/(tabs)/checkin.tsx`
- `mobile/data/useData.ts`
- export flow
- deletion flow integration
- `mobile/__tests__/privateDailyCheckInModule.test.js`

### Required behavior

- Private daily check-ins are private to the author.
- They may sync only to the author's own devices.
- They never sync to the co-caregiver.
- They appear only in the author's own export.
- Account deletion scrubs the deleting author's check-ins/reflections.
- Support resources are static and user-initiated; mood/reflection data must not trigger automated suggestions or caregiver-visible alerts.

### Verification

Module interface tests should cover:

- author-only create/list
- author-only export
- co-caregiver exclusion
- deletion scrub
- static support resources

Commands:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

### Deletion test

Deleting the private daily check-in module should remove the privacy implementation locality. If privacy remains mostly UI copy plus broad export filtering, the module is still shallow.

---

## Phase 6 — Caregiver trust module

Deepen invite, role, audit, export, and deletion behavior.

### Module responsibility

The caregiver trust module owns:

- owner/caregiver role model
- invite issue/redeem/revoke/expire
- role display
- account deletion
- ownership transfer
- private-data scrub coordination
- export coordination
- audit log writes

### Likely files

- `mobile/modules/caregiverTrust/index.ts`
- `mobile/modules/caregiverTrust/types.ts`
- `mobile/modules/caregiverTrust/localCaregiverTrustStore.ts`
- `mobile/modules/caregiverTrust/trustPolicy.ts`
- `mobile/modules/caregiverTrust/exportCoordinator.ts`
- `mobile/modules/caregiverTrust/auditWriter.ts`
- `mobile/app/invite.tsx`
- `mobile/app/trust.tsx`
- `mobile/app/delete-account.tsx`
- `mobile/app/(tabs)/settings.tsx`
- backend Edge Functions as needed
- `mobile/__tests__/caregiverTrustModule.test.js`

### Required behavior

- Current roles are owner and caregiver.
- Invite lifecycle includes issue, redeem, revoke, expire, and audit.
- Account deletion transfers ownership if a co-caregiver exists.
- Sole-owner deletion deletes family data.
- Account deletion always scrubs deleting caregiver private data.
- Audit log entries are required for invite issue/redeem/revoke, role or ownership transfer, export, and account deletion.

### Verification

Module interface tests should cover:

- policy/action/audit matrix
- owner and caregiver permissions
- invite issue/redeem/revoke/expire
- export audit
- account deletion ownership transfer
- sole-owner deletion
- private data scrub coordination

Commands:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

### Deletion test

Deleting the caregiver trust module should make role policy, invite lifecycle, deletion semantics, export coordination, and audit behavior visibly scatter across screens and backend adapters. If it only renames repository calls, it is still shallow.

---

## Phase 7 — Delete the broad repository

Only after all domain modules are migrated, remove the old broad data module shape.

### Likely files

- `mobile/data/repository.ts`
- `mobile/data/mockRepository.ts`
- `mobile/data/supabaseRepository.ts`
- `mobile/data/useData.ts`
- imports across `mobile/app/**`

### Goal

Remove or shrink `AloraRepository` so it no longer acts as the primary interface for unrelated concepts.

`useData.ts` may remain as a thin screen-facing facade, but it should not contain domain logic and should not preserve the old broad repository interface.

### Verification

Search for legacy production dependencies:

```bash
grep -R "AloraRepository\|mockRepository\|supabaseRepository" mobile --exclude-dir=node_modules
```

Then run:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

### Final deletion test

Deleting `AloraRepository` should concentrate complexity inside the deeper modules. It should not require recreating the same wide interface elsewhere.

---

## Cross-cutting verification checklist

After every phase:

```bash
cd mobile && npm test
cd mobile && npm run typecheck
```

Manual flows to check:

- Home quick feed / diaper / sleep
- Log submit and repeat-last
- Timeline edit / duplicate / soft delete
- Merge flow
- Reminders toggle and quiet hours
- Check-In save
- Invite share / revoke / generate
- Trust audit/resources
- Settings export
- Delete Account

Architecture checks:

- Screens own display state and submit user intent only.
- Domain rules live inside module implementations.
- Module interfaces are the primary test surface.
- Every adapter seam has two real adapters, or a real side-effect adapter plus test fake.
- PowerSync is not activated before dependencies and adapter work are explicit.

---

## Strongest recommendations for open implementation decisions

### 1. PowerSync configured but dependency not installed

**Recommendation: fail closed with a clear diagnostic for live mode.**

If Supabase auth is configured but PowerSync is not available, resolve to `local-first` / no-sync when no PowerSync URL is configured. But if configuration explicitly asks for live PowerSync and the adapter cannot load, do not silently degrade to fake-live behavior.

Why:

- False live mode is worse than an explicit diagnostic.
- It protects the runtime composition seam.
- It keeps local-first behavior honest.
- It prevents tests from passing against a mode the app is not actually running.

### 2. Role vocabulary mismatch: `caregiver` vs backend `partner`

**Recommendation: use `caregiver` in the module interface and map backend `partner` inside the adapter.**

Do not start with a backend enum migration unless another change already requires it.

Why:

- `caregiver` is the domain term now recorded in `CONTEXT.md`.
- The module interface should speak domain language.
- The backend adapter is the right place to absorb legacy storage vocabulary.
- It avoids schema churn during the architecture refactor.

Later, if backend vocabulary becomes a source of repeated friction, record an ADR and migrate deliberately.

### 3. Static support resources owner

**Recommendation: private daily check-in owns static support resources; caregiver trust may display/link them.**

Why:

- Support resources are tied to the private daily check-in promise.
- The non-clinical rule belongs next to mood/reflection privacy.
- It prevents caregiver trust from becoming a broad miscellaneous module.
- It keeps the implementation from accidentally using mood/reflection data as an automated trigger.

Caregiver trust can still render support resources on the Trust screen by calling the private daily check-in module interface rather than owning the data.
