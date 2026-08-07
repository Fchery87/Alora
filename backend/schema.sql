-- Alora — Postgres schema (Supabase)
-- Implements backlog issues 01–02. Apply with: supabase db push, or paste
-- into the Supabase SQL editor. RLS policies live in rls.sql (apply after this).
--
-- Locked decisions encoded here:
--  * Three caregiver roles (owner, partner, limited); the enum is
--    extensible. 'limited' = grandparent/nanny seat (care events + timeline
--    only — no trust actions, no private check-ins).
--  * Seat limits are a FAMILY SETTING, not a hard-coded cap: families.
--    seat_limit is nullable; NULL = unlimited. Any non-limited caregiver can
--    change it; changes are audit-logged (trigger below).
--  * baby_events carries NO sync-status column — sync state is a CLIENT concern
--    managed by PowerSync's local queue. Server is authoritative state only.
--  * Soft delete via deleted_at on baby_events (propagates as a sync tombstone).
--  * Invitation tokens are single-use (used_at), time-limited (expires_at),
--    revocable (revoked_at).
--  * Parent check-ins / reflections belong to the individual (user_id), never
--    the family — see sync-rules.yaml per-user bucket + rls.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type family_role as enum ('owner', 'partner', 'limited');
create type event_type as enum ('feed', 'diaper', 'sleep', 'growth');
create type mood_level as enum ('low', 'tired', 'okay', 'good', 'great');

-- ---------------------------------------------------------------------------
-- Users (profile mirror of auth.users)
-- ---------------------------------------------------------------------------
create table users (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Caregiver',
  avatar_color text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Families and membership
-- ---------------------------------------------------------------------------
create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Our family',
  created_by  uuid references users (id) on delete set null,
  -- Caregiver seat limit — NULL = unlimited. A family setting, not a
  -- hard-coded cap: any non-limited caregiver may change it (RLS), and the
  -- trigger below audit-logs every change. Enforced on member insert.
  seat_limit  int,
  created_at  timestamptz not null default now()
);

create table family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  user_id     uuid not null references users (id) on delete cascade,
  role        family_role not null default 'partner',
  -- Denormalized so caregiver attribution ("logged by Sam") syncs in the
  -- family bucket without a cross-user join (PowerSync sync rules can't
  -- subquery other users' profiles). Set on join; cleared to 'former
  -- caregiver' when that user deletes their account.
  display_name text not null default 'Caregiver',
  joined_at   timestamptz not null default now(),
  unique (family_id, user_id)
);
create index on family_members (user_id);
create index on family_members (family_id);

-- Enforce the family's CONFIGURED seat limit (families.seat_limit).
-- NULL seat_limit = unlimited: the trigger is a no-op for that family.
create or replace function enforce_seat_cap() returns trigger
language plpgsql as $$
declare
  cap int;
begin
  select seat_limit into cap from families where id = new.family_id;
  if cap is not null
     and (select count(*) from family_members where family_id = new.family_id) >= cap then
    raise exception 'Family is at its caregiver limit (%)', cap;
  end if;
  return new;
end;
$$;
create trigger trg_seat_cap before insert on family_members
  for each row execute function enforce_seat_cap();

-- Audit every seat-limit change (trust action). Runs as definer so the audit
-- insert isn't subject to audit_logs' read-only RLS for the caller.
create or replace function audit_seat_limit_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.seat_limit is distinct from old.seat_limit then
    insert into audit_logs (family_id, actor_id, action, detail)
    values (old.id, auth.uid(), 'seat_limit.changed',
            jsonb_build_object('from', old.seat_limit, 'to', new.seat_limit));
  end if;
  return new;
end;
$$;
create trigger trg_seat_limit_audit before update on families
  for each row execute function audit_seat_limit_change();

-- ---------------------------------------------------------------------------
-- Babies
-- ---------------------------------------------------------------------------
create table babies (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  name        text not null,
  birth_date  date,
  created_at  timestamptz not null default now()
);
create index on babies (family_id);

-- ---------------------------------------------------------------------------
-- Baby events (single typed-payload table for feed / diaper / sleep)
-- ---------------------------------------------------------------------------
create table baby_events (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  baby_id     uuid not null references babies (id) on delete cascade,
  created_by  uuid references users (id) on delete set null,  -- null = "former caregiver" after scrub
  event_type  event_type not null,
  sub_type    text,                                 -- bottle/breast/pumping/wet/dirty/nap/night...
  start_at    timestamptz,
  end_at      timestamptz,
  quantity    numeric,                              -- ml or minutes, by sub_type
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz                           -- soft delete / sync tombstone
);
create index on baby_events (family_id, start_at desc);
create index on baby_events (baby_id, event_type, start_at desc);

-- Edit history so timeline edits never silently erase context.
create table event_edits (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references baby_events (id) on delete cascade,
  family_id   uuid not null references families (id) on delete cascade,
  edited_by   uuid references users (id) on delete set null,
  prior_values jsonb not null,
  edited_at   timestamptz not null default now()
);
create index on event_edits (event_id);

-- ---------------------------------------------------------------------------
-- Reminders + per-user notification preferences (local notifications, MVP)
-- ---------------------------------------------------------------------------
create table reminders (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  kind        text not null,                        -- feed / diaper / bedtime
  config      jsonb not null default '{}',
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on reminders (family_id);

create table notification_preferences (
  user_id        uuid primary key references users (id) on delete cascade,
  quiet_start    time not null default '22:00',
  quiet_end      time not null default '06:00',
  prefs          jsonb not null default '{}',
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Parent check-ins + reflections — PRIVATE to the individual user
-- ---------------------------------------------------------------------------
create table parent_check_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  mood        mood_level not null,
  created_at  timestamptz not null default now()
);
create index on parent_check_ins (user_id, created_at desc);

create table parent_reflections (
  id          uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references parent_check_ins (id) on delete cascade,
  user_id     uuid not null references users (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index on parent_reflections (user_id);

-- ---------------------------------------------------------------------------
-- Support resources (global read-only reference data)
-- ---------------------------------------------------------------------------
create table support_resources (
  id          uuid primary key default gen_random_uuid(),
  region      text not null default 'US',
  title       text not null,
  subtitle    text,
  phone       text,
  url         text,
  sort        int not null default 0
);

-- ---------------------------------------------------------------------------
-- Invitation tokens (single-use, time-limited, revocable)
-- ---------------------------------------------------------------------------
create table invitation_tokens (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  created_by  uuid not null references users (id) on delete cascade,
  code        text not null unique,
  role        family_role not null default 'partner',
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  used_at     timestamptz,
  used_by     uuid references users (id) on delete set null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index on invitation_tokens (family_id);

-- A token is redeemable only if not used, not revoked, and not expired.
create or replace function token_is_active(t invitation_tokens) returns boolean
language sql immutable as $$
  select t.used_at is null and t.revoked_at is null and t.expires_at > now();
$$;

-- ---------------------------------------------------------------------------
-- Audit log (family membership + sensitive settings changes)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid references families (id) on delete cascade,
  actor_id    uuid references users (id) on delete set null,
  action      text not null,                        -- member.invited / member.joined / account.deleted ...
  detail      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index on audit_logs (family_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Subscription status (table present; no active billing at MVP launch)
-- ---------------------------------------------------------------------------
create table subscription_status (
  family_id   uuid primary key references families (id) on delete cascade,
  tier        text not null default 'free',
  updated_at  timestamptz not null default now()
);

-- keep updated_at fresh on baby_events
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_touch_baby_events before update on baby_events
  for each row execute function touch_updated_at();
