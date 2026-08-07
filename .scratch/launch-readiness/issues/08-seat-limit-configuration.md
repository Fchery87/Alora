# 08 — Seat limit configuration

Type: grilling
Status: resolved
Blocked by: —

## Question

How does the configurable caregiver seat limit work?

Founder pushback on the "limited caregiver seat" research idea (`research/01-competitor-feature-landscape.md` §3.9): **no hard-coded seat cap**. The current backend enforces a two-seat cap (owner + one partner) in three places — the `enforce_seat_cap()` trigger in `backend/schema.sql`, the redeem path in `backend/functions/redeem-invite/index.ts`, and the pgTAP suite (`backend/tests/01-rls-security.sql` G1). Instead, the seat limit should be **an option in Settings that the parents can agree on and set themselves** — including how many.

Decide: the default when no limit is set, who can change the limit (and whether both parents must agree), what happens at invite/redeem when the family is at its limit, whether any technical max exists, and whether scoped roles for limited seats (grandparent/nanny) stay a separate roadmap item or fold into this.

Resolved when the Answer records the seat-limit model precisely enough to rework the schema trigger, `redeem-invite`, the pgTAP suite, and the Settings UI — before the schema is applied at provisioning.

## Answer

Resolved by founder grilling (Aug 2026):

- **Default**: **unlimited** — no cap until parents set one in Settings.
- **Who changes it**: **any caregiver can set/change it**, audit-logged (a trust action, visible to the family).
- **At-limit behavior**: **enforce at redeem** — the invite flow rejects redemption when the family is at its configured limit, with a clear message.
- **Scoped roles**: **restored** — the founder prefers the original idea: limited caregiver seats with scoped roles (grandparent/nanny) fold into this feature; seat limit (headcount) and scoped permissions ship together.

Implementation deltas for provisioning (03) and the next build:
- `backend/schema.sql`: replace the hard-coded two-seat `enforce_seat_cap()` trigger with a family setting (`seat_limit` on `families`, nullable = unlimited) enforced on member insert.
- `backend/functions/redeem-invite/index.ts`: enforce the configured limit instead of the hard-coded two-seat check; clear rejection message.
- `backend/tests/01-rls-security.sql`: rework G1 (and any two-seat assertions) to test the configurable model — unset = unlimited, set = rejects at limit.
- Mobile: Settings seat-limit control (any caregiver, audit-logged) + scoped-role assignment for limited seats; invite copy reflects the limit.
- Glossary: `Seat limit` and `Scoped caregiver role` added to `CONTEXT.md`.
