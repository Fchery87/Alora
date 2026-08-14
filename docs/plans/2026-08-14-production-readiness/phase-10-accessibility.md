# Phase 10: Establish the Accessibility Baseline

## Goal

Make every critical journey operable and understandable with VoiceOver, TalkBack, larger text, reduced motion, and touch accommodations.

## Why This Phase Comes Here

Accessibility is easier to apply consistently after runtime states, roles, and destructive flows are stable. It must still land before release packaging so store builds are tested with the final interaction model.

## Target Contract

Every interactive primitive must expose:

- A semantic role.
- An accessible name.
- Current state when selected, checked, expanded, busy, or disabled.
- A minimum practical touch target.
- Visible focus and pressed feedback where the platform supports them.
- Text that can grow without clipping or hiding the primary action.

Screen code should inherit this contract from shared primitives. Screen-specific accessibility props should exist only when the surrounding context supplies the accessible name or hint.

## Files

- Create `mobile/__tests__/accessibility-primitives.test.tsx`.
- Create `mobile/__tests__/accessibility-critical-screens.test.tsx`.
- Create `mobile/e2e/accessibility-critical-paths.yaml`.
- Update `mobile/components/Themed.tsx`.
- Update `mobile/components/buttons.tsx`.
- Update `mobile/components/FloatingTabBar.tsx`.
- Update shared input, chip, segmented-control, switch, modal, and list-row components under `mobile/components/`.
- Update critical screens under `mobile/app/(auth)/` and `mobile/app/(tabs)/`.
- Update `mobile/app/onboarding.tsx`, `mobile/app/invite.tsx`, `mobile/app/trust.tsx`, `mobile/app/seat-limit.tsx`, and `mobile/app/delete-account.tsx`.
- Update `docs/launch-checklist.md`.

## Tasks

### 1. Lock the primitive contract with component tests

Add React Native Testing Library coverage for buttons, icon-only actions, text inputs, segmented controls, switches, chips, modals, list rows, and the floating tab bar.

Query by role and accessible name. Assert selected, checked, disabled, and busy state where relevant. Avoid assertions that only inspect implementation props without exercising the rendered accessibility tree.

### 2. Repair shared primitives

Put default roles, state mapping, hit slop, label requirements, focus behavior, and disabled semantics in shared components. Preserve native semantics when a platform component already provides them.

Do not silently invent labels for icon-only controls. Require the caller to provide a meaningful name when context is necessary.

### 3. Sweep the critical journeys

Audit sign in, password recovery, onboarding, feed logging, active sleep, daily check-in, caregiver management, invite redemption, sync status, and account deletion.

Fix reading order, duplicate announcements, unlabeled icons, inaccessible custom toggles, modal focus, error announcements, keyboard coverage, and controls that depend on color alone.

### 4. Support dynamic text and reduced motion

Test supported text scaling on narrow iOS and Android viewports. Allow content to wrap and scroll. Keep the primary action reachable.

Respect the operating system reduced-motion preference for nonessential animation. Do not remove feedback that communicates a state change unless an accessible replacement exists.

### 5. Add automated and manual evidence

Use Maestro for traversal smoke checks where stable accessibility selectors improve reliability. Record a manual device matrix for VoiceOver and TalkBack because automated tree assertions cannot prove spoken order, gesture behavior, or real-device focus movement.

## Static Verification

Run:

- `cd mobile && npm run typecheck`
- `cd mobile && npm run lint`
- `cd mobile && npm test -- --runInBand accessibility`

Review all icon-only buttons and custom controls. Every exception to the shared primitive contract should have a documented reason.

## Runtime Verification

On one current iOS device or simulator and one current Android device or emulator:

- Complete sign in and onboarding with the screen reader enabled.
- Log each primary care event.
- Start and stop sleep.
- Complete the private daily check-in.
- Redeem an invite.
- Review caregiver permissions.
- Reach and cancel account deletion.
- Repeat the critical screens with large text and reduced motion.

No native mobile-control integration is available in this environment. A human must perform and record the final VoiceOver and TalkBack pass.

## Exit Criteria

- Critical controls are discoverable by role and name.
- State changes are announced and not conveyed by color alone.
- Large text preserves content and action reachability.
- Reduced motion is respected.
- VoiceOver and TalkBack evidence is attached to the release checklist.
