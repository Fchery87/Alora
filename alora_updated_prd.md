# Alora Product Requirements Document

> **Revision note (June 2026):** This revision updates the original Convex-based plan after a June 2026 standards review and a structured design grilling. Key changes: the backend/sync stack moved to **Supabase + PowerSync** (true local-first durability), auth moved to **Supabase Auth**, conflict handling, private-data isolation, role scope, check-in safety posture, notification scope, launch geography/compliance, and account-deletion semantics are now explicitly resolved. Items marked **[needs sign-off]** require a product or legal owner before release.

> **Private-beta scope reconciliation (August 2026):** The first private beta preserves the implemented caregiver trust, scoped limited-role, growth chart, pediatrician report, and handoff briefing surfaces. These are beta capabilities with no net-new expansion in this readiness program. Public-launch scope remains a separate decision after the beta exit criteria. Any feature not listed as implemented remains deferred.

## Overview

Alora is a cross-platform mobile application for iOS and Android designed for first-time parents with babies in the 0-9 month stage who need fast baby-care logging, clear caregiver coordination, and lightweight private support for parent wellbeing. The MVP positions Alora as a coordination-first product, with baby-care tracking and caregiver handoff as the primary value and emotional check-ins as a secondary, private, non-clinical feature.

The product is built with Expo (SDK 54+), React Native, and TypeScript on the **New Architecture** (React Native 0.81+/React 19; the legacy architecture is removed in Expo SDK 55, so the app targets New Arch from day one). The data layer is **local-first**: an on-device SQLite database (the source of truth for the UI) synchronized to a cloud Postgres backend via **PowerSync + Supabase**. The operational requirement is that critical baby-care actions feel instant and are durable on-device even with no connectivity, while shared family state reconciles through the backend as connectivity allows.

## Product Vision

Alora should become the most trusted shared early-parenthood companion for families with a baby in the 0-9 month period by reducing mental load and making caregiver handoffs dramatically easier. The product should help caregivers answer three questions quickly: what happened recently, what matters now, and what the next caregiver needs to know.

The vision narrows the launch posture away from a broad "family wellbeing platform" and toward a focused shared caregiver operating system. Parent wellbeing remains part of the experience, but it is intentionally framed as gentle, optional, and private rather than central to product adoption.

## Product Goals

### Primary Goals

- Reduce mental load for new parents by making feed, diaper, and sleep logging extremely fast and reliable.
- Keep two caregivers synchronized through a shared baby record, visible recent activity, and a handoff-oriented home screen.
- Build trust through local-first behavior, clear sync states, privacy clarity, and conservative product claims.
- Offer lightweight, non-diagnostic emotional support through a private daily check-in that does not interfere with the product's core coordination value.

### Business Goals

- Achieve habitual daily usage through core logging workflows and handoff utility.
- Establish a freemium foundation that can later expand into insights, advanced reminders, extra caregiver seats, and family admin features.
- Create a technical foundation that can support broader caregiver collaboration and richer analytics without replatforming.

## Product Principles

### 1. Coordination First

The product's main job is to help caregivers stay in sync with minimal effort. Every design decision is judged first by whether it improves logging speed, state clarity, and handoff confidence.

### 2. Fast Before Comprehensive

A sleep-deprived caregiver should be able to log the most common events in seconds and with one hand whenever possible. Quick actions, repeat-last behaviors, presets, and low-typing flows are more important in MVP than broad feature depth.

### 3. Local Confidence, Cloud Coordination

Core actions are accepted instantly on-device, written durably to local storage (surviving app kill and offline restarts), displayed immediately, and synchronized in the background. Users never lose confidence in the app because a network request is slow or temporarily unavailable.

### 4. Shared by Default, Private Where Needed

Baby-care data belongs within the family trust boundary, while emotional check-ins belong to the individual unless explicitly shared. This separation is enforced at the **sync layer** (a partner's device never pulls another user's check-ins), not only in the interface.

### 5. Calm, Not Clinical

The app may support reflection and help-seeking, but it must not imply diagnosis, treatment, crisis intervention, or medical oversight in MVP. The check-in performs **no mood inference, scoring, or automated triggering**. Product language, onboarding, support surfaces, and app store positioning stay clearly within a non-clinical boundary.

### 6. Privacy as Product UX

Users must be able to understand what data is stored, who can see it, what is private, and how deletion and export work without reading legal documents. Privacy explanation is part of the product experience, not an afterthought.

## Target Users

### Primary Persona

The primary launch user is a first-time parent in a household with one baby aged 0-9 months, where one caregiver logs most events and another caregiver needs clear visibility and handoff context. The MVP UX optimizes for this use case even though the underlying model can later support multiple babies or more complex family structures.

### Secondary Personas

- Solo parents who want a fast baby log and optional private self-support.
- Partnered parents who split responsibilities unevenly and need stronger coordination.

> Trusted caregivers (grandparents, sitters) needing limited role-based access are a **Phase 2** persona, not an MVP target — see [Family and Permissions](#family-and-permissions).

### Excluded Early Segments

The MVP does not optimize first for toddlers, large multi-caregiver households, community-led support, or clinical-provider workflows. These areas add complexity and remain explicitly out of launch scope.

## Core Product Promise

Alora helps users answer these questions instantly:

1. What happened recently with the baby?
2. What do caregivers need to know right now?
3. How is the parent doing today, without turning the app into a therapy tool?

The first two questions dominate the MVP experience. The third remains available through a private, quiet, and clearly secondary feature surface.

## MVP Positioning

> Alora is a shared early-parenthood companion that helps caregivers log the essentials, stay in sync, and reduce handoff stress, while making space for private parent support without added mental load.

This positioning is intentionally narrower than a broad wellbeing claim and stays aligned with what the MVP can credibly deliver. It also reduces the risk of sounding like a therapy or clinical health app before the product has the required safety infrastructure.

## Non-Goals for MVP

The MVP explicitly avoids:

- Community discussion features or peer forums.
- Diagnostic or quasi-diagnostic mental health assessments.
- Mood inference, scoring, or automated low-mood detection/triggering.
- Deep milestone journaling or media-heavy memory features.
- Provider integrations or healthcare-system workflows.
- Advanced emotional inference or partner-behavior interpretation.
- Audio libraries, soothing tools, or microphone-based analysis.
- More caregivers than the configured family seat limit or the supported owner, partner, and limited roles.
- Server-triggered shared push notifications (deferred to Phase 2).
- Milestone media and advanced analytics beyond the implemented beta surfaces.
- EU launch / GDPR-K age-verification flows in v1 (US-only launch; see [Security, Privacy, and Compliance](#security-privacy-and-compliance)).

## MVP Scope

### Included in MVP

#### 1. Account and Family Setup

- Account creation and sign-in via Supabase Auth.
- Mobile-appropriate sign-in persistence (session token in secure storage, enabling offline cold-start) and a recovery flow.
- Create a family unit and one baby profile.
- Invite one additional caregiver (single-use, time-limited, revocable invite token).
- Assign Owner and Partner caregiver roles (two seats total).
- Support a scoped Limited caregiver role in the private beta when enabled by the family trust model.

> First-run actions that inherently require connectivity — sign-up, family creation, and accepting an invite — are online-only. After first setup, logging works fully offline.

#### 2. Handoff Dashboard

- A Home screen designed as a handoff dashboard rather than a general feed.
- Status summary showing last feed, last diaper, current sleep state, and next reminder.
- Quick-log actions within easy thumb reach.
- Recent caregiver activity summary.
- Visible sync state indicators where relevant.

#### 3. Core Logging

- Feed logging with breast, bottle, pumping, quantity, duration, and timestamp support.
- Diaper logging with wet, dirty, mixed, notes, and timestamp support.
- Sleep logging with start, stop, manual edit, nap/night type, and timestamp support.
- Quick-add presets and repeat-last actions for common entries.
- Local device timers for in-progress flows, persisted to local storage so an in-progress sleep survives app kill/restart and commits on stop.

#### 4. Shared Timeline

- Unified chronological family timeline of recent events.
- Attribution showing who logged what and when.
- Edit markers and lightweight history context so updates do not silently rewrite shared understanding.
- Pending, synced, and edited state labels; a "possible duplicate" affordance when two caregivers create overlapping events (see [Sync and Conflict Rules](#sync-and-conflict-rules)).

#### 5. Reminders and Notifications

- **Local** notifications for recurring reminders (no server/push infrastructure in MVP).
- Quiet hours support.
- Per-user notification preferences.

#### 6. Parent Check-In

- One lightweight private daily mood check-in (single mood input + optional short reflection text).
- Context-safe supportive message after completion.
- An always-available, non-triggered support resources surface (e.g., 988 Suicide & Crisis Lifeline in the US) plus a plain-language non-clinical disclaimer. **No** mood detection, scoring, or auto-surfaced panels.

#### 7. Privacy and Trust

- Clear onboarding explanation of family data sharing and private data boundaries.
- In-product trust center describing who can see what.
- Account deletion flow with defined shared-data semantics (see [Account Deletion](#account-deletion)).
- Full structured data export (machine-readable JSON of the user's family data + own check-ins).
- Audit visibility for family membership changes and sensitive settings changes.

### Deferred to a later expansion

- Server-triggered shared push notifications (FCM v1 + APNs + push-token management).
- Growth analytics beyond the implemented chart and report surfaces.
- Media uploads and memory capture.
- Mood correlations and trend analytics.
- More than two caregivers in standard consumer flow.
- Expanded content library and richer educational modules.
- Community spaces.
- Provider and medical integrations.
- EU launch (GDPR / GDPR-K) — see compliance section.

## Information Architecture

The MVP navigation is intentionally narrow because the MVP depends on clarity and habit formation rather than breadth:

- Home
- Log
- Timeline
- Check-In
- Settings

## Screen Blueprint

### Home

Home is the handoff dashboard and the primary daily-use screen. It summarizes current baby state, surfaces quick actions, and reduces the need for verbal recap between caregivers.

Recommended Home modules:

- Baby status summary: last feed, last diaper, current sleep state (derived from any open sleep event).
- Next action/reminder surface.
- Quick-log row for feed, diaper, and sleep.
- Recent caregiver activity panel.
- Visible pending sync notice when relevant.

### Log

Log is the fastest path to creating new events. It prioritizes one-handed use, minimal typing, presets, and repeat-last behavior for exhausted users.

### Timeline

Timeline is the family history and audit surface. It shows all recent events chronologically with actor attribution, timestamps, edit markers, and duplicate affordances for shared understanding.

### Check-In

Check-In is a private personal support surface for the current user only. It feels calm and supportive without appearing clinical or diagnostic, and carries a persistent, non-triggered "Need support?" link plus a non-clinical disclaimer.

### Settings

Settings includes caregiver roles, invite flows, notification controls, privacy explanations, deletion/export pathways, and legal/support basics, plus a trust-oriented explanation of private versus shared data.

## User Stories

### Coordination and Logging

- As a tired parent, a feed, diaper, or sleep event can be logged in under 10 seconds so the app feels easier than remembering or writing notes.
- As a caregiver, the current state of the baby is visible immediately so handoffs do not require a full verbal recap.
- As a partner, recent actions are attributable to the right person so confusion and duplicate logging are reduced.
- As a caregiver with no signal, I can still log events and they persist durably, syncing later without re-entry.

### Trust and Privacy

- As a family owner, another caregiver can be invited safely with clear permissions.
- As a caregiver, only appropriate family data is visible based on assigned access.
- As a privacy-conscious user, emotional check-ins remain private — my partner's device never receives them.
- As a privacy-conscious user, personal data can be reviewed, exported, deleted, and explained in plain language.

### Support

- As a parent, a daily check-in feels supportive without making assumptions or sounding clinical.
- As a user in a difficult moment, the app offers clearly-labeled support resources without pretending to diagnose or treat.

## Functional Requirements

### Authentication and Onboarding

The app supports account creation, sign-in persistence, and a mobile-appropriate recovery flow via **Supabase Auth**. The session token is stored in device secure storage so the app opens and logs while offline on a cold start; the JWT drives Postgres Row-Level Security (RLS) when online.

Onboarding includes product framing, privacy explanation, family setup, baby profile setup, and caregiver invite before the user lands on the main experience. Onboarding collects only the minimum information needed to start logging quickly; optional profile data is deferred until after core setup.

### Family and Permissions

The data model supports one family unit containing one or more babies over time, although the MVP UX optimizes for one baby. Permissions are enforced through a dedicated `family_members` table (not embedded role fields) and at the database layer via Postgres RLS.

**The private beta supports three roles: Owner, Partner caregiver, and Limited caregiver.** The role column is an extensible enum. The Limited role is a scoped caregiver seat for a grandparent or sitter. Family owners may choose a narrower public-launch scope after beta evidence, but every supported role remains server-enforced and security-tested.

| Role | Create logs | Edit logs | Invite caregivers | Manage billing | View check-ins |
|---|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes | Own entries only |
| Partner caregiver | Yes | Yes, limited by policy | No | No | Own entries only |
| Limited caregiver (private beta) | Yes | Limited | No | No | No |

Parent check-ins are private by default and excluded from shared family visibility. This is enforced at the sync layer: check-in rows belong to a per-user PowerSync bucket keyed on `user_id` and are never included in the family bucket, so a partner's device does not receive them. RLS double-enforces.

### Logging Requirements

The app supports fast creation, editing, and deletion of feed, diaper, and sleep entries. Writes go to local SQLite first and are always durable, including offline and across app restarts. Active timers remain responsive and persisted locally even with no connectivity.

All newly created logs appear immediately in the interface, then reconcile to backend state in the background. If synchronization is delayed, the event remains visible with a pending indicator rather than disappearing or blocking the user. Deletions are soft-deletes (`deleted_at`) that propagate as sync tombstones.

### Handoff Dashboard Requirements

The Home screen surfaces current baby status rather than only historical activity. It helps a caregiver understand recent events, current sleep state, and likely next action within seconds of opening the app. Quick actions are available directly from Home; the interface supports one-handed use, large tap targets, and minimal required typing.

### Timeline Requirements

The timeline provides a shared chronological record with event type labels, timestamps, and actor attribution. Edits never silently erase context: prior values are retained in `event_edits` and surfaced as "edited by X" markers. Possible-duplicate creates are flagged for review.

### Check-In Requirements

The emotional check-in includes one mood input and one optional reflection field. It avoids diagnostic or medical-screening language. It performs no scoring, inference, or automated triggering.

A persistent, non-triggered support surface links to curated, real-world support resources (e.g., 988 in the US) in non-diagnostic language, alongside a non-clinical disclaimer ("not medical advice / not a crisis service"). **[needs sign-off]** Disclaimer wording and the curated resource list must be reviewed by a qualified advisor before release.

### Notification Requirements

The MVP ships **local** notifications only, with quiet hours and per-user preference controls. Because expo-notifications removed remote-push support from Expo Go on Android (SDK 53+), local notifications are validated in Expo Go while any future push work requires a development build. Server-triggered shared push is deferred to Phase 2 (FCM v1 + APNs + push-token table + Supabase Edge Function trigger), gated on opt-in and relevance throttling to avoid fatigue.

### Privacy and Trust Requirements

The product explains shared versus private data in onboarding and settings. It provides account deletion and a full structured (JSON) export of the user's data. Sensitive settings changes and family membership changes have audit visibility. Access control is enforced at the backend (Postgres RLS), not only in the client interface.

## Technical Architecture

### Recommended Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Mobile client | Expo (SDK 54+) + React Native (New Architecture) + TypeScript | Single iOS/Android codebase, mature tooling; New Arch is mandatory from SDK 55, so build on it now. |
| Routing/navigation | Expo Router | File-based tab + stack flows. |
| Local store (source of truth) | On-device SQLite via PowerSync | Durable local-first reads/writes, offline-safe, survives app kill. |
| Sync engine | PowerSync | Bidirectional sync between local SQLite and Postgres with bucket-scoped sync rules. |
| Backend database | Supabase (Postgres) | Mature, open-source, SQL + RLS; best-documented Expo offline-first story; suitable for sensitive, regulated data. |
| Authentication | Supabase Auth | Native JWT → RLS integration, on-device session persistence for offline cold-start. |
| Server logic | Supabase Edge Functions | Invite issuance/redemption, account-deletion orchestration, future push triggers. |
| Notifications | expo-notifications (local only in MVP) | Local reminders + quiet hours; push deferred. |

> The original Convex-first plan was changed after the June 2026 review: Convex is cloud-authoritative and not local-first out of the box, and Convex Auth was still beta. Supabase + PowerSync provides genuine local-first durability plus a mature auth/RLS layer for sensitive data.

### Architectural Recommendation

The authoritative architecture is **local-first mobile with cloud-synced shared family state**. The on-device SQLite database is the source of truth for the UI; PowerSync reconciles it with Supabase Postgres. Successful user interaction never depends on a round trip for common baby logs.

### Data Ownership Model

The family is the top-level shared domain object for babies, caregivers, logs, reminders, and permissions. Parent check-ins and reflections belong to the individual user and only attach to family context indirectly where explicitly allowed. Sync buckets reflect this: a **family bucket** (keyed on family membership) and a **per-user private bucket** (keyed on `user_id`).

## Data Model

Recommended Postgres tables:

- `users`
- `families`
- `family_members`
- `babies`
- `baby_events`
- `event_edits`
- `reminders`
- `notification_preferences`
- `parent_check_ins` _(per-user private bucket)_
- `parent_reflections` _(per-user private bucket)_
- `support_resources`
- `invitation_tokens` _(single-use, time-limited, revocable)_
- `audit_logs`
- `subscription_status` _(table present; no active billing at MVP launch)_

A single `baby_events` table supports feed, diaper, and sleep events with typed payloads, keeping the query model and timeline simpler.

| Field | Purpose |
|---|---|
| id | Unique event identifier |
| family_id | Shared family boundary (RLS + sync bucket key) |
| baby_id | Baby reference |
| created_by | User who logged event |
| event_type | feed, diaper, sleep |
| sub_type | bottle, breast, pumping, wet, dirty, nap, night, etc. |
| start_at | Start timestamp where relevant |
| end_at | End timestamp where relevant |
| quantity | Amount where relevant |
| notes | Optional short note |
| created_at | Audit timestamp |
| updated_at | Last update timestamp |
| deleted_at | Soft-delete marker (sync tombstone) |

> **Sync status is a client-only concern.** PowerSync manages the upload queue, so pending/synced/failed state lives in the **local SQLite schema** (e.g., a local `_sync_state` or PowerSync's CRUD queue) and is **not** a synced server column.

## Sync and Conflict Rules

Fixed before implementation:

1. New events are written to local SQLite first (durable, offline-safe), then uploaded by PowerSync.
2. Pending events remain visible with status feedback until confirmation.
3. **Conflict handling is split by case:**
   - **Concurrent creates** of overlapping events (e.g., both caregivers log a 2pm feed) — both rows are preserved; the Timeline surfaces a "possible duplicate" chip with merge/dismiss options. Nothing is silently merged.
   - **Concurrent edits** to the same existing event — last-write-wins, with the prior values recorded in `event_edits` and an "edited by X" marker shown.
4. In-progress timers remain device-local (persisted to SQLite) until committed as completed events.
5. Failed uploads are retried automatically by PowerSync with backoff and are also retryable from the UI without re-entry.

These rules create predictable behavior for shared caregiving situations.

## Security, Privacy, and Compliance

The product handles sensitive baby-care data and personal emotional reflections, so privacy and access control are core product requirements. The MVP supports encryption in transit, encryption at rest, backend-enforced RLS, data minimization, and deletion/export pathways.

**Launch geography: US-only**, to bound compliance scope. The build is **GDPR-ready** — hard-delete, full export, retention limits, data minimization, and consent records are implemented now — so EU expansion (GDPR + GDPR-K age-16 consent, EU data residency, DPA/SCCs) becomes configuration rather than a rebuild. EU launch is deferred.

On COPPA: users are adults (parents) who provide data about their own child, which softens classic "personal information collected from a child" applicability. Nonetheless, given the post-April-2026 COPPA overhaul (stricter retention, third-party processor accountability) and US state children's-privacy laws, the product applies conservative data-retention limits, avoids unnecessary third-party data sharing, and minimizes collection. **[needs sign-off]** A legal owner should confirm the COPPA/state-law posture before launch.

The MVP must not claim HIPAA-grade behavior unless that posture is formally implemented and reviewed. Because the app touches health-adjacent behavior, all product copy stays clearly non-clinical and avoids implying diagnosis or treatment, in line with Apple App Store guideline 1.4.1 (wellness apps touching mood/stress must ship clinical disclaimers + crisis resources and avoid medical claims).

### Account Deletion

Account deletion has defined shared-data semantics:

- **Owner deletes while a partner exists:** family ownership transfers to the partner; the departing owner's PII and private check-ins/reflections are hard-deleted; shared baby/event history the partner relies on is retained, with `created_by` reattributed to a "former caregiver" placeholder.
- **Owner is the only member:** the entire family, baby, and associated data are hard-deleted.
- **Partner deletes:** the partner's PII and private check-ins are hard-deleted; the family and shared history remain with the owner.

Deletion is orchestrated server-side (Supabase Edge Function) to guarantee both Postgres and downstream copies are purged.

## Monetization

The monetization strategy is freemium, with aggressive paywalling delayed until habit and perceived household value are proven. The free tier includes core logging, one baby, two caregivers, and the basic private check-in. **There is no paid tier at MVP launch** (the `subscription_status` table exists for future use).

Premium expansion can later include expanded history, insights, enhanced reminders, additional caregivers (including the Limited caregiver seat), content library access, and family admin features. Essential support-oriented experiences are never paywalled in a way that undermines trust.

## Analytics and Success Metrics

The north-star metric is weekly active families completing meaningful shared logging activity. Supporting launch metrics:

| Metric | Why it matters |
|---|---|
| Day 1 account completion rate | Measures onboarding clarity |
| Caregiver invite acceptance rate | Measures shared-value proposition |
| 7-day logging retention | Measures habit formation |
| Average logs per active family per day | Measures core utility |
| Daily check-in completion rate | Measures support relevance |
| Notification opt-in rate | Measures trust and reminder value |
| Sync failure / retry rate | Measures local-first reliability |

> Trial-to-paid conversion is intentionally **omitted at MVP** because there is no paid tier yet; it returns when premium ships.

## Release Plan

### Phase 0: Product Definition

Before coding begins, finalize:

- Personas.
- Home dashboard hierarchy.
- Core flows.
- Permission matrix (two-role MVP).
- Sync + conflict rules.
- Notification rules (local-only MVP).
- Data retention periods and deletion/export specifics.
- Check-in disclaimer copy and curated support-resource list **[needs sign-off]**.
- Launch metrics.

### Phase 1: Foundations

- Expo app shell (New Architecture).
- Supabase project + Postgres schema + RLS policies.
- PowerSync setup with family and per-user sync buckets.
- Supabase Auth + offline session persistence.
- Family setup and baby profile.
- Local-first event model (SQLite + sync queue).

### Phase 2: Core Experience

- Handoff dashboard.
- Feed, diaper, and sleep logging (local-first, durable timers).
- Shared timeline (attribution, edit markers, duplicate affordance).
- Caregiver invite flows (single-use tokens).
- Local reminders + quiet hours.
- Failed-sync retry UX.

### Phase 3: Trust and Support

- Daily private check-in (no inference) + static support resources + disclaimer.
- Privacy settings + trust center.
- Account deletion (transfer-then-scrub) and full JSON export.
- Audit visibility.

### Phase 4: Beta Validation

Run a closed US beta with a small number of real families to validate daily use, handoff clarity, sync reliability, and notification tolerance before adding broader feature surface.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| MVP scope grows too broad | Slower build and weaker UX | Keep launch focused on coordination-first logging and sync |
| Offline behavior feels unreliable | Trust erosion | Local-first via PowerSync + SQLite is a hard product requirement; SQLite is source of truth |
| Emotional support feels clinical or invasive | Trust and App Store (1.4.1) rejection risk | Keep check-ins private, light, reviewed, non-inferring; ship disclaimer + crisis resources |
| Notification volume becomes annoying | Fatigue and uninstalls | Local-only MVP, conservative defaults, quiet hours, per-user controls |
| Permissions are confusing | Privacy conflict between caregivers | Two explicit roles, RLS enforcement, sync-bucket isolation of private data |
| Monetization arrives too early | Reduced adoption | No paid tier at launch; delay gating until habit is proven |
| New backend stack maturity | Build/integration risk | Supabase is mature; validate PowerSync sync rules + conflict handling early in Phase 1 |
| Compliance retrofit | Legal exposure / rebuild | GDPR-ready primitives built now; legal sign-off on COPPA/state posture before launch |

## Final Recommendation

Alora's strongest MVP is a focused coordination-first product built around one baby, two caregivers, a handoff dashboard, fast and durable local-first logging (SQLite + PowerSync + Supabase), a shared timeline, conservative local reminders, and a private, non-inferring secondary check-in with clearly-labeled support resources. Launching US-only on a GDPR-ready foundation keeps compliance bounded while preserving the path to expansion. This approach gives the product the best chance to become a trusted daily tool rather than a broad but fragile feature set.
