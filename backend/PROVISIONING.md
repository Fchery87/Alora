# Alora — Provisioning Runbook

Exact, ordered steps to take Alora from demo-mode (mock data) to live local-first
data. Do these once. Everything the app needs is already written — this just stands
up the cloud services and flips the switches.

**Prereqs:** a [Supabase](https://supabase.com) account, a [PowerSync](https://powersync.com)
account, the Supabase CLI (`npm i -g supabase`), Node 20+, and the Expo app in `../mobile`.

Estimated time: ~45–60 min.

---

## 1. Create the Supabase project (~5 min)

1. Supabase dashboard → **New project**. Region: **US** (matches the US-only launch).
   Save the database password.
2. **Project Settings → API** → copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → keep secret (Edge Functions only; never in the app).

## 2. Apply the schema + policies (~5 min)

In **SQL Editor**, run in this order (paste the file contents):

1. `schema.sql`  — tables, enums, indexes, triggers.
2. `rls.sql`     — Row-Level Security policies.

Then seed the support resources (Check-In screen):

```sql
insert into support_resources (region, title, subtitle, phone, sort) values
  ('US', '988 Suicide & Crisis Lifeline', 'Call or text, 24/7', '988', 1),
  ('US', 'Postpartum Support International', 'Helpline · call or text', '1-800-944-4773', 2);
```

> The final copy/resource list must be approved per backlog issue 13 before launch.

## 3. Configure Auth (~3 min)

**Authentication → Providers → Email**: enable. For a smoother MVP, turn **off**
"Confirm email" (or wire a redirect later). Add a row to `public.users` automatically
on signup with a trigger (optional but recommended):

```sql
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Caregiver'))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
```

## 4. Deploy the Edge Functions (~5 min)

```bash
cd backend
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role key from step 1>
supabase functions deploy redeem-invite
supabase functions deploy delete-account
```

(`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected by the platform automatically.)

## 5. Create the PowerSync instance (~10 min)

1. PowerSync dashboard → **Create instance**.
2. **Connect to your Supabase Postgres**: PowerSync needs a logical-replication
   connection. In Supabase, create a dedicated role and publication:
   ```sql
   create role powersync_role with replication login password '<strong-password>';
   grant select on all tables in schema public to powersync_role;
   create publication powersync for all tables;
   ```
   In PowerSync, enter the Supabase connection string with `powersync_role`.
3. **Sync Rules**: paste the contents of `sync-rules.yaml` and deploy.
4. Copy the **instance URL** → `EXPO_PUBLIC_POWERSYNC_URL`.
5. **Auth**: configure PowerSync to accept Supabase JWTs (Settings → Auth → Supabase;
   PowerSync validates the token the app sends from `fetchCredentials`).

## 6. Point the app at the backend (~5 min)

```bash
cd mobile
cp .env.example .env
# fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY / EXPO_PUBLIC_POWERSYNC_URL
```

Restart Metro with cleared cache so env is re-read:

```bash
npx expo start -c
```

At this point **auth turns on automatically** — the app routes to `/sign-in` instead
of demo-mode tabs. Create an account and confirm you reach the tabs.

## 7. Enable local-first sync (~10 min)

```bash
cd mobile
npx expo install @powersync/react-native @powersync/op-sqlite
```

Then:

1. Remove `powersync/**` and `data/supabaseRepository.ts` from the `exclude` list in
   `tsconfig.json`.
2. In `data/useData.ts`, swap the active repository:
   ```ts
   import { supabaseRepository } from "./supabaseRepository";
   export const repository = supabaseRepository;
   ```
3. Start sync after sign-in — add to `app/(tabs)/_layout.tsx`:
   ```ts
   import { useEffect } from "react";
   import { startSync } from "../../powersync/system";
   // inside the component:
   useEffect(() => { startSync(); }, []);
   ```
4. A development build is required (op-sqlite is native):
   ```bash
   npx expo run:ios   # or run:android
   ```

## 8. Verify — the tracer test (backlog issue 03)

This proves the whole local-first pipeline end-to-end:

1. Sign in on **two** devices/simulators as two caregivers of the same family
   (invite the second via the in-app code → it calls `redeem-invite`).
2. On device A, **turn on airplane mode**, log a feed. It appears instantly with a
   pending state and **survives an app kill** (durable local SQLite).
3. Turn airplane mode off → the event uploads; **device B sees it** after sync.
4. Edit the same event on both devices → last-write-wins + `event_edits` retains prior
   values. Create overlapping events → both persist (duplicate affordance).
5. Delete the owner account → ownership transfers to the partner, owner PII is gone,
   shared events show **"former caregiver"**.

If all five hold, the architecture is proven. ✅

---

## Rollback / teardown

- App: clear `.env` (or unset the vars) → back to demo mode instantly.
- Data: PowerSync instance + Supabase project can be paused/deleted from their
  dashboards. No local migration is destroyed (SQLite is per-device).

## Secrets hygiene

- `.env` is gitignored. The **service_role** key lives ONLY in Supabase function
  secrets, never in the app or repo. The app uses the **anon** key + user JWT; RLS
  does the rest.
