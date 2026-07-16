# Alora — Expo app

The real React Native app, extracted from the `prototype/` web design build. Same
"Quiet Dawn" design language (via `theme/tokens.ts`) and the same swappable data
layer (`data/`), now as idiomatic Expo + RN.

## Stack

- **Expo SDK 54** on the **New Architecture** (`newArchEnabled: true`), RN 0.81 / React 19.1.
- **Expo Router** (file-based, typed routes) with a custom floating tab bar.
- **react-native-reanimated 4** (+ worklets) for motion — see "Motion" below.
- **react-native-svg** icons, **@expo-google-fonts** (Fraunces + Hanken Grotesk).
- No backend yet — screens read from `mockRepository`; swap in a Supabase + PowerSync
  adapter (see `../backend`) with zero screen changes.

## Run it

```bash
npm install            # add --legacy-peer-deps if a transitive web peer (react-dom) complains
npm run ios            # or: npm run android  /  npx expo start
npm run typecheck      # tsc --noEmit (passes clean, strict)
```

A development build is recommended over Expo Go for SDK 54 (and required later for
push). Local notifications work in Expo Go.

## Layout

```
app/
  _layout.tsx          root: load fonts, ThemeProvider, Stack
  (tabs)/
    _layout.tsx        Tabs + custom <FloatingTabBar/>
    index.tsx          Home (handoff dashboard) — async via repository, loading/error states
    log.tsx            Log (segmented control, subtypes, save)
    timeline.tsx       Timeline — async, loading / empty / error / list + duplicate chip
    checkin.tsx        Check-In — private mood + support resources + disclaimer
    settings.tsx       Settings — caregivers, live Night-mode toggle, privacy
theme/
  tokens.ts            design tokens (SOURCE OF TRUTH in RN — was tokens.css on web)
  ThemeProvider.tsx    useTheme() + scheme toggle (Dawn / Night)
components/
  Themed.tsx           AppText, Card, PressableScale, Skeleton, ScreenScroll, CenterState
  icons.tsx            react-native-svg icon set + event color maps
  FloatingTabBar.tsx   the signature pill tab bar
data/                  mock + repository interface + useAsync hooks (ported verbatim)
```

## What's ported vs. pending

**Ported & runnable:** theme + provider, primitives, icons, navigation shell, the data
layer with real async states, all five tab screens (Home + Timeline are the
data-driven showcases), and the six **flow modals** below.

**Flow modals** (root Stack, native sheet presentation — see `app/_layout.tsx`):

| Route | Presentation | Opened from |
|---|---|---|
| `onboarding` | fullScreenModal | Settings → "View intro again" |
| `invite` | modal | Settings → "Invite a caregiver" |
| `trust` | modal | Settings → "Who can see what" |
| `reminders` | modal | Settings → "Reminders & quiet hours" |
| `delete-account` | modal | Settings → "Delete account" |
| `merge` | modal | Timeline → duplicate chip "Review" |

Bespoke motion: onboarding step transitions (`SlideInRight`), hold-to-delete
(reanimated `scaleX` fill, 2s linear hold / 200ms release), and spring confirm badges.
`components/ModalScreen.tsx` gives the shared title + close chrome.

**Pending (carry over from the prototype / backlog):**
- Gradients (hero aurora, onboarding orb) via `expo-linear-gradient`.
- Going live: install PowerSync, set env, swap the repository (see Backend below).
- Wire the flow modals' *actions* to the backend (invite → redeem-invite, delete →
  delete-account Edge Functions); the UIs are done and mock-backed today.

## Backend integration (scaffolded, demo-mode by default)

The app reads `EXPO_PUBLIC_*` env vars. **With none set it runs in demo mode** —
mock data, no auth, straight to the tabs (today's behavior). Wiring real data:

1. **Provision** Supabase + PowerSync and apply `../backend` (schema, RLS, sync-rules,
   Edge Functions). See `../backend/README.md`.
2. **Set env** — copy `.env.example` → `.env` with your URL/keys. Auth turns on
   automatically: `lib/useAuth.tsx` gates the app, routing to `app/(auth)/sign-in`
   when signed out. Sessions persist in SecureStore (`lib/supabase.ts`) for offline
   cold start.
3. **Enable sync** — install the PowerSync deps and un-exclude the inert files:
   ```bash
   npx expo install @powersync/react-native @powersync/op-sqlite
   # then remove powersync/** + data/supabaseRepository.ts from tsconfig exclude
   ```
   Call `startSync()` (`powersync/system.ts`) after sign-in, and in `data/useData.ts`
   swap `export const repository = supabaseRepository`. Screens don't change — they
   already consume the repository via `useAsync`.

What's already written and ready: `config/env.ts`, `lib/supabase.ts` (SecureStore
session), `lib/useAuth.tsx` (gate), `app/(auth)/*`, `powersync/{schema,system}.ts`,
and `data/supabaseRepository.ts` (reads local SQLite, attribution incl. "former
caregiver").

## Motion (react-native-reanimated 4)

Ported from the prototype's Framer Motion, driven by the curves/durations in `tokens.ts`:

| Motion | Where | Implementation |
|---|---|---|
| Staggered card reveals | Home blocks, Timeline rows | `components/Reveal.tsx` — `FadeInDown.delay(i*50)` |
| Breathing orb | Home hero status | `components/Motion.tsx` `BreathingOrb` — `withRepeat` yoyo scale+opacity, ease-in-out |
| "Live" pulse dot | Home napping label | `components/Motion.tsx` `LiveDot` — expanding/fading ring loop |
| Spring tab indicator | Floating tab bar | `FloatingTabBar` — pill `translateX` via `withSpring` to the active slot |
| Interruptible press | every `PressableScale` | shared-value `scale` via `withTiming` on the Emil ease-out curve |

`babel.config.js` includes the `react-native-worklets/plugin` (Reanimated 4) — it must
stay last in the plugins list.
```
