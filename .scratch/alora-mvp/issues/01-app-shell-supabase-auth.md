# 01 — App shell + Supabase Auth

Status: implemented
Type: AFK

## What to build

The foundational app shell and authentication. Stand up an Expo (SDK 54+) React Native app on the **New Architecture** with an Expo Router skeleton for the five MVP tabs (Home, Log, Timeline, Check-In, Settings). Provision a Supabase project and wire **Supabase Auth** for account creation, sign-in, and a mobile-appropriate recovery flow. Persist the session token in device secure storage so the app opens while offline on a cold start.

End-to-end behavior: a new user can sign up, sign in, and on relaunch (including with no connectivity) lands authenticated rather than at the sign-in screen.

## Acceptance criteria

- [ ] Expo app builds and runs on iOS and Android with the New Architecture enabled (no legacy arch)
- [ ] Expo Router renders the five-tab navigation skeleton
- [ ] User can sign up, sign in, and trigger account recovery via Supabase Auth
- [ ] Session is stored in secure storage and survives app kill
- [ ] Cold-start while offline restores the authenticated session (no forced re-login)
- [x] Tests cover the auth state machine (signed out / signed in / restoring) and offline session restore

## Blocked by

None - can start immediately

## Comments

### 2025-07-16
- Client-side implementation complete: repository methods, tests, and UI wiring.
- Backend provisioning (W0) still required for end-to-end live-path verification.
