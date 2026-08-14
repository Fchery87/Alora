# Alora

> A calm, private, local-first baby-care companion for first-time parents — fast logging,
> two-caregiver coordination, and a gentle wellbeing check-in that stays out of the way.

**Status:** pre-launch · production readiness blocked · private beta not yet safe to start. See [`VALIDATION_TASKS.md`](./VALIDATION_TASKS.md) for the current executable audit.

Alora is a cross-platform (iOS + Android) Expo / React Native app that helps caregivers answer three questions instantly: **what happened recently with the baby, what matters now, and what the next caregiver needs to know.** It is built around one core promise: logging baby care should feel faster and more reliable than remembering or writing notes — even with no signal, at 3 a.m., one-handed.

---

## What this project is

Alora targets [`alora_updated_prd.md`](./alora_updated_prd.md), a coordination-first product for first-time parents of babies aged 0–9 months:

- **A handoff dashboard** (Home) that summarizes the baby's current state instead of requiring a verbal recap: last feed, last diaper, current sleep, next action, recent caregiver activity.
- **Fast, durable logging** of feeds, diapers, and sleep with presets, repeat-last actions, and device-local timers that survive app kills and offline restarts.
- **A shared timeline** with actor attribution, edit markers, and duplicate detection when two caregivers log overlapping events.
- **A private daily check-in** — a single mood input + optional reflection that is *never* visible to the co-caregiver, plus a non-triggered support-resources surface (988, PSI) and a clear non-clinical disclaimer.
- **A caregiver trust layer** — single-use invites, owner/partner/limited roles, configurable seat limits, audit log, JSON export, and transfer-then-scrub account deletion.

The product is deliberately **non-clinical** (no mood inference, scoring, or automated triggering), **US-only at launch** on a **GDPR-ready** foundation, and **free** (no paid tier at MVP — monetization is deferred until habit is proven).

## Why it exists

The PRD's core insight: first-time parents are exhausted, and the highest-value thing a care app can do is reduce mental load and handoff friction between two caregivers. Everything else — emotional check-ins, insights, analytics — is secondary and must never interfere with logging speed or trust.

Target product principles:

1. **Coordination first** — every screen is judged by whether it improves logging speed, state clarity, and handoff confidence.
2. **Fast before comprehensive** — a feed can be logged in under 10 seconds, one-handed.
3. **Local confidence, cloud coordination** — SQLite on-device is the source of truth; sync happens in the background. Logging never waits on a network round trip.
4. **Shared by default, private where needed** — baby-care data is family-shared; check-ins are per-user, enforced at the *sync layer* (a partner's device never pulls them), not just in the UI.
5. **Calm, not clinical** — no diagnosis, no scoring, plain-language disclaimers.
6. **Privacy as product UX** — the trust center explains who can see what in plain language; export and deletion are one tap away.

---

## Feature status

| Area | Status | Notes |
|---|---|---|
| Account + family + baby setup | ⛔ Blocked | Supabase Auth UI exists; live family creation, invite acceptance, recovery, and first-user routing are incomplete |
| Handoff dashboard (Home) | 🟡 Demo complete | Baby status and quick actions work against demo data; live sync is unavailable |
| Feed / diaper / sleep logging | 🟡 Demo complete | Local demo persistence works; the live adapter and sleep-stop path are broken |
| Shared timeline | 🟡 Demo complete | Pagination UI exists; live pending state is not truthful |
| Duplicate detection + merge | 🟡 Partial | Detection and merge UI exist; live dismissal is not persisted |
| Local reminders + quiet hours | 🟡 Needs device verification | Scheduling code exists; production notification behavior is not device-verified |
| Private daily check-in | ⛔ Blocked | Private bucket exists, but limited-role access contradicts the product contract |
| Trust center, JSON export, account deletion | ⛔ Blocked | UI exists; live trust tables and account deletion are not release safe |
| **Phase A: configurable seat limit + scoped roles** | ⛔ Blocked | Schema and UI exist; sync-rule privacy and redemption atomicity must be fixed |
| **Phase B: WHO growth charts** | ✅ Implemented | P3/P50/P97 bands, boy/girl toggle, months 0–24 (CDC-hosted WHO LMS data) |
| **Phase B: pediatrician report (PDF)** | 🟡 Needs device verification | Print + share code excludes private check-in content |
| **Phase B: handoff briefing** | ✅ Implemented | 24h summary, start-of-shift marker |
| **Phase B: trust positioning** | ✅ Implemented | "No ads. No data selling. Export and leave anytime." + privacy-policy link |
| Sentry crash reporting | 🟡 Wired, not provisioned | DSN-gated and intended to avoid PII; no production release has verified ingestion |
| Live backend (Supabase + PowerSync) | ⛔ Blocked | Bundle/schema slice passes; sync lifecycle, onboarding, invite redemption, privacy, and backend atomicity must be fixed before provisioning |
| Private beta distribution | ⛔ Blocked | EAS profiles and checklists exist, but no release bundle or live two-device smoke test passes yet |
| Backlog: pumping + milk stash, wake-window suggestions, local-first photos | 📋 Roadmap | See `.scratch/launch-readiness/ROADMAP-PRD.md` |

---

## Architecture

```
┌────────────────────────────── MOBILE (Expo SDK 54, RN 0.81, New Architecture) ──────────────────────────────┐
│                                                                                                            │
│   app/ (Expo Router) ── Home · Log · Timeline · Check-In · Settings · growth · seat-limit · trust · …      │
│        │                                                                                                   │
│        ▼                                                                                                   │
│   data/useData.ts ── runtime mode resolver (demo / localFirst / live) + repository proxy                    │
│        │                                                                                                   │
│        ├── mockRepository ── demo mode: zero env vars, mock data, no auth                                  │
│        └── supabaseRepository ── live mode: reads/writes local SQLite via PowerSync                        │
│        │                                                                                                   │
│   lib/ ── pure domain logic (handoff briefing, pediatric report, growth percentiles, reminders, …)         │
│   powersync/ ── SQLite schema + sync engine (family + per-user private buckets)                            │
│   theme/ ── "Warm Editorial" design tokens · components/ ── primitives, icons, floating tab bar                │
│                                                                                                            │
└──────────────┬─────────────────────────────────────────────────────────────────────────────────────────────┘
               │  PowerSync (bidirectional sync, offline-first)
               ▼
┌────────────────────────────────────────── BACKEND (Supabase, US region) ───────────────────────────────────┐
│  Postgres: supabase/migrations/ (versioned tables, enums, triggers, and RLS history)                      │
│  Edge Functions: generate-invite · redeem-invite · delete-account (service-role, JWT-authenticated)        │
│  sync-rules.yaml: family bucket (shared) · user_private bucket (check-ins) · global bucket (resources)     │
│  Auth: Supabase Auth → JWT → RLS · Sentry (crash reports, no PII)                                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**The data model** is family-first: `families → family_members → babies → baby_events` (+ `event_edits`, `reminders`, `invitation_tokens`, `parent_check_ins`, `audit_logs`, `support_resources`). Check-ins and reflections live in a **per-user private PowerSync bucket** and are never included in the family bucket — the co-caregiver's device physically never receives them. RLS double-enforces at the database.

**Conflict rules** (fixed in the PRD): concurrent creates of overlapping events are both preserved and flagged as possible duplicates; concurrent edits are last-write-wins with prior values recorded in `event_edits`; deletions are soft (`deleted_at`) sync tombstones.

### Runtime modes (`mobile/config/mode.ts`)

| Mode | When | Behavior |
|---|---|---|
| `demo` | No env vars configured, or signed out | Mock data, no auth, straight to the tabs — zero-setup exploration |
| `localFirst` | Planned fallback | Not operational. The current adapter requires PowerSync and falls back to demo data when unavailable. |
| `live` | Backend + PowerSync configured, signed in | Target mode. Bundle and lifecycle work in `VALIDATION_TASKS.md` must be completed first. |

## Security & privacy model

- **Backend-enforced access control**: every table has RLS policies; the client only ever holds the anon key + user JWT. Roles are enforced in Postgres (`owner` / `partner` / `limited`), with column-level grants for trust actions (e.g., only `seat_limit` is updatable on `families`).
- **Seat limits**: families configure their own cap (unlimited default); any non-limited caregiver can change it; every change is audit-logged; enforced at invite redemption. Limited seats (grandparents/nannies) see care events + timeline + own profile — never check-ins, trust actions, or the audit log.
- **Invite tokens**: single-use (`used_at`), time-limited (`expires_at`), revocable (`revoked_at`).
- **Account deletion**: owner → ownership transfers to partner, PII + private check-ins hard-deleted, shared history reattributed to "former caregiver"; sole owner → entire family hard-deleted; orchestrated server-side.
- **Compliance posture**: US-only launch, GDPR-ready primitives (hard delete, export, retention limits), COPPA posture documented — legal sign-off is a gated pre-launch item (MVP issue 14).
- **Observability**: Sentry-only (no product analytics), with no user identifiers attached to crash events.

## Repository layout

```
├── alora_updated_prd.md        # The product requirements document (source of truth for product)
├── CONTEXT.md                  # Domain glossary (single-context) + architecture decisions
├── docs/
│   ├── adr/                    # Architecture decision records
│   ├── agents/                 # Agent workflow docs (issue tracker, triage labels, domain)
│   ├── architecture-deepening-plan.md
│   └── production-readiness-audit.md
├── alora_design_handoff/       # Warm Editorial design package — spec, tokens, contracts, audit
├── mobile/                     # The app — Expo SDK 54, React Native 0.81 (New Arch), TypeScript
│   ├── app/                    # Expo Router screens (tabs + modal flows)
│   ├── data/                   # Repository interface + mock/Supabase adapters + local stores
│   ├── lib/                    # Pure domain logic (growth percentiles, handoff, pediatric report, …)
│   ├── powersync/              # SQLite schema + sync engine wiring
│   ├── theme/ components/      # "Warm Editorial" design system
│   ├── __tests__/              # Node test suite (79 tests)
│   ├── eas.json                # EAS build profiles (development / preview / production)
│   └── .env.example            # All EXPO_PUBLIC_* variables documented
├── backend/                    # Supabase Edge Functions, sync rules, and test runner
│   ├── sync-rules.yaml         # PowerSync bucket definitions
│   ├── functions/              # Edge functions: generate-invite, redeem-invite, delete-account
│   ├── tests/                  # pgTAP suite and transitional local runner
│   ├── PROVISIONING.md         # The provisioning runbook
│   └── README.md               # Backend specifics
├── supabase/                   # Canonical database migrations and CLI config
│   ├── migrations/             # Versioned schema and RLS history
│   ├── tests/support/          # Local auth support for database tests
│   └── config.toml             # Supabase CLI project configuration
├── prototype/                  # The original web design prototype (Vite + Framer Motion) —
│                               # birthplace of the original design language — superseded by
└── .scratch/                   # Working/wayfinder docs: MVP issues (01–14), production-readiness
                                # PRD, launch-readiness map + research + checklists + privacy policy draft
```

## Getting started

### 1. Run the app (demo mode — zero configuration)

```bash
cd mobile
npm install
npm run android      # or: npm run ios / npx expo start
```

With no env vars set, the app runs in **demo mode**: mock data, no auth, all screens explorable. This works in Expo Go. A development build is recommended for SDK 54 and required for live sync (native PowerSync modules).

### 2. Run the checks

```bash
cd mobile
npm run typecheck    # tsc --noEmit, strict
npm run lint         # ESLint, zero-warning policy
npm run format       # Prettier check
npm test             # 79 behavioral tests — mock adapter + a fake-DB live-adapter harness,
                     # growth math (WHO LMS), handoff briefing, pediatric report, reminders, stores
```

CI (`.github/workflows/ci.yml`) runs typecheck + lint + tests on every push/PR. It does not yet validate formatting, native bundle resolution, dependency advisories, or the pgTAP security suite. The current CI can pass while the Android export fails.

### 3. Verify the backend security layer (optional, needs local Postgres + pgTAP)

```bash
cd backend
sudo -u postgres ./tests/run-pgtap.sh    # 51 assertions: RLS matrix, invite lifecycle, seat caps, privacy isolation
```

### 4. Go live (when you're ready)

The full exact path is [`backend/PROVISIONING.md`](./backend/PROVISIONING.md) (~45–60 min), with the founder-facing checklist and Phase A live checks in [`.scratch/launch-readiness/provisioning-checklist.md`](./.scratch/launch-readiness/provisioning-checklist.md):

1. Create the Supabase project (US region) → link it and apply `supabase/migrations/`, then seed `support_resources`.
2. Deploy the three edge functions (set `SUPABASE_SERVICE_ROLE_KEY` secret).
3. Create the PowerSync instance → connect to Supabase Postgres, deploy `sync-rules.yaml`.
4. Create the Sentry project → set `EXPO_PUBLIC_SENTRY_DSN`.
5. Publish the privacy policy → set `EXPO_PUBLIC_PRIVACY_POLICY_URL` (Apple 5.1.1 / Play requirement).
6. Complete the remaining `VALIDATION_TASKS.md` Phase 0 work before setting live credentials. The PowerSync bundle/schema slice is complete, but sync lifecycle, onboarding, privacy, security, CI, and external launch gates remain.

Cost: **$0/month** (Supabase Free, PowerSync Cloud Free, Sentry Free, EAS Free). The only paid items are the one-time developer enrollments for beta distribution ($99 Apple + $25 Google).

## Launch readiness

The current ordered launch path is [`docs/launch-checklist.md`](./docs/launch-checklist.md). The earlier wayfinder artifacts remain useful background, but their production-readiness assumptions are superseded by the 2026-08-13 validation scan.

Tracked in the wayfinder map `.scratch/launch-readiness/map.md` (tickets + research):

- ✅ **Research**: competitor feature landscape (13 apps), free-tier infra/distribution limits — both web-verified.
- ✅ **Decisions**: seat-limit model (configurable, unlimited default), roadmap prioritization (Phase A beta-blocking / Phase B v1.1), beta program shape (3–5 families, both platforms), launch-readiness scope.
- ✅ **Deliverables**: beta operating doc, launch checklist, provisioning + distribution checklists, privacy policy draft.
- ⏳ **Open (human-gated)**: provisioning signups (Supabase/PowerSync/Sentry), developer enrollments + first beta builds.

The beta → launch gate (exit criteria) is defined in `.scratch/launch-readiness/beta-operating-doc.md`: ≥3 families logging daily for 2 weeks, 14 days without a logging-affecting crash, live end-to-end verified on both platforms, feedback triaged, then an explicit launch decision.

## Documentation map

| Document | What it's for |
|---|---|
| `alora_updated_prd.md` | The product spec — vision, scope, requirements, architecture, compliance |
| `CONTEXT.md` | Domain glossary (single context) — shared vocabulary across code and docs |
| `VALIDATION_TASKS.md` | Current executable health score, release blockers, and remediation tasks |
| `docs/launch-checklist.md` | Ordered path from blocked build through private beta and store launch |
| `docs/adr/` | Architecture decision records |
| `docs/production-readiness-audit.md` | Historical demo-mode audit, superseded by `VALIDATION_TASKS.md` |
| `.scratch/alora-mvp/` | The original 14-issue MVP build plan |
| `.scratch/launch-readiness/` | Wayfinder map, research, roadmap PRD, operating docs, checklists |
| `docs/agents/` | Agent workflow conventions (issue tracker, triage labels, domain rules) |
