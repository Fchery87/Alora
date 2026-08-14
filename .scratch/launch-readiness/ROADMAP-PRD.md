# Alora v1.1 — Roadmap PRD

Status: historical roadmap; implemented beta surfaces remain in readiness hardening
Source: [Launch Readiness map](map.md) — distilled from [Competitor feature landscape](research/01-competitor-feature-landscape.md) (web-verified), founder dispositions (Aug 2026), and the resolved [Seat limit configuration](issues/08-seat-limit-configuration.md) decision.

## Context

The private-beta readiness contract preserves the implemented scoped caregiver, growth chart, pediatrician report, and handoff briefing surfaces. The acceptance records below are retained as implementation history. Phase B is deferred expansion only for new work beyond those existing surfaces.

Alora's MVP (hardened + production-readiness pass) is done: fast local-first baby-care logging, reminders + quiet hours, private daily check-in, two-caregiver trust (invite/revoke/export/delete), CI, tests, Sentry wiring. This PRD defines the **next build phase** ahead of a private beta (3–5 known families) and store launch. Every feature below is acceptance-shaped and ready for issue decomposition.

**Decisions this PRD implements:**
- Seat limits are a **family setting, not a hard-coded cap** (unlimited default; any caregiver can change, audit-logged; enforced at redeem).
- Scoped caregiver roles (grandparent/nanny) ship with the seat-limit work — **minimal cut** permissions.
- Founder dispositions: 7 features in the next build, 3 to backlog (research §3).
- Beta runs on Phase A; Phase B lands post-beta as v1.1.

**Domain rules to respect** (per `CONTEXT.md`): repeat-last = last visible family event; one in-progress sleep timer per family; private daily check-ins are author-only (never co-caregiver, never export to others); audit entries required for trust actions; non-clinical framing for anything that looks like guidance.

---

## Phase A — Beta-blocking (lands with/just after backend provisioning)

### A1. Configurable seat limit

Replace the hard-coded two-seat cap (`enforce_seat_cap()` in `backend/schema.sql`, the redeem check in `backend/functions/redeem-invite/index.ts`, pgTAP G1) with a family setting.

**Acceptance criteria**
- [x] `families.seat_limit` column, nullable int; `NULL` = unlimited.
- [x] Schema trigger enforces the configured limit on `family_members` insert (rejects over-limit even via service role).
- [x] `redeem-invite` rejects redemption when the family is at its limit, with a clear message ("This family is at its caregiver limit (N)").
- [x] Any caregiver can set/change the limit; the change writes an **audit log entry** (actor, old → new, timestamp) via a definer trigger.
- [x] Settings shows current member count + seat-limit control; invite screen reflects the limit.
- [x] pgTAP reworked: unset = unlimited (third member accepted); set = rejects at limit; change is audit-logged.

**Implemented (Aug 2026):** `backend/schema.sql` (seat_limit column, configured-cap trigger, audit trigger), `backend/rls.sql` (`families_member_seat_limit` policy + column-level grant — generic UPDATE revoked for clients), `redeem-invite` (configured limit), Settings row + `app/seat-limit.tsx` picker (null/2–6), invite screen copy. Enforcement is server-side: a limited member's seat-limit update is rejected by RLS even though the UI hides the control.

### A2. Scoped caregiver roles (grandparent / nanny seats)

Role model extends to **owner / caregiver / limited**. The inviter picks the role when issuing the invite; role changes later are a trust action (audit-logged).

**Minimal cut** — a limited seat can see and log:
- care events + timeline, their own profile

A limited seat **cannot**:
- see any private daily check-in (author-only, as today)
- perform trust actions: invite, revoke, change seat limit, export, account deletion, ownership transfer
- view the audit log

**Acceptance criteria**
- [x] Invite issue includes role selection; redeem assigns the chosen role.
- [x] RLS enforces the limited cut server-side (not just hidden UI): private check-in isolation for limited seats; trust-action edge functions reject limited members.
- [x] pgTAP: limited member cannot read private check-ins or call invite/revoke/export paths; caregiver matrix extended.
- [x] UI: limited seats see no trust center actions, no check-in tab; copy explains the role ("can log and see care events only").

**Implemented (Aug 2026):** `family_role` enum extended with `limited`; `generate-invite` accepts `{ role }` (default partner) with audit detail; redeem assigns `token.role`; `delete-account` transfers ownership to a non-limited member first (promotes a limited seat only when it's the only one left — never deletes a family with a survivor). RLS: `is_family_limited()` helper; limited seats cannot update seat_limit or read audit logs; owner-only invite management unchanged. Mobile: invite screen role picker (Partner — full access / Limited — grandparent/nanny), Settings hides trust actions for limited seats, role-aware member chips. Export/delete remain client-visible only for non-limited seats (UI-level; noted residual).

### A3. Sync / durability trust UX finish

Surface the sync reality everywhere the family reads data — as trust UX, per research §3.2.

**Acceptance criteria**
- [x] Pending / synced / possible-duplicate affordances render consistently on Home, Log, and Timeline from real sync state (no hardcoded demo strings).
- [x] Offline or sync-failure state shows a clear banner with retry — surfaced on Home and Timeline from the repository error state; Log saves to the local store and lands the caregiver on the timeline where the new event shows its sync pip.
- [ ] Offline banner fed directly by PowerSync lifecycle events (`sync.connected` / `sync.failed` in `powersync/system.ts`): deferred to provisioning (03) — the UI cannot import the PowerSync module until the SDK is installed; the repository-error fallback is in place today.

**Implemented (Aug 2026):** timeline `SyncPip` (Syncing / Synced / Edited) + duplicate chip with Keep both / Review; Home sync line ("N changes syncing") + offline banner with Try again; Log post-save lands on the timeline. Residual: the Supabase adapter currently marks every event `synced` — per-row pending derivation from the PowerSync crud queue lands with the SDK at provisioning (03).
- [ ] Existing tests keep passing; new contract cases for sync-state rendering inputs.

---

## Phase B — v1.1 post-beta (ordered: quick wins → core deepening → positioning)

### B1. WHO growth charts + percentiles

Table-stakes parity (research §3.4). Requires measurement logging (length / weight / head circumference) if not already present.

**Acceptance criteria**
- [x] Log length / weight / head-circumference measurements with timestamps.
- [x] WHO percentile computation runs locally (offline-capable); charts render from logged measurements on the baby profile or a growth surface.
- [x] Percentiles labeled non-clinically ("compared with WHO reference data", not medical advice); follows the app's disclaimer posture.
- [x] Tests: percentile math against known WHO reference values; chart render from fixture data.

**Implemented (Aug 2026):** `growth` event type end-to-end (schema enum, Log segment with unit-aware stepper kg/cm, timeline/icons); `lib/growth/wholms.ts` generated from the CDC-hosted WHO LMS CSVs (provenance header; weight/length/head × boy/girl, months 0–24) + `lib/growth/percentile.ts` (LMS z-score, normal CDF, inverse — verified against known medians, e.g. 12-month boy weight P50 = 9.6479 kg); `app/growth.tsx` charts P3/P50/P97 reference bands with the baby's points, sex reference toggle (persisted locally), and an inline birth-date entry (the babies table persisted it via saveBabyProfile). 10 math/consistency tests.

### B2. Pediatrician-visit PDF report

Reuses the existing JSON export pipeline (research §3.10).

**Acceptance criteria**
- [x] Generate a shareable PDF locally: baby summary, period stats (feeds/diapers/sleep averages), growth snapshot, recent events.
- [x] PDF contains **no private check-in or reflection content** (same rule as export).
- [x] Shared via the system share sheet; generated offline.
- [x] Tests: report generation from fixture timeline; private-content exclusion asserted.

**Implemented (Aug 2026):** `lib/pediatricReport.ts` — pure HTML builder (unit-testable; no native imports) rendered via `expo-print` printToFileAsync and shared with expo-sharing from Settings → Pediatrician report. 6 tests incl. private-content exclusion + HTML escaping.

### B3. Shift-handoff briefing card

The core-promise surface (research §3.1): "what the next caregiver needs to know" on Home.

**Acceptance criteria**
- [x] Home surfaces a briefing computed from the local timeline: last event per category, in-progress sleep timer, next-expected signals (e.g., time since last feed), quiet-hours-aware.
- [x] Follows repeat-last rules and one-sleep-timer rules from `CONTEXT.md`; works fully offline.
- [x] Attribution visible (who logged what since the last handoff); handoff boundary is explicit.
- [x] Tests: briefing computation from fixture timeline via the module interface.

**Implemented (Aug 2026):** `lib/handoff.ts` pure brief builder (marker-filtered events since the handoff, 24h fallback, last feed/diaper, open sleep) + `data/localHandoffStore.ts` marker; Home "Care briefing" card with Start-shift / Mark-shift-start button; hardcoded greeting name replaced with the real member name. 5 tests.

### B4. Possible-duplicate merge flow

Resolve co-logged duplicates (research §3.3) — the timeline already flags possible duplicates.

**Acceptance criteria**
- [x] From a duplicate chip, the caregiver sees both candidate events and resolves: keep one as canonical, merge details, or discard.
- [x] Resolution preserves history/audit (no silent overwrite — per conflict rules in `CONTEXT.md`); converges across both devices via sync.
- [x] Repeat-last and sleep-state logic treat the post-resolution timeline as canonical.
- [x] Tests: merge resolution through the module interface; both-caregiver convergence.

**Implemented (Aug 2026):** the merge flow (app/merge.tsx + timeline duplicate chip) was already complete from the production-readiness pass — verified against these criteria: Review shows both candidates with Original/Edited badges, Keep-both clears the flag, merge soft-deletes the loser (tombstone syncs) while the keeper's history stays in event_edits; contract tests cover duplicate detection and the adapter round-trip.

### B5. Privacy-as-UX trust center + positioning

Positioning copy + store requirements (research §3.9; Apple Guideline 5.1.1 requires an in-app privacy-policy link).

**Acceptance criteria**
- [x] Trust center copy pass: "No ads. No data selling. Export and leave anytime." consistent across settings/invite/delete-account.
- [x] In-app privacy policy link (public URL — also required by both stores for beta tracks).
- [x] Trust surfaces (audit log, export, deletion) unchanged functionally; copy only.

**Implemented (Aug 2026):** positioning copy on the trust screen intro + footer and the Settings footer; privacy-policy link on the trust screen, gated on `EXPO_PUBLIC_PRIVACY_POLICY_URL` (documented in `.env.example`; publish the URL before store/beta distribution — provisioning ticket 03/04).

---

## Backlog (Later — one-line entries)

- **Pumping log + milk-stash inventory with expiry** (research §3.6 — gap nobody owns; new logging subtype + inventory UX).
- **Wake-window / next-sleep suggestions, non-clinical framing** (research §3.7 — highest-demand insight; must stay "suggestion, not prescription"; shape with beta feedback).
- **Local-first photo attach** (research §3.8 — privacy-friendly, but local media across two devices needs a sync-design decision before sizing).

Each graduates with full acceptance treatment when scheduled.

---

## Out of scope (this effort)

- Community/content, forums, editorial (research: What to Expect / BabyCenter moat — not Alora's angle).
- Ads, data selling, or any monetization (map's Out of scope: pricing/monetization is a future effort).
- Clinical claims or predictive marketing (non-clinical boundary; Huckleberry-style SweetSpot prediction-marketing is explicitly not the model).
- Public store launch execution (handled by the launch side of the map: *Beta program details*, *Launch readiness scope*).
