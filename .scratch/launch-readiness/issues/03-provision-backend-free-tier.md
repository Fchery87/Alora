# 03 — Provision backend free tier

Type: task
Status: open
Blocked by: 02

## Question

Get the free-tier stack live so the beta isn't demo-mode-only.

Following `backend/PROVISIONING.md` (and the stack decision from *Free-tier infra and distribution research*): create the Supabase project (apply `backend/schema.sql` + `backend/rls.sql`, deploy the three edge functions, set auth config), stand up the PowerSync instance or self-hosted fallback (sync rules from `backend/sync-rules.yaml`), and create the Sentry project + DSN. The human does the signups and console work; the agent drives env files (`.env` from `.env.example`), config, and verification.

Resolved when a live-mode install on a dev build signs in, syncs events between two devices, and reports to Sentry. Record resulting facts (project URLs, DSN location, region, any limits hit) in the Answer.
