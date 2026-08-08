# Alora — AAA Mobile Design System

**Design direction:** Warm Editorial / Calm Luxury  
**Design name:** `Alora AAA — Warm Editorial`  
**Target:** Expo + React Native mobile application (iOS + Android)  
**Primary reference:** `assets/reference/alora-aaa-design-board-16x9.png`  
**Status:** implementation-ready design handoff

---

## 1. Purpose of this document

This document is the visual and interaction source of truth for the Alora frontend redesign.

The goal is **not** to reskin the existing Quiet Dawn interface while preserving the same visual composition. The goal is to retain Alora's product behavior and information architecture while rebuilding the presentation as a more premium, captivating, modern, emotionally warm mobile product.

An implementation agent should treat this document, `design-tokens.json`, `alora-theme.ts`, and the images under `assets/` as one design package.

### Non-negotiable implementation rule

**Preserve product behavior; replace visual hierarchy and composition.**

Do not remove or weaken:
- local-first logging;
- offline confidence and visible sync state;
- caregiver attribution;
- quick feed / diaper / sleep logging;
- the handoff-oriented Home experience;
- private per-user check-ins;
- shared-vs-private trust boundaries;
- local reminders and quiet hours;
- duplicate review / merge;
- account export and deletion semantics;
- accessibility and one-handed use.

Do **not** recreate the previous prototype card-for-card. Use the target screens in `assets/screens/` as the reference for hierarchy, proportion, restraint, surface treatment, and visual rhythm.

### Source-of-truth precedence

The design package separates **behavior**, **content**, and **visual treatment**. When sources disagree, use this order:

1. **Existing working application code and repository contracts** — authoritative for behavior, conditional states, role gating, data sources, navigation, and side effects.
2. **`IMPLEMENTED_BEHAVIOR_CONTRACT.md` + `screen-contracts.json`** — explicit preservation contract for the implemented screens covered by this redesign.
3. **`content-contracts.json`** — authoritative for pinned brand strings and for which content is data-driven.
4. **`design.md`, `design-tokens.json`, `alora-theme.ts`** — authoritative for visual design, hierarchy, spacing, typography, components, motion, and accessibility.
5. **Reference images** — visual inspiration/composition only. Text, controls, filters, dates, resources, and states visible in an image are **not automatically product requirements**.

If a reference image omits an implemented feature, **do not remove the feature**. Restyle and integrate it into the new design language.

If a reference image contains a control that does not exist in the implemented app, **do not add it solely to match the image**.

---

# 2. Design thesis

Alora should feel like a **beautifully designed home object**, not a health dashboard and not a productivity SaaS product.

The emotional tone is:

> **The calm in the chaos.**

The interface should make an exhausted parent feel that:
1. the important information is already organized;
2. logging will take only a few seconds;
3. the other caregiver can understand what happened;
4. private things are actually private;
5. the app will still work when connectivity is poor;
6. the visual experience is composed, warm, trustworthy, and adult.

### Keywords

`calm` · `editorial` · `warm` · `quiet luxury` · `human` · `private` · `tactile` · `softly illuminated` · `one-handed` · `high-trust`

### Avoid

`clinical` · `hospital` · `baby-blue/pink cliché` · `gamified` · `neon` · `tech dashboard` · `glassmorphism everywhere` · `dense grids` · `excessive gradients` · `cartoon nursery UI` · `over-rounded bubble UI`

---


# 2.1 Brand naming and user-facing strings

The redesign separates the **public product brand** from internal design-system names.

### Public product name

**`Alora`**

This is the only product name that should appear as the app/brand name in user-facing UI.

### Public brand line

**`The calm in the chaos.`**

This is the preferred short brand line when a secondary brand sentence is appropriate, including the Settings/About footer.

### Internal-only names

The following are implementation/design references and must **never** appear as public product branding:

- `Quiet Dawn`
- `Alora AAA`
- `Warm Editorial`
- `Alora AAA — Warm Editorial`

`Dawn` and `Night` may remain as **appearance/theme option labels** if the current Appearance setting exposes named themes. They are theme names, not part of the product name.

### Settings footer — exact replacement

Replace any existing footer such as:

`Alora · Quiet Dawn`

with:

**`Alora · The calm in the chaos.`**

If the screen also shows build metadata, place it separately underneath in low-emphasis Inter text, for example:

`Version 1.0.0 (42)`

Do not append an internal design-system name to the public brand string.

---

# 3. Product principles translated into UI

## 3.1 Coordination first

Home is a **handoff dashboard**, not a general feed.

On first glance the user should see:
- baby's current state;
- how long the current state has lasted;
- last important care events;
- who logged them;
- the likely next action.

The visual order is:

**Current state → quick actions → recent context → secondary details**

## 3.2 Fast before comprehensive

The common log path must be optimized for:
- one hand;
- a thumb-zone primary action;
- no mandatory typing;
- repeat-last / defaults;
- progressive disclosure.

The form should never visually resemble a long medical record.

## 3.3 Local confidence

Offline is normal, not an error state.

Use short, reassuring states:
- `Saved on this device`
- `Syncing`
- `Synced`
- `Will sync when you're back online`

Never block a care log behind a network spinner.

## 3.4 Shared by default, private where needed

Baby care is family-shared.

Personal Check-In is visually differentiated with:
- sage privacy chip;
- restrained copy;
- no family avatars;
- no "share" affordance;
- explicit "only you" messaging.

## 3.5 Calm, not clinical

Avoid scoring, diagnostic language, danger-color mood scales, streaks, points, charts, or pseudo-medical copy in Check-In.

## 3.6 Privacy as product UX

Trust is a first-class screen with human-readable explanations, not merely legal links.

---

# 4. Signature visual language

## 4.1 Warm editorial foundation

The redesign uses a calm editorial contrast:

- **Playfair Display** for emotionally important headings and large state values.
- **Inter** for controls, metadata, labels, navigation, and dense information.
- generous warm negative space;
- restrained hairline borders;
- lightly lifted ivory surfaces;
- event-specific accent colors;
- deliberate dark mode rather than simple color inversion.

The product should feel closer to premium editorial/lifestyle design than a tracking utility.

## 4.2 The visual hierarchy rule

Every screen may have **one dominant visual moment**.

Examples:
- Home: the current baby state/time.
- Log: the selected care action and the final CTA.
- Timeline: the chronological spine.
- Check-In: the reflection question.
- Invite: the invitation identity/code.
- Quiet Hours: the moon illustration and time range.
- Trust: the privacy shield and "You're in control."

Do not create five competing cards of equal visual weight.

## 4.3 Surface philosophy

Prefer:
- whitespace;
- separators;
- grouped rows;
- one or two elevated hero surfaces.

Avoid wrapping every label/value pair in a card.

---

# 5. Color system

The seven brand colors are derived from the selected design board.

| Token | Hex | Primary use |
|---|---:|---|
| Warm Sand | `#F2E7D9` | warm neutral field, tonal surfaces |
| Ivory | `#FEFBF7` | cards, sheets, high-emphasis light surfaces |
| Amber | `#D06C31` | primary action, feed, brand warmth |
| Sage | `#83A18C` | diaper, privacy, success, reassurance |
| Lavender | `#8F86C2` | sleep, invitation, quiet states |
| Indigo | `#2D3249` | deep calm, secondary dark accent |
| Charcoal | `#141113` | primary ink / Night foundation |

The app background in Dawn uses `#F6EFE6`, a slightly lighter operational variant of Warm Sand.

## 5.1 Dawn semantic colors

- App background: `#F6EFE6`
- Deep background: `#EEE1D2`
- Surface: `#FEFBF7`
- Raised surface: `#FFFDFC`
- Muted surface: `#F2E8DC`
- Primary text: `#141113`
- Secondary text: `#6F6259`
- Tertiary text: `#998B80`
- Hairline border: `#E6D7C6`
- Strong border: `#D5C2AF`
- Primary action: `#D06C31`
- Primary pressed: `#B75A29`
- Private/success: `#6F9E86`
- Danger: `#C54E38`

## 5.2 Night semantic colors

Night is not a black inversion of Dawn. It is a deep warm charcoal environment.

- App background: `#0F0D0E`
- Deep background: `#090809`
- Surface: `#181416`
- Raised surface: `#211B19`
- Muted surface: `#271F1B`
- Primary text: `#FFF8F0`
- Secondary text: `#C3B5A8`
- Tertiary text: `#897B71`
- Hairline border: `#382D29`
- Strong border: `#4A3A33`
- Primary action: `#E89A61`
- Primary pressed: `#CF7F46`
- Sage: `#86B29B`
- Lavender: `#A39ADC`
- Danger: `#E06A55`

## 5.3 Event colors

Color supports recognition but **never replaces labels or icons**.

- Feed → Amber
- Diaper → Sage
- Sleep → Lavender
- Growth → muted indigo/blue
- Private check-in → Sage
- Warning → muted ochre
- Destructive → terracotta/red

---

# 6. Typography

## 6.1 Families

### Display / emotional hierarchy
**Playfair Display**

Use for:
- screen titles when appropriate;
- Home greeting;
- hero status value;
- Check-In question;
- trust/deletion confirmation headings;
- invite code;
- large times.

### UI / operational hierarchy
**Inter**

Use for:
- buttons;
- navigation;
- labels;
- metadata;
- list rows;
- settings;
- chips;
- forms;
- timestamps;
- support copy.

Do not ship font files in the design package. Load them with the existing Expo Google Fonts strategy.

## 6.2 Type scale

| Style | Size / line-height | Weight | Family |
|---|---|---:|---|
| Display XL | 44 / 50 | 500 | Playfair Display |
| Display L | 36 / 42 | 500 | Playfair Display |
| H1 | 30 / 36 | 500 | Playfair Display |
| H2 | 24 / 30 | 500 | Playfair Display |
| H3 | 20 / 26 | 600 | Inter |
| Body L | 17 / 25 | 400 | Inter |
| Body | 15 / 22 | 400 | Inter |
| Body Medium | 15 / 22 | 500 | Inter |
| Label | 13 / 18 | 600 | Inter |
| Caption | 12 / 17 | 400 | Inter |
| Micro | 11 / 15 | 500 | Inter |

### Rules

- Prefer sentence case.
- Avoid all-caps except micro category labels.
- Do not make most of the interface bold.
- Large serif values should have generous line-height and room around them.
- Maximum readable body width on informational screens: ~46–54 characters.

---

# 7. Spacing and geometry

Use a 4pt base grid.

## 7.1 Spacing

`4, 8, 12, 16, 20, 24, 32, 40, 48`

Primary screen horizontal padding: **20**

Section separation: **24–32**

Compact list-row vertical padding: **14–16**

## 7.2 Radius

- Small controls: 10
- Standard controls: 14
- Cards: 18
- Hero cards: 24
- Large sheet/illustration surfaces: 30
- Chips / segmented pills: 999

The app should feel soft, but **not bubbly**. Avoid applying 24–30px radii to every row.

## 7.3 Borders

Use 1px hairlines.

Borders do more of the structural work than shadows.

Dawn:
`#E6D7C6`

Night:
`#382D29`

## 7.4 Elevation

Use only three elevation levels:

1. **Surface** — no shadow
2. **Raised** — subtle shadow + border
3. **Floating** — bottom navigation / modal sheet only

Avoid strong drop shadows on every card.

---

# 8. Iconography

Style:
- monoline;
- rounded endpoints;
- 1.75–2px optical weight;
- simple silhouettes;
- calm, recognizable shapes.

Do not use filled emoji as primary navigation.

Recommended icon categories:
- Feed: bottle
- Diaper: diaper
- Sleep: crescent moon
- Timeline: vertical event/timeline
- Check-In: outline heart
- Settings/More: simple gear or three dots
- Privacy: lock
- Invite: people/heart shield
- Trust: shield lock
- Sync: subtle circular arrows/cloud check

Use existing `react-native-svg` infrastructure.

Provided vectors:
- `assets/brand/alora-sun-mark.svg`
- `assets/illustrations/invite-heart-shield.svg`
- `assets/illustrations/moon-quiet-hours.svg`
- `assets/illustrations/privacy-shield.svg`
- `assets/illustrations/checkin-botanical.svg`

---

# 9. Navigation

The five primary destinations remain:

1. Home
2. Log
3. Timeline
4. Check-In
5. Settings / More

## 9.1 Bottom bar

The bar should:
- float 10–14px above the safe-area bottom;
- use an ivory / warm dark raised surface;
- be 64–70px tall;
- have a subtle border;
- have a low-opacity floating shadow;
- preserve 44px minimum tap targets.

### Active state

Use **one** of:
- filled soft circular background;
- slightly darker/lighter tab slot;
- accent icon + label.

Do not use:
- large animated blobs;
- neon glows;
- exaggerated bouncing.

Log may use a slightly more prominent central affordance if desired, but should not visually overpower Home.

---

# 10. Core components

## 10.1 `ScreenHeader`

Contains:
- optional eyebrow/status;
- Playfair screen title;
- secondary sentence in Inter;
- optional right action.

Keep header content calm and short.

## 10.2 `HeroStateCard`

Used on Home.

Structure:
- baby/avatar row;
- current state label;
- large state duration/value;
- one-line context;
- next-action hint.

Hero card gets the strongest soft elevation on Home.

## 10.3 `QuickAction`

Square-ish or compact capsule.

Required:
- icon;
- explicit label;
- minimum 44px touch area.

Feed / Diaper / Sleep use event color accents, not full saturated backgrounds.

## 10.4 `ActivityRow`

Use:
- small event icon;
- primary event description;
- actor + time metadata;
- optional chevron.

Avoid separate cards for every row. Group rows inside a single raised surface or a divided list.

## 10.5 `PrimaryButton`

Height: 54–58px  
Radius: 16–18px  
Weight: 600

Dawn default: Amber background + Ivory text.  
Night default: warm amber background + dark/ivory text chosen for contrast.

Check-In may use Sage as a contextual primary.

Invite may use Lavender as a contextual primary.

Destructive uses danger only at the last explicit destructive action.

## 10.6 `SecondaryButton`

Ivory/transparent surface with a strong hairline border.

No gray filled rectangles unless context calls for a muted state.

## 10.7 `ChoiceChip`

Use for:
- feed method;
- timeline filters;
- role selection;
- mood labels;
- quick presets.

Selected:
- accent border;
- soft tinted fill;
- slightly stronger text.

## 10.8 `AmountStepper`

A single rounded input surface with:
- minus button;
- large centered amount;
- unit;
- plus button.

Do not use three unrelated floating buttons.

## 10.9 `PrivacyChip`

Sage tinted:
`lock icon + Private · only you`

This should be visually consistent everywhere.

## 10.10 `SyncStatus`

Tiny operational status, not a banner unless there is a real failure.

Examples:
- `Synced`
- `Saved locally`
- `Syncing`
- `Offline · will sync later`
- `Edited 1m ago`

`Edited … ago` is an implemented event state and must remain visually distinct from transport/sync state. Do not collapse edit history into a generic `Synced` label.

## 10.11 `RepeatLastRow`

Used near the top of Log for the fastest common-entry path.

Structure:
- event icon;
- `Repeat last` title;
- **dynamic hint** from the most recent compatible event, e.g. method/amount/caregiver/time;
- compact `Repeat` action.

The hint is data-driven. Do not pin prototype values such as `Bottle · 120 ml · Sam, 2h ago`.

The row must remain visible when the existing implementation has a repeatable prior event and must not be replaced by a generic preset chip.

## 10.12 `RoleOption`

Used by Invite Caregiver.

Each role option contains:
- role name;
- short audience hint;
- concise permission summary;
- selected state.

Implemented roles:
- `Partner`
- `Limited`

The Limited role is suitable for scoped caregivers such as grandparents/nannies. Its UI must make the narrower permission boundary clear.

## 10.13 `RoleBadge`

Small, readable role identity used in Settings/Trust where helpful:
- Owner
- Partner
- Limited

Use text plus restrained color; never encode role solely by color.

---

# 11. Screen specifications

# 11.1 Home — Handoff Dashboard

Reference:
`assets/screens/home.png`

### Objective

Answer within seconds:
- what is the baby doing now?
- what happened last?
- what should I know before I take over?
- where does my current caregiver shift begin?

### Composition

1. **Greeting / handoff context**
   - `Good morning, Alex.`
   - recent caregiver handoff context beneath it
   - no giant dashboard header

2. **Hero state card**
   - baby avatar/name/age
   - current status e.g. `ASLEEP`
   - large duration e.g. `1h 12m`
   - state detail e.g. `napping`
   - event origin e.g. `Down since 9:23 AM · put down by Sam`
   - current-state context

3. **Quick actions**
   - Feed
   - Diaper
   - Sleep/Wake
   - preserve any implemented additional quick action without crowding the primary three

4. **Next-action / likely-feed row**
   - preserve the implemented `Next feed likely` / next-reminder surface
   - value is derived from current rhythm/data; do not hard-code a prototype time
   - treat it as a calm, low-height informational row, not a large competing card

5. **At a glance / recent care**
   - 2–4 high-value items such as last feed and last diaper
   - actor attribution remains visible
   - avoid six equal dashboard cards

6. **Care Briefing**
   - this is an implemented Home feature and must not be omitted
   - summarizes the relevant last-24h handoff context (including last feed/diaper and open sleep where available)
   - exposes the existing start-of-shift interaction
   - preserve the implemented `Start my shift` / `Mark shift start` behavior and current copy used by the app
   - the handoff marker is locally persisted; the visual refactor must not turn it into a server-dependent action
   - once a shift start exists, the briefing should visually distinguish activity since that marker without inventing new analytics

7. **Bottom navigation**

### Improvements over the previous visual model

- reduce nested card density;
- make current state more dominant;
- integrate the next-feed row without letting it compete with the hero;
- give Care Briefing a distinct but secondary editorial surface;
- group recent activity cleanly;
- use typography, spacing, and separators rather than borders everywhere;
- expose caregiver handoff context and shift boundary clearly.

### Behavioral preservation

The Home redesign must preserve:
- current baby status derivation;
- quick logging entry points;
- next-action/reminder calculation already used by the app;
- Care Briefing content;
- locally persisted shift-start marker;
- caregiver attribution;
- local-first/offline behavior.

---

# 11.2 Log — Fast logging

Reference:
`assets/screens/log.png`

### Objective

Save a common care event in seconds with one hand.

### Default structure

1. Screen heading
2. Event selector: preserve implemented Feed / Diaper / Sleep structure and any currently supported subtype entry points
3. **Repeat Last row**
   - appears when a compatible recent event exists
   - shows a dynamic hint derived from that event
   - includes the existing `Repeat` action
4. Event-specific fields
5. Primary save action
6. Tiny local/sync status below CTA where the current flow exposes one

### Feed example

- Method: Breast / Bottle / Pumping
- Amount stepper when applicable
- preserve unit-aware behavior from the existing form
- optional notes
- CTA uses the current event context, e.g. `Save bottle`

### Interaction rules

- repeat-last is a first-class fast path, not merely a design principle;
- last-used/default values may be preselected where the current implementation already does so;
- keyboard should not appear unless the user enters a text field;
- saving writes locally first and returns feedback immediately;
- do not add extra confirmation steps;
- preserve durable timers and existing feed/diaper/sleep subtype behavior.

### Repeat-last content

The display text is data-driven. A reference image value such as `Bottle · 120 ml · Sam, 2h ago` is illustrative only. Render the actual previous event summary produced by the app.

---

# 11.3 Timeline — Shared history

Reference:
`assets/screens/timeline.png`

### Objective

Make the shared family story understandable without feeling like an audit log.

### Implemented information model

The existing Timeline is the behavioral source of truth. The redesign must preserve:
- chronological event ordering;
- event type/value;
- actor attribution;
- edit markers;
- pending/synced state;
- possible-duplicate handling;
- pagination through `Load earlier events`.

### Visual model

A restrained chronological spine/list may be used to modernize the screen.

Each event should expose the fields already available in the implementation:
- timestamp;
- event icon/type;
- value/details;
- actor;
- sync/edit metadata when present;
- duplicate affordance when present.

### Do not invent filter/date features

The reference artwork may visually suggest filter chips or Today/Yesterday/date grouping. Those are **not requirements for the current redesign** unless they already exist in the code at implementation time.

Do not add:
- Feed/Diaper/Sleep filter chips solely because they appear in a design image;
- caregiver filters solely because they appear in a design image;
- artificial Today/Yesterday/date sections if the current Timeline is not grouped that way.

### Pagination

Preserve the implemented:

**`Load earlier events`**

Treat it as a clear secondary action at the end of the currently loaded event list. Keep its loading/disabled/error behavior intact.

### Duplicate state

A possible duplicate remains attached to the relevant event.

The current interaction supports both:
- opening Merge Review; and
- an inline **`Keep both`** action.

Preserve both paths.

Do not auto-merge and do not force the user into Merge Review just to dismiss a legitimate pair of separate events.

---

# 11.4 Check-In — private personal moment

Reference:
`assets/screens/check-in.png`

### Objective

Feel personal, safe, and intentionally separate from baby-care tracking.

### Composition

1. `Check-In`
2. privacy chip
3. Playfair prompt:
   `How are you doing today?`
4. supporting line:
   `No streaks, no scores. Just a check-in.`
5. five mood choices
6. optional reflection field
7. contextual Sage CTA
8. persistent support-resource surface rendered from repository data
9. decorative botanical line art near the bottom

### Support resources — data contract

Support-resource **content is data-driven**. The visual prototype is illustrative and is **not** the source of truth for resource names, phone numbers, organizations, URLs, ordering, or availability.

Implementation requirements:

- Read support resources from the existing repository/data layer (for example the current `mockRepository.ts` in demo mode and the live repository/backend in configured modes).
- Render the records returned by that repository in their provided order.
- Preserve repository-provided title, subtitle/description, action label, phone number, URL, and resource type where those fields exist.
- Do **not** hard-code a `988 Lifeline` row merely because an older prototype/reference image contains one.
- The current demo/mock dataset may contain resources such as PSI, AAP safe-sleep guidance, or urgent-help content; render the actual current data rather than replacing it with prototype copy.
- Reference screenshots under `assets/screens/` specify **layout and visual treatment only** for this area.
- Do not infer resource content from mood selection.
- Do not auto-surface different resources because a user selected a particular mood.
- If the repository returns no resources, keep the Check-In completion flow functional and show a neutral `Support resources` affordance only if the existing product data/API provides a valid destination.

The resource list remains subject to the product's existing review/sign-off process. A UI redesign must not silently rewrite safety/resource copy.

### Mood

Use simple, low-detail faces or icons.

Labels — preserve the implemented `MOODS` values exactly:
- Low
- Tired
- Okay
- Good
- Great

Do not use red-to-green scoring visualization.

### Safety

No mood inference.
No score.
No automated "you may be depressed" behavior.
No streak.
No gamification.

### Saved state

After a successful local save, preserve the implemented private confirmation:

**`Saved privately on this device.`**

This confirmation communicates both durability and privacy. It should be visually calm and brief; do not replace it with a generic success toast such as `Saved!`.

---

# 11.5 Invite Caregiver

Reference:
`assets/screens/invite-caregiver.png`

### Objective

Turn a security-sensitive action into a calm trust ritual while preserving the implemented role choice.

### Composition

1. title
2. short trust copy
3. **role picker**
   - Partner
   - Limited
4. concise permission scope for the selected role
5. `invite-heart-shield.svg` or equivalent restrained trust illustration
6. generated invitation code in Playfair
7. expiry / single-use metadata
8. prominent share action
9. revoke / regenerate action
10. concise reminder that access can be removed later

### Role behavior

The role picker is not optional decoration. It maps directly to the role supplied to invite generation.

#### Partner
Present as the standard shared caregiver role. Preserve the actual partner permissions enforced by the application/backend; do not expand them based on marketing copy.

#### Limited
Present as a scoped caregiver role appropriate for cases such as a grandparent or nanny.

The UI must clearly communicate that Limited access is narrower. The implemented product allows Limited caregivers to participate in care logging/timeline within their scope but does not grant private check-in access or sensitive trust/admin capabilities.

Do not imply that Limited users can see private Check-In data, audit/admin surfaces, or unrestricted family controls.

### Invite mechanics

- The code is functional text, not a decorative image.
- Codes remain single-use, time-limited, and revocable.
- The configured family seat limit is enforced by the existing backend flow; do not hard-code a two-seat assumption in this screen.
- If QR is used, generate it dynamically from the current invitation token/link.

---

# 11.6 Reminders & Quiet Hours

Reference:
`assets/screens/quiet-hours.png`

### Objective

Make reminder control feel like rest protection rather than notification configuration while preserving the complete implemented reminder screen.

### Composition

1. `Reminders & quiet hours` title
2. **Quiet Hours card**
   - enabled/disabled state
   - start/end time
   - compact time-range visualization if helpful
3. **Reminder rows**
   - Feed reminder
   - Diaper check
   - Bedtime routine
4. per-reminder toggle and existing schedule/detail text
5. on-device notification disclaimer
6. Expo Go / unsupported-environment warning when the current runtime cannot provide real notification behavior

### Quiet Hours

Use native time pickers in the actual editor.

Do not implement a custom inaccessible time picker solely to match the artwork.

Quiet Hours suppress reminder firing during the configured interval; do not visually imply it disables logging or data sync.

### Reminder rows

The three implemented reminder categories must not disappear in the redesign:
- Feed reminder
- Diaper check
- Bedtime routine

Preserve each row's current cadence/detail from the underlying preferences/data rather than pinning prototype example values.

### On-device disclaimer

Make the local nature of reminders explicit. Preserve the meaning of the implemented explanation:

**Alora uses on-device notifications; reminders are scheduled on the phone rather than sent from a server.**

The exact existing product copy may be retained if it differs slightly.

### Expo Go / unsupported warning

The notification layer is intentionally guarded so the app can run without crashing in unsupported environments. When the existing implementation surfaces an Expo Go/development-build limitation, retain that warning and restyle it as a low-alarm informational notice.

Do not remove the warning merely because it is absent from the reference image.

---

# 11.7 Trust & Privacy

Reference:
`assets/screens/trust-privacy.png`

### Objective

Make privacy visible enough to become part of the value proposition while preserving the implemented trust model.

### Theme behavior

**Respect the user's current Dawn/Night appearance.**

Do not force Trust & Privacy into Night mode when the rest of the app is in Dawn. The dark reference image is a visual study, not a navigation side effect.

### Core content

The Trust screen is more than a list of storage actions. Preserve these implemented areas:

1. **Who can see what / access matrix**
   - shared family data
   - private-to-user data
   - owner/admin-only controls where applicable
2. **Audit log / sensitive change history**
   - role-gated according to the existing implementation
3. **Support resources**
   - content remains repository/data-driven
4. **Privacy policy link**
   - preserve existing environment/configuration gating
5. **Data export**
6. **Account deletion entry point**
7. any existing owner/family trust actions that are available to the current role

### Shared/private/owner matrix

Modernize the existing matrix rather than replacing it with generic rows.

The visual system should clearly distinguish:

#### Shared with family
Examples include shared baby-care data such as feeds, diapers, sleep, timeline/history, and baby profile information according to the current implementation.

#### Private to you
Daily Check-In/reflection content remains per-user private and must never be visually presented as family-shared.

#### Owner/admin only
Sensitive family-management controls are shown only when the current role is permitted to see them.

### Role gating

Trust content is conditional.

Limited users must not gain access to trust/admin content through the redesign. Preserve the existing role checks rather than rendering disabled rows that reveal unavailable sensitive actions.

### Trust positioning footer — pinned copy

Use the implemented trust statement:

**`No ads. No data selling. Export and leave anytime.`**

This replaces generic variants such as `We never sell your data.`

### Visual treatment

Use:
- `privacy-shield.svg` as optional hero artwork;
- Playfair for one trust headline;
- Inter for the matrix, explanations, and actions;
- restrained separators and grouped surfaces.

### Destructive row

Delete Account may use danger accent text but not a large red block until the final confirmation flow.

---

# 12. Secondary screens and how to extend the system

The selected visual board does not show every implemented screen. These screens are nevertheless **part of the redesign scope**. Apply the same Warm Editorial visual grammar without changing their existing behavior.

## 12.1 Settings

Use an editorial list rather than a grid of cards.

Suggested visual grouping:
- Family / caregivers
- Baby
- Reminders
- Growth / reports
- Privacy & trust
- Appearance
- About

### Role-aware visibility

Settings is not a universal static menu.

Preserve existing role checks.

At minimum, a **Limited** caregiver must not be shown sensitive rows for:
- caregiver invite/admin actions;
- seat-limit management;
- trust/admin surfaces;
- data export;
- account deletion/admin pathways that the current implementation hides.

Do not show these rows merely disabled if the current app intentionally hides them.

Owner/Partner visibility may have additional differences. Preserve the code's current permission checks rather than broadening access from this document.

### Settings footer

Use:

**`Alora · The calm in the chaos.`**

Optional version/build metadata belongs on a separate low-emphasis line.

Never display `Alora · Quiet Dawn`, `Alora AAA`, or `Warm Editorial` as the public footer.

## 12.2 Seat Limit

This is an implemented screen and must be included in the redesign.

### Purpose

Allow permitted non-Limited caregivers to configure the family's caregiver-seat cap.

### Implemented choices

Preserve the current picker model:
- `No limit`
- numeric limits `2–6`

Do not assume the family is permanently limited to two caregivers.

### Behavior

- current configured value is selected;
- save/update uses existing repository/backend behavior;
- changes remain audit-logged by the existing data layer;
- Limited caregivers do not get this management surface.

### Visual treatment

Use a quiet single-choice list or segmented picker with:
- current value;
- one short explanation;
- one primary save action.

Avoid pricing/paywall language; seat limit is currently a family setting, not a billing screen.

## 12.3 Authentication — Sign In / Sign Up

Auth is part of the production mobile experience and must not be omitted from the redesign plan.

### Screens

Preserve the existing Supabase Auth flow:
- Sign In
- Sign Up

There is currently **no password-recovery/reset screen in the app**. Do not invent one as part of the redesign. If the product adds a recovery flow later, style it with this system and the same auth contracts.

### Visual treatment

Use the Warm Editorial system with:
- Alora mark/name;
- concise Playfair welcome heading;
- Inter form labels and validation;
- large native text fields;
- clear primary CTA;
- secondary link between Sign In and Sign Up.

### Behavioral constraints

- do not change auth provider or session behavior during the visual redesign;
- preserve SecureStore session persistence/offline cold-start behavior;
- preserve existing auth gating/routing;
- validation and error states must remain readable in both themes.

## 12.4 Growth

Growth is already implemented and is not a generic decorative chart.

### Implemented behavior to preserve

- WHO reference data;
- weight/length views currently supported by the app;
- P3 / P50 / P97 reference bands;
- **Boy / Girl reference picker**;
- persisted baby-sex reference selection;
- **birth-date entry/form** used for age-based plotting;
- months 0–24 reference range.

### Visual treatment

- warm neutral screen background;
- clean chart surface;
- Inter for axes, labels, units, and controls;
- Playfair only for a major current measurement/title where useful;
- growth indigo for the user's primary series;
- clearly distinguish P3/P50/P97 without making the chart decorative;
- explicit units;
- picker controls must remain accessible and legible.

Do not collapse the sex-specific WHO reference behavior into a single neutral percentile band.

## 12.5 Pediatrician Report

The current implementation **generates and shares a PDF directly**. There is no requirement to build a new in-app report preview.

### Preserve

- report generation from existing data;
- exclusion of private Check-In/reflection content;
- `expo-print` generation;
- native share sheet through the existing sharing flow.

### UI

The Settings action may use:
- row label;
- short explanation;
- generate/share loading state;
- success/error feedback.

Do **not** add a paper-preview screen just because a design concept sounds attractive.

The generated PDF itself may retain or later adopt Alora's typography/color language, but that is separate from inventing a new preview route.

## 12.6 Merge Duplicate

Treat as a focused conflict-resolution screen.

### Normal merge state

Preserve:
- comparable candidate rows;
- implemented semantic badges such as **Original**, **Edited**, and **Duplicate** where applicable;
- selected/kept state;
- primary `Merge into one entry`;
- secondary path to keep both events.

### Missing/stale duplicate state

Preserve a dedicated **`Duplicate not found`** state when the duplicate target is no longer available.

That state should:
- explain the record may already have changed/resolved;
- offer a safe route back to Timeline;
- not fabricate replacement data.

### Timeline relationship

Timeline itself also retains an inline **Keep both** action. Merge Review is not the only way to dismiss a duplicate.

## 12.7 Delete Account

The deletion UI is **role-dependent**. Do not implement one static set of three consequences for every user.

### Common treatment

Use:
- Playfair `Before you go.`
- calm explanatory copy;
- consequence rows appropriate to the current branch;
- large negative-space separation;
- existing hold-to-delete interaction;
- `Keep my account`.

Use danger color sparingly.

### Branch A — Owner with another eligible caregiver/partner

Communicate the implemented semantics:
- ownership transfers to the successor caregiver;
- shared baby/history remains with the family;
- departing user's attribution becomes `former caregiver` where applicable;
- departing user's PII and private Check-In/reflection data are erased.

### Branch B — Sole owner

Communicate clearly:
- the family has no successor;
- the family, baby, and associated family data are deleted according to the existing server-side deletion flow;
- the user's private/PII data are deleted.

This branch must not incorrectly promise that shared history remains.

### Branch C — Partner/non-owner leaving

Communicate:
- user's PII/private Check-In data are deleted;
- family and shared history remain with the owner/family;
- preserve the existing attribution/departure behavior.

### Success states

The app has branch-specific completion/success states. Preserve the existing success outcome/copy/navigation for all three branches rather than reusing one generic `Account deleted` screen.

The design specification governs presentation; the implementation's current branch logic and server result remain authoritative.

## 12.8 Onboarding

The current onboarding is an operational setup flow, not four generic marketing slides.

### Preserve the implemented sequence

1. **Welcome**
   - concise product framing
2. **Privacy**
   - explain shared family care data vs private personal Check-In data
3. **Baby Setup**
   - collect the implemented baby's **name and age** fields
   - preserve current validation/state handling
4. **Invite**
   - caregiver invitation setup using the current invite behavior

Do not replace Baby Setup or Invite with abstract feature-story slides.

### Visual treatment

Each step may still use:
- one strong visual/brand moment;
- one Playfair heading;
- short Inter explanation;
- one clear CTA;
- restrained progress indicator.

But the functional inputs/actions above are mandatory.

### Replay behavior

Onboarding is replayable in the existing app. Preserve replay behavior and do not turn replay into destructive account/family setup actions.

## 12.9 Loading / Empty / Error / Offline states

### Loading
Use skeletons shaped like the final content.
Do not use full-screen spinners for Home/Timeline.

### Empty
Use a small custom line illustration and one relevant action.

### Error
State what remains safe where appropriate, e.g. local logs remain on device.

### Offline
Offline is not an error.

### Timeline
Pagination/load failure must not remove already loaded events.

## 12.10 Existing Timeline pagination

`Load earlier events` is part of the current Timeline behavior and must receive:
- default state;
- loading state;
- disabled/end-of-history state if the implementation exposes one;
- retry/error treatment if the current code exposes it.

---

# 13. Motion and haptics

Motion should make Alora feel alive without waking up the room.

## 13.1 Durations

- Fast micro state: 140ms
- Standard transition: 220ms
- Large reveal: 360ms
- Stagger between rows: 45ms

## 13.2 Motion patterns

### Press
Scale to `0.985`, then return.

### Home hero
Very subtle breathing/presence motion only for an active live state such as sleep timer.

### Timeline
Rows fade/translate in with tiny stagger.

### Tab indicator
Spring with restrained damping; no overshoot spectacle.

### Modal/sheet
Fade + short vertical shift.

### Success
Short haptic + subtle icon state, not confetti.

## 13.3 Reduce motion

Respect OS reduce-motion.

When enabled:
- remove continuous breathing;
- replace transforms with opacity;
- keep duration short.

---

# 14. Accessibility

Minimum requirements:

- 44 × 44 logical-pixel tap targets.
- Dynamic type support.
- Do not encode event type only with color.
- Text contrast target WCAG AA.
- VoiceOver/TalkBack names for icon-only controls.
- Logical traversal order.
- `Reduce Motion` respected.
- Native date/time controls where practical.
- Avoid ultra-light text weights.
- Check-In mood options include text labels.
- Hold-to-delete must have an accessible alternative confirmation path if platform accessibility makes hold interaction difficult.

---

# 15. One-handed ergonomics

Design for a caregiver holding a baby.

### Place near bottom / thumb zone

- primary Save CTA;
- quick-log actions;
- tab bar;
- repeat-last;
- common method chips.

### Avoid

- mandatory top-right actions for common flows;
- tiny +/- controls;
- dense horizontally scrolling forms;
- required note entry.

---

# 16. Dawn / Night behavior

Theme toggle may continue to use Alora's existing appearance setting.

## Dawn

Emotion:
- sunrise;
- warm paper;
- soft daylight;
- quiet clarity.

## Night

Emotion:
- near-black room;
- warm lamp;
- muted amber;
- lavender moonlight;
- low luminance.

### Night rule

Avoid pure black + pure white wherever possible.

Night CTA colors should remain warm, not fluorescent.

Do not add aurora/neon gradients. That is a different design direction and is explicitly outside this selected system.

---

# 17. Visual asset usage

## Production-safe assets

### `assets/brand/alora-sun-mark.svg`
Use:
- onboarding;
- empty states;
- brand lockups;
- About.

Do not stamp it on every screen.

### `assets/illustrations/invite-heart-shield.svg`
Use on Invite Caregiver.

### `assets/illustrations/moon-quiet-hours.svg`
Use on Quiet Hours and optionally a reminders empty state.

### `assets/illustrations/privacy-shield.svg`
Use on Trust & Privacy.

### `assets/illustrations/checkin-botanical.svg`
Use as low-contrast decoration only on Check-In.

## Reference-only assets

Everything under:
`assets/reference/`
and
`assets/screens/`

These images are design references for the implementation agent. They should generally **not** be embedded as screenshots in the shipping app.

---

# 18. Implementation mapping for the existing project

The current codebase already has reusable primitives, a theme provider, icon infrastructure, a floating tab bar, and Reanimated motion. Reuse those architectural seams rather than rebuilding behavior from scratch.

Recommended migration:

1. Replace the existing visual token values.
2. Load Playfair Display + Inter.
3. Refactor base primitives:
   - AppText
   - Card
   - PressableScale
   - Screen container
   - ChoiceChip
   - PrimaryButton
   - FloatingTabBar
4. Redesign Home composition.
5. Redesign Log composition.
6. Redesign Timeline into the vertical-spine model.
7. Redesign Check-In.
8. Redesign Settings / trust flows.
9. Apply Night theme.
10. Finish loading/empty/error/offline states.
11. Run accessibility and one-handed-use audit.

Do not modify repositories, synchronization rules, RLS semantics, or the local-first write path as part of the visual refactor unless a UI requirement genuinely requires an interface-level adapter.

---

# 19. Component inventory to implement

Recommended shared components:

- `Screen`
- `ScreenHeader`
- `EditorialTitle`
- `SectionHeader`
- `HeroStateCard`
- `BabyIdentity`
- `QuickAction`
- `PrimaryButton`
- `SecondaryButton`
- `ChoiceChip`
- `SegmentedControl`
- `EventIcon`
- `ActivityList`
- `ActivityRow`
- `TimelineSpine`
- `TimelineEvent`
- `SyncStatus`
- `PrivacyChip`
- `AmountStepper`
- `FormField`
- `SettingsGroup`
- `SettingsRow`
- `IllustrationStage`
- `EmptyState`
- `ErrorState`
- `OfflineNotice`
- `FloatingTabBar`
- `BottomSheet`
- `HoldToDelete`
- `RepeatLastRow`
- `RoleOption`
- `RoleBadge`

Use composition, not screen-specific copies.

---

# 20. Screen acceptance criteria

A design migration is not complete until both **visual** and **behavioral** acceptance criteria pass.

### Home
- current baby state is visually dominant;
- quick actions remain one-handed;
- next-feed/next-action row is preserved;
- Care Briefing is present;
- Start/Mark shift behavior is preserved;
- shift marker remains locally persisted;
- caregiver attribution is visible.

### Log
- common entry can be saved in under 10 seconds;
- Repeat Last row is preserved with dynamic hint;
- no unnecessary keyboard;
- CTA is reachable one-handed;
- local save remains immediate.

### Timeline
- chronology is visually obvious;
- actor attribution is readable;
- edited/pending/duplicate states are represented;
- `Edited … ago` remains representable;
- inline `Keep both` is preserved;
- Merge Review remains available;
- `Load earlier events` pagination is preserved;
- no new filter chips/date grouping are added solely from visual references.

### Check-In
- unmistakably private;
- mood labels are `Low / Tired / Okay / Good / Great`;
- no scores/streaks/inference;
- successful save can show `Saved privately on this device.`;
- support resources remain repository-driven;
- does not look like a clinical assessment.

### Invite
- Partner/Limited role picker is preserved;
- Limited permission scope is explained accurately;
- invite remains single-use/time-limited/revocable;
- seat-limit assumptions are not hard-coded.

### Reminders
- Quiet Hours remains;
- Feed reminder, Diaper check, and Bedtime routine rows remain;
- on-device notification explanation remains;
- unsupported/Expo Go warning remains where the current runtime requires it.

### Trust
- respects current Dawn/Night theme;
- shared/private/owner matrix remains;
- audit history remains role-gated;
- support resources remain data-driven;
- privacy-policy link remains;
- footer uses `No ads. No data selling. Export and leave anytime.`;
- export/delete access remains correctly role-gated.

### Settings
- Limited role does not gain sensitive admin rows;
- seat-limit entry point is preserved for permitted roles;
- brand footer uses the pinned public brand string.

### Growth
- Boy/Girl WHO reference picker remains;
- birth-date input remains;
- P3/P50/P97 semantics remain;
- units and reference range remain understandable.

### Pediatrician report
- direct PDF generation/share flow remains;
- no private Check-In content is included;
- no new preview route is required.

### Merge
- Original/Edited/Duplicate semantic badges remain where applicable;
- Duplicate not found state is designed;
- Keep both remains available.

### Delete
- all role-dependent deletion branches remain accurate;
- sole-owner deletion is not presented as ownership transfer;
- branch-specific success states remain.

### Onboarding/Auth
- Sign In/Sign Up remain in scope (no recovery screen currently exists; do not invent one);
- onboarding sequence remains Welcome → Privacy → Baby Setup → Invite;
- Baby Setup functional inputs are not removed.

### Themes
- both Dawn and Night pass contrast review;
- Night does not become neon;
- screens remain visually consistent.

---

# 21. Anti-pattern checklist

Reject an implementation if it:

- simply changes colors on the existing Quiet Dawn composition;
- puts every content block in its own rounded card;
- uses gradients on every primary button;
- uses emoji as core iconography;
- reduces font sizes to fit more data;
- adds streaks, scores, badges, or gamification;
- hides actor attribution;
- makes offline state look broken;
- uses the same accent for feed, diaper, and sleep;
- exposes private Check-In data to family UI;
- makes destructive privacy controls visually casual;
- replaces clear labels with icon-only mystery controls;
- turns Night into a neon/cyberpunk theme;
- leaves `Alora · Quiet Dawn` or another internal design-system name in public UI;
- hard-codes prototype support-resource copy instead of rendering repository data.
- changes onboarding into four marketing-only slides and removes Baby Setup;
- forces Trust into Night mode regardless of the user's current theme;
- replaces the implemented Trust matrix with a generic five-row privacy menu;
- changes the `Low` mood to `Rough`;
- uses one static delete consequence list for every account role;
- removes Feed/Diaper/Bedtime reminder rows;
- removes the Partner/Limited invite role picker;
- drops Home Care Briefing or the local shift-start marker;
- removes the Seat Limit screen;
- omits Sign In/Sign Up from the redesign;
- exposes sensitive Settings rows to Limited caregivers;
- removes Boy/Girl or birth-date controls from Growth;
- invents an in-app pediatrician-report preview route;
- invents Timeline filters/date groups solely from artwork;
- removes `Load earlier events`;
- removes inline `Keep both`;
- omits `Duplicate not found` from Merge Review;
- omits `Saved privately on this device.` after Check-In save;
- treats Repeat Last as optional decoration rather than implemented behavior;

---

# 22. Design QA checklist for an LLM/code agent

For every modified screen:

1. Read `IMPLEMENTED_BEHAVIOR_CONTRACT.md` and the matching entry in `screen-contracts.json`.
2. Inspect the existing screen code before changing layout.
3. Compare against `assets/screens/*.png` for visual hierarchy only.
4. Verify no visual-reference-only control was added without existing product support.
5. Verify no implemented control/state was removed because the reference image omitted it.
6. Verify use of tokens rather than arbitrary inline colors.
7. Verify Playfair is limited to editorial hierarchy.
8. Verify Inter is used for operational text.
9. Verify 20px default screen horizontal rhythm unless the existing screen requires an edge-to-edge surface.
10. Verify 44px minimum tap targets.
11. Verify color is not the only semantic signal.
12. Verify Dawn and Night.
13. Verify dynamic text at 120–135% does not clip.
14. Verify common actions remain one-handed.
15. Verify loading, offline, edit, and sync feedback.
16. Verify role gating with Owner, Partner, and Limited fixtures.
17. Verify current repository-driven content is not replaced with screenshot copy.
18. Verify no user-facing `Quiet Dawn`, `Alora AAA`, or `Warm Editorial` brand string remains.
19. Verify Home Care Briefing + shift marker.
20. Verify Log Repeat Last.
21. Verify Timeline `Load earlier events`, inline `Keep both`, and edit markers.
22. Verify Check-In `Low` mood + private save confirmation.
23. Verify Invite Partner/Limited selection.
24. Verify Reminder rows + on-device/unsupported notices.
25. Verify Trust matrix + pinned trust footer.
26. Verify Seat Limit screen and role access.
27. Verify Growth Boy/Girl + birth-date behavior.
28. Verify pediatrician report stays direct generate/share.
29. Verify Merge badges + Duplicate not found.
30. Verify all three deletion branches and success outcomes.
31. Verify onboarding functional sequence.
32. Run typecheck, lint, and tests; do not declare completion if behavior regresses.

---

# 23. Reference files

## Full board
`assets/reference/alora-aaa-design-board-16x9.png`

## Screen crops
- `assets/screens/home.png`
- `assets/screens/log.png`
- `assets/screens/timeline.png`
- `assets/screens/check-in.png`
- `assets/screens/invite-caregiver.png`
- `assets/screens/quiet-hours.png`
- `assets/screens/trust-privacy.png`

## Supporting references
- `assets/reference/design-system-panel.png`
- `assets/reference/principles-strip.png`
- `assets/reference/brand-lifestyle.png`

## Machine-readable / code
- `design-tokens.json`
- `alora-theme.ts`
- `content-contracts.json`
- `screen-contracts.json`

## Behavior preservation
- `IMPLEMENTED_BEHAVIOR_CONTRACT.md`
- `RECONCILIATION_MATRIX.md`

## Agent instructions
- `LLM_IMPLEMENTATION_PROMPT.md`

---

# 24. Final design direction

Alora should no longer feel like a collection of soft beige utility cards.

It should feel like a **coherent, premium caregiving environment** built around calm hierarchy:

- warm editorial typography;
- tactile ivory surfaces;
- clear event color language;
- strong negative space;
- one dominant moment per screen;
- thoughtful private/support surfaces;
- sophisticated Night mode;
- gentle, purposeful illustration;
- fast one-handed interaction;
- privacy communicated through the interface itself.

The target is not "beautiful for a baby app."

The target is **a beautiful mobile product that happens to be built for the most exhausting first months of parenthood.**
