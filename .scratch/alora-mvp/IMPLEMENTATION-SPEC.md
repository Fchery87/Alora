# Alora MVP — Implementation Spec (Remaining Work)

> Authoritative "what's left to ship the MVP." Synthesized from `alora_updated_prd.md`,
> the 14 backlog issues (`./issues/`), and the three built surfaces. Updated after the
> frontend + scaffolding work; reflects reality, not aspiration.

## Current state snapshot

Three surfaces exist:

| Surface | What it is | Status |
|---|---|---|
| `prototype/` | Web (Vite/React) design reference — 10 screens, all states, both themes | ✅ Complete (reference only) |
| `backend/` | Postgres `schema.sql` + `rls.sql`, PowerSync `sync-rules.yaml`, 2 Edge Functions, `PROVISIONING.md` | ✅ Code complete · ⛔ not provisioned |
| `mobile/` | Expo SDK 54 app (New Arch) — 5 tabs + 6 flow modals, theme, motion, gradients, auth scaffolding, repository(mock) | ✅ Builds & runs in **demo mode** · reads only |

**The defining gap:** the mobile app currently **reads** data through `AloraRepository`
(mock), but has **no write paths** — logging, editing, deleting, check-in submit,
invite redeem, account delete, and reminders are all UI-only against mock data. Wiring
writes (locally-first, then to Supabase/PowerSync + Edge Functions) is the bulk of the
remaining engineering.

## Status vs the 14 backlog issues

| # | Issue | UI (mobile) | Data / backend | Remaining |
|---|---|---|---|---|
| 01 | App shell + Supabase Auth | ✅ sign-in/up + gate | ⚠️ scaffolded | provision; recovery flow; email-confirm decision |
| 02 | Local-first pipeline + family/baby setup | ⚠️ onboarding UI (mock) | ⚠️ schema + sync-rules + adapter (inert) | provision PowerSync; install deps; real create-family/baby |
| 03 | Feed logging tracer | ✅ Log UI | ❌ no write path | `createEvent` write + sync; the tracer test |
| 04 | Diaper & sleep logging + durable timers | ✅ Log UI | ❌ | write paths; **persist running timer to SQLite** |
| 05 | Handoff dashboard (Home) | ✅ + async states | ⚠️ reads via repo | wire to live `getBabyStatus` after provisioning |
| 06 | Timeline + edit/soft-delete | ✅ list + states | ❌ edit/delete not implemented | `updateEvent`/`softDeleteEvent` + `event_edits` |
| 07 | Caregiver invite + two-role RLS | ✅ invite modal | ⚠️ `redeem-invite` fn written | call Edge Function; issue token; accept flow |
| 08 | Split-by-case conflict handling | ⚠️ duplicate chip + merge modal (hardcoded) | ❌ | real duplicate detection; merge writes |
| 09 | Local reminders + notifications | ✅ reminders modal (toggles only) | ❌ | `expo-notifications` schedule + quiet hours |
| 10 | Private check-in + per-user bucket | ✅ check-in UI | ❌ submit not wired | `createCheckIn` write to private bucket |
| 11 | Privacy/trust + export + audit | ✅ trust modal | ❌ export/audit | JSON export; surface `audit_logs` |
| 12 | Account deletion (transfer-then-scrub) | ✅ hold-to-delete modal | ⚠️ `delete-account` fn written | call Edge Function |
| 13 | **[HITL]** Check-in safety copy | ✅ placeholder copy + 988/PSI | — | qualified-advisor review/sign-off |
| 14 | **[HITL]** COPPA/state-law posture | — | — | legal review/sign-off |

Legend: ✅ done · ⚠️ partial/scaffolded · ❌ not started · ⛔ blocked on you

---

## Remaining workstreams

### W0 — Provisioning (gated on you) — **critical path**
Follow `backend/PROVISIONING.md`. Outcome: Supabase project + RLS + seed, Edge
Functions deployed, PowerSync instance + sync rules, `.env` set, PowerSync deps
installed and repository swapped. **Everything below depends on this.**
- **Acceptance:** the tracer test (issue 03) passes end-to-end.

### W1 — Extend the repository with write paths
The interface is read-only today. Add writes and implement in both `mockRepository`
(optimistic in-memory) and `supabaseRepository` (PowerSync local `db.execute`, which
auto-queues the upload).

```ts
interface AloraRepository {
  // existing reads: getTimeline, getBabyStatus, getRecentActivity
  createEvent(input: NewEvent): Promise<string>;           // feed/diaper/sleep
  updateEvent(id: string, patch: EventPatch): Promise<void>; // records prior → event_edits
  softDeleteEvent(id: string): Promise<void>;              // sets deleted_at
  startSleep(): Promise<string>; stopSleep(id): Promise<void>;
  createCheckIn(mood: Mood, reflection?: string): Promise<void>; // per-user bucket
  setReminder(kind, config, enabled): Promise<void>;
  exportMyData(): Promise<object>;                          // full JSON
}
```
- **Acceptance:** every screen's mutating control persists locally-first and (when
  provisioned) syncs; mock impl keeps the app demo-able.
- **Touches:** issues 03, 04, 06, 10, 11.

### W2 — Logging write paths (issues 03, 04)
- Log "Save" + Home quick-log → `createEvent`. Optimistic insert into the list with a
  pending indicator (already designed).
- **Durable sleep timer:** persist the running sleep's `start_at` to local SQLite on
  start; on app relaunch, resume display; `stopSleep` commits `end_at`.
- **Acceptance:** log a feed in <10s; kill the app mid-sleep → timer resumes; offline
  creates survive restart and sync with no re-entry.

### W3 — Timeline edits, soft-delete, conflicts (issues 06, 08)
- Edit an event → write prior values to `event_edits`, show "edited by X".
- Delete → soft-delete tombstone.
- **Real duplicate detection:** flag overlapping same-type events from different
  caregivers within a window; the merge modal acts on the real pair (currently
  hardcoded to the mock duplicate).
- **Acceptance:** concurrent create-create both persist with a duplicate chip;
  concurrent edit-edit resolves LWW with retained history.

### W4 — Invite + deletion → Edge Functions (issues 07, 12)
- Invite modal: "Generate code" → insert `invitation_tokens` (owner RLS); share; the
  invitee's onboarding/settings "enter code" → `POST /functions/v1/redeem-invite`.
- Delete modal hold-complete → `POST /functions/v1/delete-account`, then sign out +
  route to `/sign-in`.
- **Acceptance:** a second device joins via code (single-use, expiry, revoke enforced);
  owner deletion transfers ownership and scrubs PII (verify "former caregiver").

### W5 — Local notifications (issue 09)
- `npx expo install expo-notifications`; request permissions; schedule recurring local
  notifications from the reminders config; enforce quiet hours; per-user prefs persist.
- **Acceptance:** a reminder fires on schedule, never during quiet hours; toggles
  persist. (Dev build required; Expo Go on Android can't do remote push — local OK.)

### W6 — Check-in privacy + resources (issue 10)
- Submit → `createCheckIn` into the per-user private bucket; verify a co-member's
  device never receives it (RLS + bucket).
- Resources load from `support_resources` (global bucket).
- **Acceptance:** cross-user isolation verified; no scoring/inference exists.

### W7 — Privacy, export, audit (issue 11)
- "Export my data" → `exportMyData()` → share a JSON file (`expo-file-system` +
  `expo-sharing`).
- Surface `audit_logs` (membership + sensitive changes) in a trust/settings view.
- **Acceptance:** export is complete + machine-readable; membership changes appear in
  the audit view.

### W8 — Auth completeness (issue 01)
- Password recovery flow (deep link or OTP); decide email-confirmation posture; profile
  bootstrap via the `handle_new_user` trigger (in `PROVISIONING.md`).
- **Acceptance:** sign-up → confirm → land in tabs; recover password works.

### W9 — HITL gates (issues 13, 14) — **launch blockers**
- **13:** qualified-advisor review of disclaimer wording + curated resource list
  (Apple 1.4.1). Owner: product + advisor.
- **14:** legal review of COPPA/state-law posture, retention periods, processor list.
  Owner: legal.
- **Acceptance:** both signed off and recorded before App Store submission.

### W10 — Build, test, release
- **Tests:** unit (repository, conflict rules, quiet-hours logic), and the manual
  tracer test as the integration gate. Consider Maestro/Detox for the core loop.
- **EAS:** `eas build` dev + preview profiles; New Arch confirmed; FCM v1 / APNs only
  when shared push lands (Phase 2).
- **Beta:** closed US beta (PRD Phase 4) — daily use, handoff clarity, sync reliability,
  notification tolerance.

### W11 — Minor polish (non-blocking)
- Gradients: ✅ done (`expo-linear-gradient`: backdrop, hero aurora, onboarding orb).
- Optional: Log amount-stepper parity with prototype; haptics on key actions.

---

## Sequencing (milestones)

1. **M1 — Pipeline proven:** W0 provisioning + W1 repo writes + W2 logging → run the
   **tracer test**. This de-risks the whole architecture. *(highest priority)*
2. **M2 — Core loop live:** W3 (timeline/edits/conflicts) + W6 (check-in) + W5
   (notifications) → the daily coordination loop works on real data.
3. **M3 — Family + trust:** W4 (invite/delete) + W7 (export/audit) + W8 (auth
   completeness).
4. **M4 — Launch readiness:** W9 HITL sign-offs + W10 tests/EAS/beta.

## Explicitly out of MVP (Phase 2+)
Server-triggered shared push (FCM v1/APNs), growth charts, media, mood analytics, 3rd
caregiver seat, community, provider integrations, EU/GDPR-K launch. (Schema/roles are
already extensible for these.)

## Top risks
- **PowerSync ⇄ Supabase auth/replication wiring** — most likely integration snag;
  M1 surfaces it early (by design).
- **Apple 1.4.1** review of the check-in — mitigated by non-clinical posture + W9.
- **Notification fatigue** — conservative local-only defaults + quiet hours (W5).
- **Doing writes twice** — the repository abstraction (W1) means screens never change
  when mock → live; build writes once, behind the interface.
