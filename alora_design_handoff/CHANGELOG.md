# Changelog

## Implementation complete — 2026-08-08

The Warm Editorial redesign has been implemented in `mobile/` and verified.

### Shipped (commits `179f529`…`0360ccc`, 7 commits after baseline `4da9369`)

- Phase 1 audit: `implementation-audit.md` (added to this package).
- Foundations: Dawn/Night token palettes, Playfair Display + Inter (Google Fonts), hairline borders + token shadows, full type scale, `PrimaryButton`/`SecondaryButton`/`ChoiceChip`, restyled `FloatingTabBar`, line-art MoodFace icons (emoji removed from the mood row).
- All 16 screens restyled in handoff order (Auth → Onboarding → Home → Log → Timeline → Check-In → Settings → Seat Limit → Invite → Reminders → Trust → Growth → Merge → Delete Account), each preserving its behavior exactly.
- Motion: press 0.985 / 140–220–360ms token durations / 45ms stagger, plus OS reduce-motion support (`usePrefersReducedMotion` + `ReduceMotion.System`).

### Verified

- `IMPLEMENTED_BEHAVIOR_CONTRACT.md` sections all pass against code; `data/`, `lib/`, `config/`, `services/` are byte-for-byte unchanged (local-first storage, PowerSync/Supabase, RLS, roles, sync semantics untouched).
- No invented reference-only features; support resources remain repository-driven; no recovery screen.
- Public brand only: `Alora · The calm in the chaos.` footer; no internal codenames user-facing.
- Typecheck clean, ESLint 0 warnings, 79/79 tests passing at every commit.

### Remaining manual step

- Capture Dawn + Night screenshots of Home / Log / Timeline / Check-In on a device or simulator (not available in the implementation environment).


## 1.2.0

Behavior-reconciliation release. Closes the remaining implementation/design mismatches reported after v1.1.

### High
- Replaced generic onboarding narrative with Welcome → Privacy → Baby Setup (name/age) → Invite.
- Rewrote Trust to preserve current theme, shared/private/owner matrix, audit log, data-driven resources, privacy-policy link, export/delete, and pinned trust footer.
- Corrected Check-In mood `Rough` → `Low`.
- Defined role-dependent deletion branches and three branch-specific completion outcomes.
- Expanded Reminders to include Feed / Diaper / Bedtime, on-device disclaimer, and unsupported-runtime warning.
- Added Partner/Limited invite role picker and permission scope.
- Added Home Care Briefing, shift-start marker, and next-feed row.

### Medium
- Added Seat Limit screen (`No limit / 2–6`).
- Added Sign In / Sign Up to redesign scope (no recovery screen currently exists; do not invent one).
- Added Settings role-gating requirements for Limited users.
- Corrected Growth to WHO P3/P50/P97 + Boy/Girl + birth-date behavior.
- Corrected Pediatrician Report to direct PDF generate/share with no invented preview.
- Corrected Timeline to preserve `Load earlier events` and explicitly rejected reference-only filter/date grouping.

### Minor
- Added Merge `Duplicate not found` state and Original/Edited/Duplicate semantics.
- Added inline Timeline `Keep both`.
- Added Check-In `Saved privately on this device.` confirmation.
- Added `Edited 1m ago` Sync/Edit status example.
- Added first-class Log Repeat Last row with dynamic hint.
- Added Home next-feed/next-action row.

### New contract files
- `IMPLEMENTED_BEHAVIOR_CONTRACT.md`
- `screen-contracts.json`
- `RECONCILIATION_MATRIX.md`


## 1.1.0

- Defined the public product brand as `Alora`.
- Defined the preferred public brand line as `The calm in the chaos.`
- Pinned the Settings/About footer to `Alora · The calm in the chaos.`
- Marked `Quiet Dawn`, `Alora AAA`, and `Warm Editorial` as internal-only names.
- Clarified that Check-In support-resource content is repository/data-driven.
- Explicitly prohibited hard-coding 988 or other prototype resource copy.
- Clarified that support-resource screenshots define layout/visual treatment only.
- Added `content-contracts.json` for machine-readable branding/content rules.
