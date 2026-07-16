# Alora Context

## Domain glossary

- **Alora** — a cross-platform Expo + React Native app for first-time parents.
- **Baby-care logging** — the fast local-first flow for recording care events such as feeds, diapers, sleep, notes, edits, and soft deletion.
- **Care event** — a timestamped baby-care logging record. Sleep can be an in-progress care event until it is stopped.
- **Sleep timer** — the in-progress sleep state for a baby-care logging session. It should be treated as part of baby-care logging, not as a separate product concept.
- **Reminder** — a family baby-care routine definition, such as feed, diaper, bedtime, or quiet-hours behavior.
- **Notification preference** — a per-user choice for receiving local device notifications for reminders.
- **Quiet hours** — a notification preference that suppresses reminder notifications during a protected time window.
- **Private daily check-in** — the non-clinical parent wellbeing check-in. It is private to the author and may sync only to the author's own devices, never to the co-caregiver.
- **Reflection** — optional private text attached to a private daily check-in.
- **Caregiver** — a parent or trusted adult participating in the shared baby-care context.
- **Co-caregiver** — the other caregiver in the shared baby-care context.
- **Caregiver trust** — the user-visible trust actions and promises around invite, revoke, role display, audit, export, and account deletion.
- **Invite** — a single-use, time-limited, revocable way to add a co-caregiver.
- **Audit log** — the record of trust-sensitive actions such as invite, revoke, export, and account deletion.
- **Account deletion** — the trust action that transfers ownership when possible and scrubs the deleting caregiver's private data.

## Architecture decisions crystallized in review

- **Live mode** means Supabase auth plus PowerSync local-first sync. Expo SQLite remains the local source of truth; Supabase/PowerSync are adapters for live sync.
- **Demo mode** should use the same local Expo SQLite persistence modules as local-first mode, namespaced so demo data stays isolated.
- **Private daily check-ins** are private to the author and can sync only to the author's own devices through the private sync path.
- **Reminders** are family baby-care routine definitions; **notification preferences** are per-user.
- **Caregiver trust** includes invite, revoke, role display, audit, export, and account deletion.

## Baby-care logging rules

- **Repeat last** means the last visible family care event of that type, not the last event on one device or only by the current caregiver.
- There is one in-progress **sleep timer** per baby/family.
- If offline caregivers create conflicting sleep actions, preserve both actions, reconcile baby status from the latest valid timeline state, and keep audit/history instead of silently overwriting.
- Screens should own display state and submit user intent only. Event shaping, defaults, repeat-last, sleep state, edit, and soft deletion belong inside the baby-care logging module implementation.
- Baby-care logging tests should primarily exercise the module interface with SQLite/in-memory adapters.

## Runtime composition rules

- The runtime composition module exposes three modes: **demo**, **local-first**, and **live**.
- Runtime mode is decided by one explicit mode resolver using environment configuration plus auth/session state.
- PowerSync starts only after local-first/live mode has a valid authenticated session.
- Runtime composition tests should cover the mode-to-adapter matrix plus sync start/stop behavior.

## Data module deepening rules

- Replace the broad `AloraRepository` interface with domain-shaped modules: runtime composition, baby-care logging, reminders, private daily check-in, and caregiver trust.
- Split by strangler migration: keep existing hooks stable while moving implementation behind deeper modules one slice at a time.
- Create an adapter seam only when two real adapters justify it; one adapter is still hypothetical.
- Export and audit are owned by the domain module that creates the data, with caregiver trust coordinating trust-sensitive export/audit behavior.

## Reminder rules

- Quiet hours suppress local notification delivery only; they do not change family reminder definitions.
- The reminder module should plan windowed one-shot notifications and refresh them so quiet hours and stale notification cancellation stay inside the implementation.
- If preference persistence succeeds but notification scheduling fails, keep the preference saved and surface warning/retry behavior instead of rolling back the preference.
- Reminder tests should exercise preference-to-notification planning through the module seam.

## Private daily check-in rules

- Private daily check-ins appear only in the author's own export.
- Account deletion scrubs the deleting author's private daily check-ins and reflections.
- Support resources are static and user-initiated; mood/reflection data must not trigger automated suggestions or caregiver-visible alerts.
- Private daily check-in tests should prove author-only sync/export and co-caregiver exclusion.

## Caregiver trust rules

- The current role model is **owner** and **caregiver**.
- The caregiver trust module owns invite issue, redeem, revoke, expire, and audit behavior.
- Account deletion transfers ownership if a co-caregiver exists; otherwise it deletes family data. It always scrubs the deleting caregiver's private data.
- Audit log entries are required for invite issue/redeem/revoke, role or ownership transfer, export, and account deletion.
- Caregiver trust tests should exercise a policy/action/audit matrix through the module interface.
