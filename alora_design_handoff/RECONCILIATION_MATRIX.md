# Alora Design Handoff — Reconciliation Matrix

**Version:** 1.2.0

| Finding | Severity | v1.2 resolution |
|---|---|---|
| Settings `Alora · Quiet Dawn` | Prior | Pinned public footer: `Alora · The calm in the chaos.` |
| Support resources copy/data | Prior | Repository-driven; screenshot copy non-authoritative |
| Onboarding sequence wrong | High | Pinned Welcome → Privacy → Baby Setup (name/age) → Invite |
| Trust content/forced Night wrong | High | Current theme preserved; access matrix, audit, resources, privacy-policy, export/delete preserved; pinned trust footer |
| Mood `Rough` vs `Low` | High | Pinned `Low, Tired, Okay, Good, Great` |
| Delete static consequences | High | Three role-dependent branches + branch-specific success outcomes |
| Reminders incomplete | High | Quiet Hours + Feed/Diaper/Bedtime + on-device notice + runtime warning |
| Invite role picker missing | High | Partner/Limited role picker + permission scope + seat-limit behavior |
| Home Care Briefing missing | High | Care Briefing + local shift marker + Start/Mark shift action required |
| Seat-limit screen missing | Medium | Dedicated `No limit / 2–6` screen specified |
| Auth omitted | Medium | Sign In / Sign Up included (no recovery screen exists in the app; do not invent one) |
| Settings role gating | Medium | Limited sensitive-row hiding explicitly required |
| Growth behavior incomplete | Medium | WHO P3/P50/P97 + Boy/Girl + birth date + 0–24m |
| Pediatrician report wrong | Medium | Direct generate/share PDF; no invented preview |
| Timeline pagination/fictional filters | Medium | `Load earlier events` required; filters/date groups explicitly non-required |
| Merge stale state/badges | Minor | Duplicate not found + Original/Edited/Duplicate semantics |
| Timeline inline Keep both | Minor | Required alongside Merge Review |
| Check-In saved confirmation | Minor | Pinned `Saved privately on this device.` |
| Sync status edited state | Minor | `Edited 1m ago` example added |
| Log Repeat Last | Minor | First-class `RepeatLastRow` component + dynamic hint |
| Home next-feed row | Minor | Required next-action/likely-feed row |

## Package rule

`IMPLEMENTED_BEHAVIOR_CONTRACT.md` and `screen-contracts.json` are now required inputs for any coding agent performing the redesign. Reference images are visual-only and cannot override implemented behavior.
