# Alora — Implemented Behavior Contract

**Version:** 1.2.0  
**Purpose:** prevent the AAA visual redesign from changing or deleting behavior already implemented in Alora.

This file is a **preservation contract**, not a visual specification.

## Precedence

When a design image and the working application disagree:

1. Existing working code/repository contract wins for behavior.
2. This document summarizes the behavior that must be preserved.
3. `design.md` governs presentation.
4. Screenshot text and controls are illustrative unless specifically pinned.

---

## Home

Must preserve:
- baby current-state summary;
- quick care actions;
- next-feed/next-action reminder row;
- caregiver attribution;
- **Care Briefing**;
- last-24h handoff summary behavior;
- `Start my shift` / `Mark shift start` flow;
- locally persisted handoff/shift marker.

Do not remove Care Briefing because the new hero design has less room.

---

## Log

Must preserve:
- Feed / Diaper / Sleep logging;
- current subtype behavior;
- unit-aware fields;
- durable timers where currently used;
- **Repeat Last** row;
- dynamic hint derived from the last compatible event;
- local-first write.

Do not replace Repeat Last with a static preset.

---

## Timeline

Must preserve:
- chronological events;
- actor attribution;
- pending/synced state;
- edit markers including relative edited state such as `Edited 1m ago`;
- possible duplicate state;
- Merge Review;
- **inline `Keep both`**;
- **`Load earlier events` pagination**.

Current redesign contract does **not** require:
- event-type filter chips;
- caregiver filter chips;
- Today/Yesterday/date grouping.

Do not add those solely because a visual reference contains them.

---

## Check-In

Must preserve:
- private per-user data boundary;
- mood labels exactly: **Low, Tired, Okay, Good, Great**;
- optional reflection;
- no scores/streaks/inference/auto-triggering;
- repository-driven support resources;
- current non-clinical disclaimer/support behavior;
- post-save private/local confirmation:
  **`Saved privately on this device.`**

---

## Invite Caregiver

Must preserve:
- **Partner / Limited role picker**;
- generated invitation code;
- single-use;
- time-limited expiry;
- revocation;
- role passed into invite-generation behavior;
- configured family seat-limit enforcement.

Limited is a scoped caregiver role; the redesign must not imply access to private Check-Ins or sensitive trust/admin surfaces.

---

## Reminders & Quiet Hours

Must preserve:
- Quiet Hours;
- Feed reminder row;
- Diaper check row;
- Bedtime routine row;
- per-row enabled state/schedule detail;
- on-device notification explanation;
- unsupported/Expo Go/development-build notice when exposed by the current runtime.

Do not redesign this as Quiet Hours only.

---

## Trust & Privacy

Must preserve:
- current theme (do not force Night);
- shared/private/owner access explanation matrix;
- role-gated audit log/history;
- repository-driven support resources where present;
- privacy-policy link;
- export;
- delete entry point where role allows;
- existing role gating.

Pinned trust footer:

**`No ads. No data selling. Export and leave anytime.`**

---

## Settings

Must preserve role-aware visibility.

At minimum, Limited users must not gain sensitive rows for:
- invite/admin actions;
- seat-limit management;
- trust/admin;
- export;
- delete/admin pathways hidden by the current implementation.

Preserve any stricter Owner/Partner gating already implemented.

Public footer:

**`Alora · The calm in the chaos.`**

---

## Seat Limit

Must preserve the dedicated seat-limit screen:
- `No limit`;
- numeric `2–6`;
- current selected value;
- permitted non-Limited access only;
- existing save/update behavior;
- backend enforcement/audit behavior remains unchanged.

---

## Authentication

Must preserve:
- Sign In;
- Sign Up;
- Supabase Auth;
- current auth routing/gating;
- secure session persistence/offline cold-start behavior.

There is **no recovery/reset screen in the current app**. Do not invent one; if the product adds one later, it must follow the same visual system and auth contracts.

---

## Onboarding

Must preserve the current functional sequence:

1. Welcome
2. Privacy
3. Baby Setup — **name + age**
4. Invite

Do not replace Baby Setup or Invite with generic marketing slides.

Preserve replay behavior.

---

## Growth

Must preserve:
- WHO reference calculations;
- P3/P50/P97;
- Boy/Girl reference selection;
- persisted baby-sex/reference choice;
- birth-date entry;
- supported measurement types/units;
- 0–24 month reference range.

---

## Pediatrician Report

Must preserve:
- direct report generation;
- `expo-print`;
- native share flow;
- exclusion of private Check-In/reflection content.

There is **no requirement for an in-app PDF preview**.

---

## Merge Duplicate

Must preserve:
- Original / Edited / Duplicate semantic badges where current state uses them;
- merge-selection behavior;
- Merge into one entry;
- Keep both;
- **Duplicate not found** state for stale/missing target.

---

## Delete Account

Must preserve branch-dependent semantics.

### Owner + successor caregiver
- transfer ownership;
- preserve shared family history;
- departing user becomes former caregiver in retained history where applicable;
- erase departing user's PII/private Check-In data.

### Sole owner
- delete family/baby/associated family data;
- erase user PII/private data.

### Partner/non-owner
- erase departing user's PII/private data;
- family/shared history remains with owner/family.

Preserve the current **three branch-specific completion/success outcomes**. Do not collapse them into one generic success state.

---

## General

The redesign must not change:
- local-first durability;
- PowerSync/Supabase data behavior;
- RLS/privacy boundaries;
- repository interfaces;
- role enforcement;
- sync conflict semantics;
- account-deletion server semantics;
- notification execution model.

If a visual improvement would require changing one of these behaviors, stop and flag it separately instead of silently implementing the change.
