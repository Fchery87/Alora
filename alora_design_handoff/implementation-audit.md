# Alora AAA — Phase 1 Implementation Audit

Status: complete · Date: 2026-08-08 · Version: matches handoff v1.2.0
Scope: `mobile/` (Expo SDK 54, expo-router, Reanimated, `theme/` tokens)
Method: read every shared component + token file; spot-checked every route against
`LLM_IMPLEMENTATION_PROMPT.md` preservation rules. No code changes.

---

## 1. Component inventory & disposition

| Component | File | Disposition | Notes |
|---|---|---|---|
| `tokens.ts` | `theme/tokens.ts` | **restructure** | Replace palette with Warm Editorial light/dark values; retune fonts/fontSize/radius; add border/shadow/layout tokens; retune motion |
| `ThemeProvider.tsx` | `theme/ThemeProvider.tsx` | **keep** | Scheme switch + `toggleScheme` intact; screens read `theme.color.*` so token swap propagates automatically |
| `AppText` | `components/Themed.tsx` | **restyle** | Structure stays (variant/display/weight/color props). Retune variant sizes + add lineHeight/tracking per variant. Keep variant *names* (`hero/display/title/heading/body/label/caption`) so all call sites survive; hero 56 → 44, display 30 → 30 (h1), title 22 → 24 (h2), heading 17 → 20 (h3), label 13 → 13, caption 11.5 → 12 |
| `Card` | `components/Themed.tsx` | **restyle** | Hairline-led: borderWidth → 1 (design `border.hairline`), drop/soften shadowSm (shadow.light.sm or none); radius lg 24 → 18. "Fewer cards" is a screen-composition change (Phase 3), not a component change |
| `PressableScale` | `components/Themed.tsx` | **retune** | Default scale 0.97 → **0.985** (design `motion.pressScale`); press 140ms / release 160ms → 140ms/fast; keep interruptible reanimated spring + haptics |
| `ScreenScroll` / `CenterState` | `components/Themed.tsx` | **restyle** | paddingHorizontal 22 → 20 (layout token); optional `contentMaxWidth: 520` centering for wide screens; keep SafeArea + Backdrop |
| `Skeleton` | `components/Themed.tsx` | **keep** | Colors via tokens; RN `Animated` loop is fine |
| `Backdrop` | `components/Backdrop.tsx` | **keep** | Gradient endpoints already tokenized (`bgGrad1/bgGrad2`) |
| `FloatingTabBar` | `components/FloatingTabBar.tsx` | **restyle** | Height 68, bottom inset 10 (layout tokens); hairline border + `shadow.floating`; active pill → `surfaceMuted`; icon 21 → 22; keep reanimated pill + tabPress semantics |
| `icons.tsx` | `components/icons.tsx` | **keep + extend** | Already line-style SVG (good). Add: 5 low-detail mood faces (replace emoji), plus any screen-needed glyphs (shift, share, shield, trash, doc, lock, check, clock, merge) as screens demand. Default size 22 / stroke 1.6 |
| `Motion.tsx` | `components/Motion.tsx` | **keep** | `BreathingOrb`, `LiveDot`; ambient loops fine; colors via tokens |
| `Reveal.tsx` | `components/Reveal.tsx` | **retune** | 420ms + 50ms stagger → **360ms** + **45ms** (design motion); keep FadeInDown |
| `ModalScreen.tsx` | `components/ModalScreen.tsx` | **restyle** | Title inherits display font; padding 24 → 20; close button keep |
| `AuthForm.tsx` | `components/AuthForm.tsx` | **restyle (Phase 3)** | Preserve validation, Supabase flow, sign-in/sign-up toggle, busy/error states. **No recovery screen — do not invent.** Inputs already token-driven |
| `ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | **restyle** | Keep copy ("Your data is safe…"), reset + go-home behavior; tokens only |
| Root layout | `app/_layout.tsx` | **restructure** | Swap font imports → `@expo-google-fonts/playfair-display` + `@expo-google-fonts/inter`; keep provider order + StatusBar + Stack config; Phase 4 adds reduce-motion hook here |
| Tabs layout | `app/(tabs)/_layout.tsx` | **keep** | No change (wires FloatingTabBar) |

## 2. Route inventory (17) — all **restyle**, anchors preserved

Phase 3 order from the LLM prompt; every anchor is a *behavior* that must survive:

1. `(auth)/sign-in`, `(auth)/sign-up` — wrappers over `AuthForm`; auth gating + session persistence
2. `onboarding` — Welcome → Privacy → Baby Setup (name/age) → Invite (4 steps)
3. `(tabs)/index` (Home) — next-feed/next-action row, Care Briefing, `Start my shift`/`Mark shift start` + locally persisted shift marker
4. `(tabs)/log` — `Repeat last` row + dynamic hint
5. `(tabs)/timeline` — `Load earlier events`, `Edited 1m ago` markers, possible-duplicate + Merge Review + inline `Keep both`; **no filter chips/date grouping invented**
6. `(tabs)/checkin` — moods exactly `Low/Tired/Okay/Good/Great`; `Saved privately on this device.` after save; support resources repository-driven (no hardcoded 988 row, no mood-triggered content)
7. `(tabs)/settings` — Limited users must not gain sensitive invite/seat-limit/trust/export/delete rows; preserve owner/partner gating
8. `seat-limit` — `No limit / 2–6` picker
9. `invite` — Partner/Limited role picker + scope; no two-seat hardcode
10. `reminders` — Feed reminder, Diaper check, Bedtime routine, Quiet Hours; on-device disclaimer + runtime/Expo Go warning
11. `trust` — Dawn/Night appearance respected; access matrix, audit log, support resources, privacy-policy link, export/delete; footer `No ads. No data selling. Export and leave anytime.`
12. `growth` — WHO P3/P50/P97, Boy/Girl, birth-date input, persisted reference choice
13. Pediatrician report (inside growth/settings) — direct PDF generate/share; no in-app PDF preview invented
14. `merge` — Original/Edited/Duplicate + `Duplicate not found`
15. `delete-account` — owner+successor, sole-owner, partner/non-owner branches + three success outcomes
16. Loading/empty/error/offline states (CenterState + skeletons + inline error rows)

## 3. Token mapping (`theme/tokens.ts` → `design-tokens.json`)

Keep the existing **semantic key names** (screens depend on them); swap values, then add new keys.

| Existing key | ← design token (light / dark) |
|---|---|
| `bg` | `background` #F6EFE6 / #0F0D0E |
| `bgGrad1`, `bgGrad2` | `background` + `backgroundDeep` #EEE1D2 / #090809 |
| `surface` | `surface` #FEFBF7 / #181416 |
| `surface2` | `surfaceMuted` #F2E8DC / #271F1B |
| `surfaceSunken` | `backgroundDeep` #EEE1D2 / #090809 |
| `ink` / `inkSoft` / `inkFaint` | `textPrimary` #141113 / `textSecondary` #6F6259 / `textTertiary` #998B80 (dark: #FFF8F0 / #C3B5A8 / #897B71) |
| `line` / `lineStrong` | `border` #E6D7C6 / `borderStrong` #D5C2AF (dark #382D29 / #4A3A33) |
| `accent` | `primary` #D06C31 / #E89A61 |
| `feed` / `feedTint` | `event.feed` #D06C31 / `feedSoft` #F8E4D4 |
| `diaper` / `diaperTint` | `event.diaper` #83A18C / `diaperSoft` #E4EFE8 |
| `sleep` / `sleepTint` | `event.sleep` #8F86C2 / `sleepSoft` #ECE9F8 |
| `positive` | `success` #5F927A / #7FB099 |
| `warning` / `danger` | `warning` #C88A2B / `danger` #C54E38 (dark #D3A44A / #E06A55) |
| **add** `private`, `privateSoft` | `private` #6F9E86 / `privateSoft` #E4F0E9 (Check-In) |
| **add** `growth`, `growthSoft` | `event.growth` #6373A7 / #E7EAF4 |
| **add** `indigo`, `indigoSoft` | #2D3249/#E7E9F1 · #858FB9/#252A3A |
| **add** `dangerSoft`, `warningSoft` | #F8E4DF / #3A211D etc. |
| **add** `primaryPressed`, `overlay` | #B75A29/#CF7F46 · overlay #14111352/#0000007A |
| **add** `onPrimary` | **Dawn: ivory #FFFDFC; Night: dark #141113** (design §10.5: Night = dark text on warm amber for contrast) |

Structural additions:
- `fonts` → `playfairDisplay_400/500/600` (if needed), `inter_400/500/600/700`
- `fontSize` → add `lineHeight` + `tracking` per variant (typography.styles); keep variant names
- `radius` → sm 10, md 14, lg 18, xl 24, xxl 30 (add), pill 999
- **new** `border` tokens: hairline 1, emphasis 1.5
- **new** `shadow` tokens: light/dark × sm/md/floating (y/blur/opacity)
- **new** `layout` tokens: screenHorizontalPadding 20, contentMaxWidth 520, minTapTarget 44, bottomNavHeight 68, bottomNavBottomInset 10
- `motion` → pressScale 0.985; duration fast 140 / standard 220 / slow 360; stagger 45; spring {damping 19, stiffness 190, mass 0.9}; `reduceMotion: true` flag for the Phase 4 hook

## 4. Font swap points

- `app/_layout.tsx` — replace `@expo-google-fonts/fraunces` + `@expo-google-fonts/hanken-grotesk` imports/`useFonts` with `@expo-google-fonts/playfair-display` + `@expo-google-fonts/inter`
- `theme/tokens.ts` — `fonts` object keys
- `package.json` — swap the two font packages (add/remove)
- No font files are bundled; Expo Google Fonts fetches at dev time (network needed once; known residual risk)

## 5. Icon / emoji swap points

- **emoji (the only ones in the app): `app/(tabs)/checkin.tsx:11–15`** — 😞😕😐🙂😊 → 5 low-detail line-art mood faces in `icons.tsx` (design §11.4 Mood: "simple, low-detail faces or icons"; labels unchanged)
- `app/(tabs)/settings.tsx:375–410` — local `TrashIcon`/`DocIcon`/`SeatIcon` components (default color `#000` — **hardcoded, breaks Night**) → move to `icons.tsx` with theme color
- Everything else already uses the shared line-icon set; no other emoji

## 6. Visual-coupling risks found

1. **~20 hardcoded `#fff` on colored buttons** (onboarding, checkin, log, timeline, index, growth, settings row icons, `AuthForm`, `ErrorBoundary`) → replace with `onPrimary` token; critical for Night where primary is light amber (design §10.5: dark text)
2. **`settings.tsx` local icons default `#000`** → breaks Night; migrate to shared icons
3. `Card` shadow (`shadowSm`) is hardcoded in Themed.tsx → move to `shadow` tokens
4. `FloatingTabBar` shadow hardcoded → `shadow.floating`
5. Screen paddings hardcoded at 22 in `ScreenScroll`/`ModalScreen` → `layout.screenHorizontalPadding`
6. `Reveal` timings hardcoded → `motion` tokens

## 7. Preserved-behavior anchors (already verified against code)

All anchors in §2 were verified in the prior reconciliation pass (21 findings closed, v1.2.0).
Demo-mode caveats (mockRepository, no-op auth gating, no real sync) are documented in
`IMPLEMENTED_BEHAVIOR_CONTRACT.md` — do not "fix" them during the redesign.

## 8. Phase 2 entry checklist

1. `theme/tokens.ts` full token swap + new key additions (no call-site renames needed)
2. `app/_layout.tsx` font swap + `package.json`
3. `AppText` variant retune (sizes/lineHeight/tracking), `Card` hairline, `PressableScale` 0.985
4. New `PrimaryButton`/`SecondaryButton`/`ChoiceChip`/input primitives if screens need them (design §10.5–10.7) — reuse `PressableScale` + `AppText`
5. `onPrimary` rollout across the ~20 `#fff` sites
6. `FloatingTabBar` restyle
7. typecheck + lint green before Phase 3
