# 07 — Caregiver invite + two-role RLS

Status: ready-for-agent
Type: AFK

## What to build

The two-caregiver coordination boundary. An Owner can invite one Partner caregiver via a **single-use, time-limited, revocable** invitation token (`invitation_tokens`). The invitee accepts (online-only) and joins the family as a Partner. Permissions are enforced at the database layer via Postgres RLS using the `family_members` role column (extensible enum; only Owner + Partner active in MVP — Limited caregiver is deferred).

Role matrix (MVP): Owner — create/edit logs, invite, manage billing, own check-ins only. Partner — create/edit logs (limited by policy), no invite, no billing, own check-ins only.

## Acceptance criteria

- [ ] Owner can generate an invite token that is single-use, time-limited, and revocable
- [ ] Invitee can accept and join the family as a Partner caregiver
- [ ] Family is capped at two seats (Owner + one Partner) in MVP
- [ ] RLS enforces the role matrix server-side (invite/billing restricted to Owner)
- [ ] Revoked/expired/used tokens cannot be redeemed
- [ ] Tests cover token lifecycle (issue/redeem/revoke/expire) and RLS role enforcement

## Blocked by

- 02-local-first-pipeline-family-baby-setup.md
