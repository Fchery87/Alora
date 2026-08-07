-- Alora — local auth mock for pgTAP tests
-- ---------------------------------------------------------------------------
-- Supabase projects ship an `auth` schema with auth.users and auth.uid().
-- A plain local Postgres does not. Apply this file BEFORE schema.sql so the
-- schema's `references auth.users` constraint and rls.sql's `auth.uid()`
-- calls resolve. Mimics the real Supabase surface closely enough for RLS
-- testing:
--   * auth.users  — profile table that auth.users references
--   * auth.uid()  — reads request.jwt.claims (set by PostgREST from the JWT)
--   * the `authenticated` role — the role PostgREST uses for logged-in users

create schema if not exists auth;

create table if not exists auth.users (
  id          uuid primary key,
  email       text,
  created_at  timestamptz not null default now()
);

-- Mirrors the real implementation: the JWT claims setting is set by PostgREST;
-- tests set it via set_config('request.jwt.claims', ...) to impersonate a user.
create or replace function auth.uid() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

-- The role Supabase uses for signed-in requests (RLS policies are evaluated
-- for this role; the anon role is not needed by these tests).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

-- Tests run as the postgres superuser; they switch to `authenticated` with
-- `set local role authenticated` to exercise RLS as a real client would.
-- NOTE: table grants for the `authenticated` role are applied by
-- tests/run-pgtap.sh AFTER schema.sql + rls.sql (they mirror Supabase:
-- broad table grants, with RLS as the fine-grained gate).
