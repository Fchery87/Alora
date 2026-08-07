-- Alora — Row-Level Security policies (Supabase)
-- Apply AFTER schema.sql. Access control is enforced here at the DB layer
-- (PRD requirement), not only in the client. PowerSync connects with the
-- end-user JWT, so these policies also bound what each device can sync.

-- ---------------------------------------------------------------------------
-- Helper predicates
-- ---------------------------------------------------------------------------
create or replace function is_family_member(fid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

create or replace function is_family_owner(fid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table users                   enable row level security;
alter table families                enable row level security;
alter table family_members          enable row level security;
alter table babies                  enable row level security;
alter table baby_events             enable row level security;
alter table event_edits             enable row level security;
alter table reminders               enable row level security;
alter table notification_preferences enable row level security;
alter table parent_check_ins        enable row level security;
alter table parent_reflections      enable row level security;
alter table support_resources       enable row level security;
alter table invitation_tokens       enable row level security;
alter table audit_logs              enable row level security;
alter table subscription_status     enable row level security;

-- ---------------------------------------------------------------------------
-- Users: a user reads/updates their own profile; can read profiles of
-- co-members (to show "logged by Sam"), handled via a permissive select.
-- ---------------------------------------------------------------------------
create policy users_self_rw on users
  using (id = auth.uid()) with check (id = auth.uid());
create policy users_comember_read on users
  for select using (
    exists (
      select 1 from family_members m1
      join family_members m2 on m1.family_id = m2.family_id
      where m1.user_id = auth.uid() and m2.user_id = users.id
    )
  );

-- ---------------------------------------------------------------------------
-- Families
-- ---------------------------------------------------------------------------
create policy families_member_read on families
  for select using (is_family_member(id));
create policy families_owner_write on families
  for update using (is_family_owner(id)) with check (is_family_owner(id));
create policy families_insert_self on families
  for insert with check (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Family members
-- ---------------------------------------------------------------------------
create policy members_read on family_members
  for select using (is_family_member(family_id));
create policy members_owner_manage on family_members
  for all using (is_family_owner(family_id)) with check (is_family_owner(family_id));
-- Onboarding path: a user may insert themselves as the FIRST member (owner)
-- of a family they just created. Every other seat comes exclusively through
-- redeem-invite (service role). An arbitrary user still cannot self-join an
-- existing family: the check requires the family to be created_by the caller
-- AND to have zero members, and unique (family_id, user_id) means the creator
-- can never end up with two owner rows — one family, one owner.
create policy members_owner_first on family_members
  for insert with check (
    role = 'owner'
    and exists (
      select 1 from families f
      where f.id = family_id
        and f.created_by = auth.uid()
        and not exists (select 1 from family_members m where m.family_id = f.id)
    )
  );
-- Membership insertion for every other seat is performed exclusively by the
-- redeem-invite Edge Function (service role, which bypasses RLS). Direct
-- client inserts are blocked to prevent self-joining any family without a
-- valid invite.

-- ---------------------------------------------------------------------------
-- Babies + events + edits: any family member, scoped to their family
-- ---------------------------------------------------------------------------
create policy babies_member_all on babies
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));

create policy events_member_all on baby_events
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));

create policy edits_member_all on event_edits
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));

create policy reminders_member_all on reminders
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));

-- ---------------------------------------------------------------------------
-- Private to the individual user (NEVER visible to co-members)
-- ---------------------------------------------------------------------------
create policy prefs_self on notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy checkins_self on parent_check_ins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reflections_self on parent_reflections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Support resources: global read-only
-- ---------------------------------------------------------------------------
create policy support_read_all on support_resources
  for select using (true);

-- ---------------------------------------------------------------------------
-- Invitation tokens: owner manages; invitee may read an active token by code
-- (redemption itself runs in a SECURITY DEFINER Edge Function).
-- ---------------------------------------------------------------------------
create policy invites_owner_manage on invitation_tokens
  for all using (is_family_owner(family_id)) with check (is_family_owner(family_id));

-- ---------------------------------------------------------------------------
-- Audit logs: family members read; writes happen server-side only.
-- ---------------------------------------------------------------------------
create policy audit_member_read on audit_logs
  for select using (is_family_member(family_id));

-- ---------------------------------------------------------------------------
-- Subscription status: family members read.
-- ---------------------------------------------------------------------------
create policy sub_member_read on subscription_status
  for select using (is_family_member(family_id));
