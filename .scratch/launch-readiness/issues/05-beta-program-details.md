# 05 — Beta program details

Type: grilling
Status: resolved
Blocked by: —

## Question

How does the 3–5-family private beta actually operate?

Decide, with the human: the feedback channel (email, typeform, in-app?), what beta families are told about privacy and the app's COPPA posture (coordinate with `.scratch/alora-mvp/` issue 14), what data is collected from beta families and how it's handled/deleted, support expectations (what counts as "needs a response"), and the **exit criteria** that turn the beta into a launch decision (what must be true: X weeks without a crash? N families logging daily? specific features verified?).

Resolved when the beta operating doc is written at `.scratch/launch-readiness/beta-operating-doc.md` and the exit criteria are stated.

## Answer

Resolved by founder grilling (Aug 2026). Deliverable: `.scratch/launch-readiness/beta-operating-doc.md`.

- Feedback: dedicated beta email + 3-question form in the install doc + monthly check-in from the founder.
- Privacy messaging: one-page beta info sheet (local-first, US-region sync, check-in isolation, single-use invites, no ads/selling, export/delete anytime, COPPA posture).
- Data: Sentry crash reports only, no PII in tags, no analytics; family data stays theirs.
- Support: crashes/data-loss → response < 1 day; everything else acknowledged < 1 week.
- Exit criteria (full set): ≥3 families logging daily for 2 weeks; 14 days without a logging-affecting crash (Sentry); live end-to-end verified on both platforms (invite → redeem → sync → check-in isolation → seat limit); feedback triaged into the roadmap; explicit launch/no-launch decision.
- Unblocks *Launch readiness scope* (07).
