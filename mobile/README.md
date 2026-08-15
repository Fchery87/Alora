# Alora — Expo app

The production React Native app (iOS + Android), extracted from the `prototype/`
web design build. Same "Warm Editorial" design language (tokens in
`theme/tokens.ts`, spec + contracts in `../alora_design_handoff/`) and
the same swappable data layer (`data/`), now as idiomatic Expo + RN with a live
Supabase + PowerSync adapter, growth charts, a handoff briefing, and a pediatrician
report.

## Stack

- **Expo SDK 54** on the **New Architecture** (`newArchEnabled: true`), RN 0.81 / React 19.1.
- **Expo Router** (file-based, typed routes) with a custom floating tab bar.
- **react-native-reanimated 4** (+ worklets) for motion — see "Motion" below.
- **react-native-svg** icons, **@expo-google-fonts** (Playfair Display + Inter),
  **expo-linear-gradient** backdrops, **expo-haptics** micro-feedback.
- **@supabase/supabase-js** auth + **PowerSync** local-first sync (schema +
  system wiring under `powersync/`; live adapter `data/supabaseRepository.ts`).
- **@sentry/react-native** crash reporting (DSN-gated, no PII), **expo-print** +
  **expo-sharing** for the pediatrician report, **expo-notifications** local
  reminders (lazy-loaded so Expo Go never crashes).

## Run it

```bash
npm install            # add --legacy-peer-deps if a transitive web peer (react-dom) complains
npm run android        # or: npm run ios  /  npx expo start
npm run typecheck      # tsc --noEmit (passes clean, strict)
npm run lint           # ESLint, zero-warning policy
npm test               # 99 tests — contract suite, runtime/auth, roles, sync, growth, handoff, report, …
```

**Demo mode needs zero configuration**: with no env vars set the app runs on
mock data, no auth, straight to the tabs — works in Expo Go. Live mode needs a
development build (native PowerSync modules) — see "Backend integration" below.

## Layout

```
app/
  _layout.tsx          root: load fonts, ThemeProvider, Stack, ErrorBoundary
  (auth)/              sign-in + sign-up (Supabase Auth; routes to tabs when signed in)
  (tabs)/
    _layout.tsx        Tabs + custom <FloatingTabBar/>
    index.tsx          Home (handoff dashboard) — baby status, quick actions,
                       "Care briefing" card with start-of-shift marker (localHandoffStore)
    log.tsx            Log (segmented control, subtypes — incl. growth, unit-aware)
    timeline.tsx       Timeline — attribution, edit markers, duplicate chip → merge
    checkin.tsx        Check-In — private mood + support resources + disclaimer
    settings.tsx       Settings — roles, invites, seat limit, growth, pediatrician
                       report, reminders, trust, export, delete
  growth.tsx           WHO growth charts — P3/P50/P97 bands, boy/girl reference toggle
  seat-limit.tsx       Family seat-limit picker (No limit / 2–6)
  invite.tsx           Invite a caregiver (role picker: partner | limited)
  trust.tsx            Trust center — "No ads. No data selling. Export and leave anytime."
  reminders.tsx        Local reminders + quiet hours (dev-build caption for notifications)
  merge.tsx            Duplicate merge review
  delete-account.tsx   Transfer-then-scrub deletion
  onboarding.tsx       Step-through intro (replayable)
theme/
  tokens.ts            design tokens (SOURCE OF TRUTH in RN — was tokens.css on web)
  ThemeProvider.tsx    useTheme() + scheme toggle (Dawn / Night)
components/
  Themed.tsx           AppText, Card, PressableScale, Skeleton, ScreenScroll, CenterState
  buttons.tsx          PrimaryButton, SecondaryButton, ChoiceChip
  icons.tsx            react-native-svg icon set + event color maps + MoodFace mood row
  usePrefersReducedMotion.ts  OS reduce-motion hook (Reveal/orbs/tab/springs)
  FloatingTabBar.tsx   the signature pill tab bar
  Backdrop.tsx         gradient backdrops
  AuthForm.tsx         shared sign-in/sign-up form
data/
  repository.ts        AloraRepository interface (the contract)
  mockRepository.ts    demo-mode adapter (mock data)
  supabaseRepository.ts live adapter — local SQLite via PowerSync, full contract
  useData.ts           repository proxy selected by runtime composition
  mock.ts              demo fixtures
  localCareEventStore.ts / localSleepTimerStore.ts / localHandoffStore.ts /
  localBabySexStore.ts / localReminderPreferenceStore.ts   durable local stores
runtime/
  RuntimeProvider.tsx  session-driven adapter and PowerSync lifecycle
powersync/
  syncProjection.ts    sanitized connection and upload projection for UI
lib/
  supabase.ts          client + SecureStore session (offline cold-start)
  useAuth.tsx          auth gate (routes to sign-in when signed out)
  notifications.ts     lazy-loaded local notifications (Expo Go-safe)
  crashReporting.ts    Sentry wrapper — DSN-gated, degrades to console
  handoff.ts           buildHandoffBrief — 24h window, last feed/diaper, open sleep
  pediatricReport.ts   HTML→PDF report builder (pure, Node-testable)
  reminderSchedule.ts  quiet-hours scheduling
  growth/percentile.ts LMS z-scores + percentiles (Abramowitz–Stegun, BSM)
  growth/wholms.ts     generated WHO LMS tables (0–24 mo) from CDC-hosted CSVs
```

## What's implemented (beyond the prototype)

- **Full data layer contract** (`data/repository.ts`), covered by a dual-adapter
  test suite: the same tests run against the mock and the Supabase/PowerSync
  adapter (fake PowerSync SQL engine) — 99 tests total.
- **Runtime composition** (`runtime/RuntimeProvider.tsx`): `demo` (no backend),
  `localFirst` (authenticated local adapter), or `live` (PowerSync). One
  lifecycle owner selects the repository, starts/stops sync, and fails closed
  instead of showing demo data to an authenticated user.
- **WHO growth charts** (`app/growth.tsx` + `lib/growth/`): weight/length P3/P50/P97
  bands for 0–24 months, boy/girl reference toggle (persisted), inline birth-date
  entry. Reference data generated from CDC-hosted WHO LMS CSVs with provenance.
- **Pediatrician report** (`lib/pediatricReport.ts` + Settings row): builds a
  printable HTML summary (no check-in/reflection content by design) →
  `expo-print` → share sheet.
- **Handoff briefing** (`lib/handoff.ts` + Home card): last 24h summary, last
  feed/diaper, open sleep; "Start shift" marks the handoff point.
- **Caregiver trust, Phase A**: seat-limit picker, role-aware settings
  (Owner/Partner/Limited chips; limited seats don't see trust actions),
  invite role picker, trust center, privacy-policy link (gated on
  `EXPO_PUBLIC_PRIVACY_POLICY_URL`), export, delete-account.
- **Notifications fix**: `expo-notifications` is never static-imported — it
  throws at import time in Expo Go SDK 53+, so `lib/notifications.ts` lazy-loads
  it behind a guard; the app runs in Expo Go without crashing (real
  notifications still need a development build).
- **Sentry**: production builds capture unhandled errors when `EXPO_PUBLIC_SENTRY_DSN`
  is set; without it everything degrades to console logs (app never depends on
  Sentry).

## Backend integration (demo-mode by default)

The app reads `EXPO_PUBLIC_*` env vars. **With none set it runs in demo mode** —
mock data, no auth, straight to the tabs. Wiring real data:

1. **Provision** Supabase + PowerSync and apply `../supabase/migrations/`, then
   deploy the backend sync rules and Edge Functions. See `../backend/PROVISIONING.md` and the
   founder checklist in `.scratch/launch-readiness/provisioning-checklist.md`.
2. **Set env** — copy `.env.example` → `.env` with your URL/keys. Auth turns on
   automatically: `lib/useAuth.tsx` gates the app, routing to `app/(auth)/sign-in`
   when signed out. Sessions persist in SecureStore (`lib/supabase.ts`) for
   offline cold start.
3. **Enable sync** — the authenticated runtime lifecycle starts and stops
   PowerSync automatically. A development build is required because OP-SQLite
   is native:
   ```bash
   npx expo run:android   # or: run:ios  /  eas build --profile development
   ```
4. **Builds for beta**: `eas.json` has development / preview / production
   profiles (appVersionSource remote). See
   `.scratch/launch-readiness/distribution-checklist.md` for enrollment steps.

## Env reference (`mobile/.env.example`)

| Variable                         | Purpose                                                           |
| -------------------------------- | ----------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`       | Supabase project URL (Project Settings → API)                     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon public key (RLS does the rest)                      |
| `EXPO_PUBLIC_POWERSYNC_URL`      | PowerSync instance endpoint (enables local-first sync)            |
| `EXPO_PUBLIC_SENTRY_DSN`         | Sentry DSN — crash reporting (production only)                    |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Public privacy-policy URL — trust screen link + store requirement |

## Crash reporting (Sentry)

1. Create a Sentry project and copy its DSN.
2. Add it to your env: `EXPO_PUBLIC_SENTRY_DSN=<dsn>` (see `.env.example`).
3. Build with EAS — the `@sentry/react-native` config plugin (already in
   `app.json`) uploads debug symbols automatically.

Crash events carry no user identifiers or PII (per the beta operating doc).

## Motion (react-native-reanimated 4)

Ported from the prototype's Framer Motion, driven by the curves/durations in `tokens.ts`:

| Motion                 | Where                      | Implementation                                                                        |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Staggered card reveals | Home blocks, Timeline rows | `components/Reveal.tsx` — `FadeInDown.duration(360).delay(40 + index*45)`             |
| Breathing orb          | Home hero status           | `components/Motion.tsx` `BreathingOrb` — `withRepeat` yoyo scale+opacity, ease-in-out |
| "Live" pulse dot       | Home napping label         | `components/Motion.tsx` `LiveDot` — expanding/fading ring loop                        |
| Spring tab indicator   | Floating tab bar           | `FloatingTabBar` — pill `translateX` via `withSpring` to the active slot              |
| Interruptible press    | every `PressableScale`     | shared-value `scale` via `withTiming` on the Emil ease-out curve                      |
| OS reduce-motion       | Reveal, orbs, tab, springs | `usePrefersReducedMotion` + `ReduceMotion.System` — everything falls back to static   |

`babel.config.js` includes the `react-native-worklets/plugin` (Reanimated 4) — it must
stay last in the plugins list.
