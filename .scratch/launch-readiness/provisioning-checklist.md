# Provision Backend Free Tier — Founder Checklist

Status: ready-for-human
Source: ticket *Provision backend free tier* (03) — layers on `backend/PROVISIONING.md` (the full runbook, ~45–60 min) with the deltas since it was written (Phase A seat limits + scoped roles, Sentry, privacy URL). Research backing: *Free-tier infra and distribution research* (verified: Supabase Free 50k MAU, PowerSync Cloud Free 2 GB/mo / 50 concurrent, Sentry Free 5k errors, EAS Free 30 builds/15 iOS).

**Cost: $0/mo recurring.** The only accounts needed: Supabase, PowerSync, Sentry (all free tiers).

## Step 1 — Supabase project (per PROVISIONING.md §1–§3)

1. [ ] Create project (region **US**), save DB password
2. [ ] Copy Project URL + anon key → `mobile/.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
3. [ ] SQL Editor: run `backend/schema.sql`, then `backend/rls.sql` (includes Phase A: `seat_limit` column, configured-cap trigger, audit trigger, limited-role policies, column-level grants)
4. [ ] Seed `support_resources` (PROVISIONING.md §2) — final crisis copy still gated on MVP issue 13
5. [ ] Enable Email auth; add the `handle_new_user` trigger (PROVISIONING.md §3)

## Step 2 — Edge functions (PROVISIONING.md §4)

1. [ ] `supabase login` + `supabase link --project-ref <ref>`
2. [ ] `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
3. [ ] Deploy **all three**: `generate-invite`, `redeem-invite`, `delete-account`
   > Note: `generate-invite` is missing from the runbook's deploy list — deploy it too (it's the role-aware invite issuer used by other clients; the app itself writes invites locally and RLS enforces owner-only).

## Step 3 — PowerSync instance (PROVISIONING.md §5)

1. [ ] Create instance → connect to Supabase Postgres (`powersync_role` + `create publication powersync for all tables`)
2. [ ] Deploy `backend/sync-rules.yaml`
3. [ ] Configure Supabase JWT auth (Settings → Auth → Supabase)
4. [ ] Copy instance URL → `EXPO_PUBLIC_POWERSYNC_URL` in `mobile/.env`

## Step 4 — Sentry (new since the runbook)

1. [ ] sentry.io → create project → platform **React Native** → copy the DSN
2. [ ] Set `EXPO_PUBLIC_SENTRY_DSN` in `mobile/.env` (crash reporting initializes in production builds only; console fallback otherwise)
3. [ ] No user tags/PII: the wiring in `lib/crashReporting.ts` captures errors without user context (per beta operating doc §4)

## Step 5 — Privacy policy URL (beta requirement)

1. [ ] Publish a public privacy policy (agent draft available on request; required by Apple 5.1.1 + Play before any external beta/store rollout)
2. [ ] Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in `mobile/.env` → the trust screen's in-app link appears automatically

## Step 6 — Flip to live + verify

1. [ ] `cd mobile && cp .env.example .env` (fill from steps above) → `npx expo start -c`
2. [ ] Sign-up route appears instead of demo tabs (auth is now on)
3. [ ] Install PowerSync deps (`npx expo install @powersync/react-native @powersync/op-sqlite`), lift the tsconfig excludes, point `useData.ts` at `supabaseRepository`, `startSync()` after sign-in — PROVISIONING.md §7
4. [ ] Run the **tracer test** (PROVISIONING.md §8): two-device invite → airplane-mode offline logging → sync → edit conflict → account deletion transfer
5. [ ] **Phase A live checks** (new): set a seat limit of 2 → third invite code shows the rejection message on redeem; add a "limited" seat → verify that member sees care events + timeline only (no check-in tab, no trust actions, no audit log); change the limit as the partner (non-owner) → appears in the trust log with actor + old/new values

## Done when

Live-mode install signs in, syncs between two devices, reports to Sentry, and the Phase A live checks pass. Record resulting facts (project URLs, DSN location, region, any limits hit) on ticket 03.
