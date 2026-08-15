-- Enforce tenant ownership, actor attribution, and role privacy in Postgres.

-- A family may have one owner at most. Invite redemption and account deletion
-- rely on this invariant when selecting or transferring ownership.
create unique index if not exists family_members_one_owner_idx
  on family_members (family_id)
  where role = 'owner';

-- Keep child rows in the same family as their parent rows.
alter table babies
  add constraint babies_family_id_id_key unique (family_id, id);

alter table baby_events
  add constraint baby_events_family_id_id_key unique (family_id, id);

alter table baby_events
  add constraint baby_events_baby_family_fk
  foreign key (family_id, baby_id)
  references babies (family_id, id);

alter table event_edits
  add constraint event_edits_event_family_fk
  foreign key (family_id, event_id)
  references baby_events (family_id, id);

alter table parent_check_ins
  add constraint parent_check_ins_id_user_id_key unique (id, user_id);

alter table parent_check_ins
  add column family_id uuid references families (id) on delete cascade;

-- Preserve family context for rows created before this column existed. The
-- product currently supports one active family per account; choose the
-- earliest membership deterministically so old private rows remain readable
-- instead of becoming invisible after the policy change.
update parent_check_ins c
set family_id = memberships.family_id
from (
  select distinct on (user_id) user_id, family_id
  from family_members
  order by user_id, joined_at asc, family_id asc
) memberships
where c.user_id = memberships.user_id
  and c.family_id is null;

alter table parent_check_ins
  add constraint parent_check_ins_id_user_family_key unique (id, user_id, family_id);

alter table parent_reflections
  add column family_id uuid references families (id) on delete cascade;

update parent_reflections r
set family_id = c.family_id
from parent_check_ins c
where r.check_in_id = c.id
  and r.user_id = c.user_id
  and r.family_id is null;

alter table parent_reflections
  add constraint parent_reflections_check_in_owner_fk
  foreign key (check_in_id, user_id, family_id)
  references parent_check_ins (id, user_id, family_id);

-- Private check-ins are scoped to the family that supplied the author's
-- caregiver context. A limited seat cannot write or read check-ins for that
-- family, while a partner or owner can only access their own rows.
create or replace function can_write_private_checkin(fid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from family_members
    where family_id = fid
      and user_id = auth.uid()
      and role != 'limited'
  );
$$;

drop policy if exists checkins_self on parent_check_ins;
create policy checkins_self on parent_check_ins
  for all
  using (user_id = auth.uid() and can_write_private_checkin(family_id))
  with check (user_id = auth.uid() and can_write_private_checkin(family_id));

drop policy if exists reflections_self on parent_reflections;
create policy reflections_self on parent_reflections
  for all
  using (user_id = auth.uid() and can_write_private_checkin(family_id))
  with check (user_id = auth.uid() and can_write_private_checkin(family_id));

-- Membership allows family reads, but care-event writes must attribute the
-- acting user. The trigger below also protects updates that try to rewrite
-- an existing creator.
drop policy if exists events_member_all on baby_events;
create policy events_member_read on baby_events
  for select using (is_family_member(family_id));
create policy events_member_insert on baby_events
  for insert with check (is_family_member(family_id) and created_by = auth.uid());
create policy events_member_update on baby_events
  for update using (is_family_member(family_id))
  with check (is_family_member(family_id));
create policy events_member_delete on baby_events
  for delete using (is_family_member(family_id));

drop policy if exists edits_member_all on event_edits;
create policy edits_member_read on event_edits
  for select using (is_family_member(family_id));
create policy edits_member_insert on event_edits
  for insert with check (is_family_member(family_id) and edited_by = auth.uid());
create policy edits_member_update on event_edits
  for update using (is_family_member(family_id))
  with check (is_family_member(family_id));
create policy edits_member_delete on event_edits
  for delete using (is_family_member(family_id));

create or replace function enforce_event_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role and fixture writes have no authenticated JWT and bypass this
  -- actor check; authenticated client writes must be attributable to auth.uid.
  if auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'baby_events' then
    if tg_op = 'INSERT' and new.created_by is distinct from auth.uid() then
      raise exception 'created_by must match the authenticated actor' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
      raise exception 'created_by cannot be changed' using errcode = '42501';
    end if;
  elsif tg_table_name = 'event_edits' then
    if tg_op = 'INSERT' and new.edited_by is distinct from auth.uid() then
      raise exception 'edited_by must match the authenticated actor' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.edited_by is distinct from old.edited_by then
      raise exception 'edited_by cannot be changed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_actor on baby_events;
create trigger trg_event_actor
before insert or update on baby_events
for each row execute function enforce_event_actor();

drop trigger if exists trg_event_edit_actor on event_edits;
create trigger trg_event_edit_actor
before insert or update on event_edits
for each row execute function enforce_event_actor();

-- Serialize seat-cap checks across concurrent redemptions.
create or replace function enforce_seat_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
begin
  select seat_limit into cap
  from families
  where id = new.family_id
  for update;

  if cap is not null
     and (select count(*) from family_members where family_id = new.family_id) >= cap then
    raise exception 'Family is at its caregiver limit (%)', cap;
  end if;
  return new;
end;
$$;
