# 08 — Seat limit configuration

Type: grilling
Status: claimed
Blocked by: —

## Question

How does the configurable caregiver seat limit work?

Founder pushback on the "limited caregiver seat" research idea (`research/01-competitor-feature-landscape.md` §3.9): **no hard-coded seat cap**. The current backend enforces a two-seat cap (owner + one partner) in three places — the `enforce_seat_cap()` trigger in `backend/schema.sql`, the redeem path in `backend/functions/redeem-invite/index.ts`, and the pgTAP suite (`backend/tests/01-rls-security.sql` G1). Instead, the seat limit should be **an option in Settings that the parents can agree on and set themselves** — including how many.

Decide: the default when no limit is set, who can change the limit (and whether both parents must agree), what happens at invite/redeem when the family is at its limit, whether any technical max exists, and whether scoped roles for limited seats (grandparent/nanny) stay a separate roadmap item or fold into this.

Resolved when the Answer records the seat-limit model precisely enough to rework the schema trigger, `redeem-invite`, the pgTAP suite, and the Settings UI — before the schema is applied at provisioning.
