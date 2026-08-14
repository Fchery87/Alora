-- Alora canonical baseline migration.
-- This file replaces the old backend/schema.sql + backend/rls.sql pair.
-- Later migrations must be additive and independently reviewable.

create extension if not exists "pgcrypto";

create type family_role as enum ('owner', 'partner', 'limited');
create type event_type as enum ('feed', 'diaper', 'sleep', 'growth');
create type mood_level as enum ('low', 'tired', 'okay', 'good', 'great');

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Caregiver',
  avatar_color text,
  created_at timestamptz not null default now()
);

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our family',
  created_by uuid references users (id) on delete set null,
  seat_limit int,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families (id) on delete cascade,
  actor_id uuid references users (id) on delete set null,
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_family_created_idx on audit_logs (family_id, created_at desc);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role family_role not null default 'partner',
  display_name text not null default 'Caregiver',
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);
create index family_members_user_idx on family_members (user_id);
create index family_members_family_idx on family_members (family_id);

create table babies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  name text not null,
  birth_date date,
  created_at timestamptz not null default now()
);
create index babies_family_idx on babies (family_id);

create table baby_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  baby_id uuid not null references babies (id) on delete cascade,
  created_by uuid references users (id) on delete set null,
  event_type event_type not null,
  sub_type text,
  start_at timestamptz,
  end_at timestamptz,
  quantity numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index baby_events_family_start_idx on baby_events (family_id, start_at desc);
create index baby_events_baby_type_start_idx on baby_events (baby_id, event_type, start_at desc);

create table event_edits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references baby_events (id) on delete cascade,
  family_id uuid not null references families (id) on delete cascade,
  edited_by uuid references users (id) on delete set null,
  prior_values jsonb not null,
  edited_at timestamptz not null default now()
);
create index event_edits_event_idx on event_edits (event_id);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  kind text not null,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index reminders_family_idx on reminders (family_id);

create table notification_preferences (
  user_id uuid primary key references users (id) on delete cascade,
  quiet_start time not null default '22:00',
  quiet_end time not null default '06:00',
  prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table parent_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  mood mood_level not null,
  created_at timestamptz not null default now()
);
create index parent_check_ins_user_created_idx on parent_check_ins (user_id, created_at desc);

create table parent_reflections (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references parent_check_ins (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index parent_reflections_user_idx on parent_reflections (user_id);

create table support_resources (
  id uuid primary key default gen_random_uuid(),
  region text not null default 'US',
  title text not null,
  subtitle text,
  phone text,
  url text,
  sort int not null default 0
);

create table invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  created_by uuid not null references users (id) on delete cascade,
  code text not null unique,
  role family_role not null default 'partner',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  used_by uuid references users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitation_tokens_family_idx on invitation_tokens (family_id);

create table subscription_status (
  family_id uuid primary key references families (id) on delete cascade,
  tier text not null default 'free',
  updated_at timestamptz not null default now()
);

create or replace function token_is_active(t invitation_tokens)
returns boolean
language sql stable
as $$
  select t.used_at is null and t.revoked_at is null and t.expires_at > now();
$$;

create or replace function enforce_seat_cap()
returns trigger
language plpgsql
as $$
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
create trigger trg_seat_cap
before insert on family_members
for each row execute function enforce_seat_cap();

create or replace function audit_seat_limit_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.seat_limit is distinct from old.seat_limit then
    insert into audit_logs (family_id, actor_id, action, detail)
    values (
      old.id,
      auth.uid(),
      'seat_limit.changed',
      jsonb_build_object('from', old.seat_limit, 'to', new.seat_limit)
    );
  end if;
  return new;
end;
$$;
create trigger trg_seat_limit_audit
before update on families
for each row execute function audit_seat_limit_change();

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_touch_baby_events
before update on baby_events
for each row execute function touch_updated_at();

create or replace function is_family_member(fid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

create or replace function is_family_owner(fid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function is_family_limited(fid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid() and role = 'limited'
  );
$$;

alter table users enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table babies enable row level security;
alter table baby_events enable row level security;
alter table event_edits enable row level security;
alter table reminders enable row level security;
alter table notification_preferences enable row level security;
alter table parent_check_ins enable row level security;
alter table parent_reflections enable row level security;
alter table support_resources enable row level security;
alter table invitation_tokens enable row level security;
alter table audit_logs enable row level security;
alter table subscription_status enable row level security;

create policy users_self_rw on users
  using (id = auth.uid()) with check (id = auth.uid());
create policy users_comember_read on users
  for select using (
    exists (
      select 1
      from family_members m1
      join family_members m2 on m1.family_id = m2.family_id
      where m1.user_id = auth.uid() and m2.user_id = users.id
    )
  );

create policy families_member_read on families
  for select using (is_family_member(id));
create policy families_owner_write on families
  for update using (is_family_owner(id)) with check (is_family_owner(id));
create policy families_insert_self on families
  for insert with check (created_by = auth.uid());
create policy families_member_seat_limit on families
  for update using (is_family_member(id) and not is_family_limited(id))
  with check (is_family_member(id) and not is_family_limited(id));
revoke update on families from anon, authenticated;
grant update (seat_limit) on families to authenticated;

create policy members_read on family_members
  for select using (is_family_member(family_id));
create policy members_owner_manage on family_members
  for all using (is_family_owner(family_id)) with check (is_family_owner(family_id));
create policy members_owner_first on family_members
  for insert with check (
    role = 'owner'
    and exists (
      select 1
      from families f
      where f.id = family_id
        and f.created_by = auth.uid()
        and not exists (select 1 from family_members m where m.family_id = f.id)
    )
  );

create policy babies_member_all on babies
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));
create policy events_member_all on baby_events
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));
create policy edits_member_all on event_edits
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));
create policy reminders_member_all on reminders
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));

create policy prefs_self on notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy checkins_self on parent_check_ins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reflections_self on parent_reflections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy support_read_all on support_resources
  for select using (true);
create policy invites_owner_manage on invitation_tokens
  for all using (is_family_owner(family_id)) with check (is_family_owner(family_id));
create policy audit_member_read on audit_logs
  for select using (is_family_member(family_id) and not is_family_limited(family_id));
create policy sub_member_read on subscription_status
  for select using (is_family_member(family_id));
