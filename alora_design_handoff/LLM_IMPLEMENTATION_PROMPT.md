# Alora AAA Redesign — Implementation Prompt

You are redesigning the existing Alora Expo / React Native app.

## Your source of truth

Before editing code, use this precedence:

1. **Inspect the existing screen/data code first** — working behavior is authoritative.
2. `IMPLEMENTED_BEHAVIOR_CONTRACT.md`
3. `screen-contracts.json`
4. `content-contracts.json`
5. `design.md`
6. `design-tokens.json`
7. `alora-theme.ts`
8. `assets/reference/alora-aaa-design-board-16x9.png` and `assets/screens/*` — **visual treatment only**
9. the project's PRD / README / architecture docs for surrounding context

If screenshot text/controls conflict with current code or a behavior contract, preserve the current behavior and use the screenshot only for styling/composition.


## Goal

Rebuild the frontend visual system to match **Alora AAA — Warm Editorial**.

This is a genuine UI redesign, not a palette swap.

Preserve the product's existing domain behavior, local-first data model, sync behavior, privacy boundaries, role logic, navigation destinations, and accessibility expectations.

## Non-negotiable visual direction

- Warm editorial / calm luxury.
- Playfair Display for emotionally important hierarchy.
- Inter for operational UI.
- Dawn = warm sand + ivory + charcoal + restrained amber/sage/lavender.
- Night = warm near-black + ivory text + muted warm accents.
- Strong negative space.
- Hairline borders before heavy shadows.
- Fewer cards.
- One dominant visual moment per screen.
- No neon / cyberpunk / aurora look.
- No baby-blue/pink cliché.
- No generic SaaS dashboard appearance.
- No emoji as primary iconography.


## Brand-string rules

- Public product name: `Alora`.
- Preferred public brand line: `The calm in the chaos.`
- Replace any user-facing `Alora · Quiet Dawn` footer with `Alora · The calm in the chaos.`
- `Quiet Dawn`, `Alora AAA`, `Warm Editorial`, and `Alora AAA — Warm Editorial` are internal design references only; do not expose them as the product brand.
- `Dawn` / `Night` may remain appearance option names if the existing theme selector uses named themes.
- Version/build metadata, if shown, belongs on a separate low-emphasis line.

## Support-resource data rules

- The support-resource surface is **data-driven**.
- Inspect the existing repository contract and current `mockRepository.ts`/live implementation before changing Check-In.
- Render the resources returned by the repository; preserve their current content and ordering.
- Do not hard-code `988 Lifeline` or any other resource because it appears in a reference image.
- Prototype/reference images define layout and visual treatment for support resources, not authoritative copy.
- Current mock/demo data may differ from the visual prototype (for example PSI, AAP safe-sleep guidance, or urgent-help entries); that is expected.
- Do not trigger or change resource content based on the selected mood.
- Do not rewrite safety/support copy as part of the visual redesign.


## Implemented-screen preservation rules

Do not finish the redesign until all of these remain true:

- **Home:** preserve next-feed/next-action row, Care Briefing, `Start my shift` / `Mark shift start`, and locally persisted shift marker.
- **Log:** preserve the `Repeat last` row and dynamic hint.
- **Timeline:** preserve `Load earlier events`, edit markers such as `Edited 1m ago`, possible duplicate, Merge Review, and inline `Keep both`. Do not add filter chips/date grouping solely from reference artwork.
- **Check-In:** moods are exactly `Low / Tired / Okay / Good / Great`; preserve `Saved privately on this device.` after save.
- **Invite:** preserve Partner/Limited role selection and role scope; do not hard-code two seats.
- **Reminders:** preserve Feed reminder, Diaper check, Bedtime routine, Quiet Hours, on-device disclaimer, and runtime/Expo Go warning when applicable.
- **Trust:** respect current Dawn/Night appearance; preserve access matrix, audit log, support resources, privacy-policy link, export/delete; footer is `No ads. No data selling. Export and leave anytime.`
- **Settings:** Limited users must not gain sensitive invite/seat-limit/trust/export/delete admin rows; preserve any stricter existing owner/partner gating.
- **Seat Limit:** preserve `No limit / 2–6` picker.
- **Auth:** preserve Sign In, Sign Up, auth gating, and session persistence. No recovery screen exists today — do not invent one.
- **Growth:** preserve WHO P3/P50/P97, Boy/Girl picker, birth-date input, persisted reference choice.
- **Pediatrician report:** generate/share PDF directly; do not invent an in-app PDF preview.
- **Merge:** preserve Original/Edited/Duplicate semantics plus `Duplicate not found`.
- **Delete:** preserve owner+successor, sole-owner, and partner/non-owner branches and their three success outcomes.
- **Onboarding:** preserve Welcome → Privacy → Baby Setup (name/age) → Invite.


## Implementation workflow

### Phase 1 — Audit, no code changes
Create a screen/component inventory and map each existing component to:
- keep as-is behaviorally,
- restyle,
- restructure,
- replace visually,
- remove if truly redundant.

Identify visual coupling that could cause inconsistent tokens.

### Phase 2 — Foundations
Implement:
- new color tokens;
- Dawn/Night semantic themes;
- Playfair Display + Inter;
- spacing/radius/elevation tokens;
- core button/chip/input/list primitives;
- consistent icon sizing;
- floating tab bar redesign.

Do not begin screen-by-screen ad hoc CSS/styles before the shared foundations are complete.

### Phase 3 — Screens
Implement in order:
1. Auth — Sign In / Sign Up
2. Onboarding — Welcome / Privacy / Baby Setup / Invite
3. Home — including next-feed row + Care Briefing + shift marker
4. Log — including Repeat Last
5. Timeline — including Load earlier + inline Keep both
6. Check-In — Low/Tired/Okay/Good/Great + private saved state
7. Settings — including role gating
8. Seat Limit
9. Invite Caregiver — Partner/Limited picker
10. Reminders / Quiet Hours — all reminder rows + notices
11. Trust & Privacy — access matrix/audit/resources/privacy policy
12. Growth — WHO + Boy/Girl + birth date
13. Pediatrician report action — direct PDF generation/share
14. Merge duplicate — badges + Duplicate not found
15. Delete account — all role branches + success states
16. loading / empty / error / offline states

After each screen, compare visual treatment against supplied references, then compare behavior against `screen-contracts.json`.

### Phase 4 — Motion
Use existing Reanimated infrastructure:
- press scale 0.985;
- 140ms micro;
- 220ms standard;
- 360ms reveal;
- restrained spring;
- 45ms row stagger;
- respect reduce-motion.

### Phase 5 — QA
Verify:
- one-handed use and 44px minimum targets;
- dynamic type, Dawn, and Night;
- local-first/offline save behavior;
- sync + edit states;
- actor attribution;
- Owner/Partner/Limited role gating;
- all required screen behaviors in `screen-contracts.json`;
- no reference-image-only filters/controls were invented;
- no implemented state was deleted because artwork omitted it;
- support resources remain repository-driven;
- no user-facing internal design-system brand strings;
- typecheck, lint, and tests pass.


## Key behavioral guardrails

- Common logging writes local first and never waits for network.
- Check-In stays per-user private and is not surfaced to another caregiver.
- Check-In has no scoring, streak, mood inference, diagnosis, or automated triggering.
- Support-resource records come from the existing repository/data layer; reference-image copy is not authoritative.
- Timeline preserves duplicate review, inline Keep both, edit markers, and pagination behavior.
- Account deletion behavior is unchanged across all role-dependent branches.
- Reminder semantics remain local/on-device and retain all implemented reminder rows/notices.
- Auth, seat-limit, growth, pediatric-report, onboarding, and role-gated Settings are part of the redesign scope.
- Reference-image copy or controls never override the current code/repository behavior.

## Deliverables

At the end:
1. list all modified files;
2. summarize reusable components created/changed;
3. provide screenshots of each core screen in Dawn and Night if the environment supports it;
4. report any visual mismatch or technical limitation rather than silently deviating;
5. run typecheck, lint, and tests;
6. do not call the redesign complete if it is merely the old layout with new colors.
