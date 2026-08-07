# Alora v1.1 — Roadmap PRD

Status: ready-for-agent
Source: [Launch Readiness map](map.md) — distilled from [Competitor feature landscape](research/01-competitor-feature-landscape.md) (web-verified), founder dispositions (Aug 2026), and the resolved [Seat limit configuration](issues/08-seat-limit-configuration.md) decision.

## Context

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
- [ ] `families.seat_limit` column, nullable int; `NULL` = unlimited.
- [ ] Schema trigger enforces the configured limit on `family_members` insert (rejects over-limit even via service role).
- [ ] `redeem-invite` rejects redemption when the family is at its limit, with a clear message ("This family is at its caregiver limit").
- [ ] Any caregiver can set/change the limit; the change writes an **audit log entry** (actor, old → new, timestamp).
- [ ] Settings shows current member count + seat-limit control; invite screen reflects the limit.
- [ ] pgTAP reworked: unset = unlimited (third member accepted); set = rejects at limit; change is audit-logged.

### A2. Scoped caregiver roles (grandparent / nanny seats)

Role model extends to **owner / caregiver / limited**. The inviter picks the role when issuing the invite; role changes later are a trust action (audit-logged).

**Minimal cut** — a limited seat can see and log:
- care events + timeline, their own profile

A limited seat **cannot**:
- see any private daily check-in (author-only, as today)
- perform trust actions: invite, revoke, change seat limit, export, account deletion, ownership transfer
- view the audit log

**Acceptance criteria**
- [ ] Invite issue includes role selection; redeem assigns the chosen role.
- [ ] RLS enforces the limited cut server-side (not just hidden UI): private check-in isolation for limited seats; trust-action edge functions reject limited members.
- [ ] pgTAP: limited member cannot read private check-ins or call invite/revoke/export paths; caregiver matrix extended.
- [ ] UI: limited seats see no trust center actions, no check-in tab; copy explains the role ("can log and see care events only").

### A3. Sync / durability trust UX finish

Surface the sync reality everywhere the family reads data — as trust UX, per research §3.2.

**Acceptance criteria**
- [ ] Pending / synced / possible-duplicate affordances render consistently on Home, Log, and Timeline from real sync state (no hardcoded demo strings).
- [ ] Offline or sync-failure state shows a clear banner with retry, fed by the PowerSync lifecycle events already emitted in `powersync/system.ts`.
- [ ] Existing tests keep passing; new contract cases for sync-state rendering inputs.

---

## Phase B — v1.1 post-beta (ordered: quick wins → core deepening → positioning)

### B1. WHO growth charts + percentiles

Table-stakes parity (research §3.4). Requires measurement logging (length / weight / head circumference) if not already present.

**Acceptance criteria**
- [ ] Log length / weight / head-circumference measurements with timestamps.
- [ ] WHO percentile computation runs locally (offline-capable); charts render from logged measurements on the baby profile or a growth surface.
- [ ] Percentiles labeled non-clinically ("compared with WHO reference data", not medical advice); follows the app's disclaimer posture.
- [ ] Tests: percentile math against known WHO reference values; chart render from fixture data.

### B2. Pediatrician-visit PDF report

Reuses the existing JSON export pipeline (research §3.10).

**Acceptance criteria**
- [ ] Generate a shareable PDF locally: baby summary, period stats (feeds/diapers/sleep averages), growth snapshot, recent events.
- [ ] PDF contains **no private check-in or reflection content** (same rule as export).
- [ ] Shared via the system share sheet; generated offline.
- [ ] Tests: report generation from fixture timeline; private-content exclusion asserted.

### B3. Shift-handoff briefing card

The core-promise surface (research §3.1): "what the next caregiver needs to know" on Home.

**Acceptance criteria**
- [ ] Home surfaces a briefing computed from the local timeline: last event per category, in-progress sleep timer, next-expected signals (e.g., time since last feed), quiet-hours-aware.
- [ ] Follows repeat-last rules and one-sleep-timer rules from `CONTEXT.md`; works fully offline.
- [ ] Attribution visible (who logged what since the last handoff); handoff boundary is explicit.
- [ ] Tests: briefing computation from fixture timeline via the module interface.

### B4. Possible-duplicate merge flow

Resolve co-logged duplicates (research §3.3) — the timeline already flags possible duplicates.

**Acceptance criteria**
- [ ] From a duplicate chip, the caregiver sees both candidate events and resolves: keep one as canonical, merge details, or discard.
- [ ] Resolution preserves history/audit (no silent overwrite — per conflict rules in `CONTEXT.md`); converges across both devices via sync.
- [ ] Repeat-last and sleep-state logic treat the post-resolution timeline as canonical.
- [ ] Tests: merge resolution through the module interface; both-caregiver convergence.

### B5. Privacy-as-UX trust center + positioning

Positioning copy + store requirements (research §3.9; Apple Guideline 5.1.1 requires an in-app privacy-policy link).

**Acceptance criteria**
- [ ] Trust center copy pass: "No ads. No data selling. Export and leave anytime." consistent across settings/invite/delete-account.
- [ ] In-app privacy policy link (public URL — also required by both stores for beta tracks).
- [ ] Trust surfaces (audit log, export, deletion) unchanged functionally; copy only.

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
