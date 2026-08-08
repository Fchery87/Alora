# ADR-0001: Warm Editorial visual redesign

- **Status:** Accepted and implemented (2026-08-08, commits `179f529`…`0b96c84` on `main`)
- **Scope:** `mobile/` presentation layer only — no domain behavior changes

## Context

The app's original design language (prototype "Quiet Dawn") was visually generic and
the real app's implementation drifted from the prototype (gradient hero, emoji mood
faces, dashed borders, Fraunces + Hanken Grotesk type, elevation-heavy shadows).
The team produced a full design handoff (`alora_design_handoff/`) specifying a
"Warm Editorial" direction: calm luxury, editorial serif/sans pairing, hairline
borders over shadows, warm sand/ivory Dawn and warm near-black Night schemes.

A hard constraint: Alora is a local-first baby-care app with two-caregiver trust
boundaries, private check-ins, and offline-first sync. The redesign must preserve
every implemented behavior — logging flows, sync/edit states, role gating, invite
semantics, reminders, export/delete, merge — and must not invent features that only
appear in reference imagery.

## Decision

Rebuild the presentation layer around semantic tokens while keeping the existing
token key names (`bg/surface/ink/line/accent/feed/diaper/sleep/…`) so screens and
components survive with value-only changes:

- **Type:** Playfair Display (400/500) for display/headings + Inter (400/500/600/700)
  for body/labels, loaded via `@expo-google-fonts`. Fraunces/Hanken Grotesk removed.
- **Tokens:** new Dawn/Night palettes (Dawn `#F6EFE6` background, amber `#D06C31`
  accent; Night `#0F0D0E` background, `#E89A61` accent), scheme-aware `onAccent`,
  `typeStyle` scale with lineHeight/tracking, `border.hairline`, token shadows,
  `layout` and `motion` constants.
- **Primitives:** `AppText` (type scale), `Card` (hairline + token shadow),
  `PressableScale` (0.985, 140ms), `PrimaryButton`/`SecondaryButton`/`ChoiceChip`
  (`components/buttons.tsx`), restyled `FloatingTabBar`.
- **Iconography:** full line-art icon set; the five check-in mood faces are now
  low-detail line faces (`MoodLow`…`MoodGreat`) — no emoji as primary iconography.
- **Brand:** user-facing brand is `Alora · The calm in the chaos.`; the Settings
  footer previously showed the internal codename and was corrected. Internal names
  (`Quiet Dawn`, `Alora AAA`, `Warm Editorial`) never appear in user-facing UI.
- **Motion:** 140ms micro / 220ms standard / 360ms reveals / 45ms stagger, and full
  OS reduce-motion support (`usePrefersReducedMotion` + Reanimated `ReduceMotion.System`).
- **Behavior preservation:** enforced via `alora_design_handoff/IMPLEMENTED_BEHAVIOR_CONTRACT.md`,
  `screen-contracts.json`, and `content-contracts.json`. `data/`, `lib/`, `config/`,
  `services/`, and the PowerSync schema are byte-for-byte unchanged.

## Consequences

- All 16 screens were restyled in handoff order (Auth, Onboarding, Home, Log,
  Timeline, Check-In, Settings, Seat Limit, Invite, Reminders, Trust, Growth,
  Merge, Delete Account, plus states) with typecheck clean, ESLint 0 warnings,
  and 79/79 tests passing at every commit.
- Fixed pre-existing Night-mode contrast bugs (white-on-white retry pills and
  switch thumb, invisible done-state check).
- `expo export` remains broken on `main` for an unrelated pre-existing inert
  dynamic import in `powersync/system.ts`; dev via Expo Go is unaffected.
- Screenshots in Dawn + Night remain a manual verification step (no simulator in
  the implementation environment).
