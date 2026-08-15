-- Allow only the creator of an empty family to claim its first owner seat.
-- The predicate must bypass RLS while checking family membership; otherwise a
-- creator who is not yet a member cannot see the family/member rows needed to
-- complete onboarding.

create or replace function can_claim_owner_seat(fid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from families f
    where f.id = fid
      and f.created_by = auth.uid()
      and not exists (
        select 1
        from family_members m
        where m.family_id = f.id
      )
  );
$$;

drop policy if exists members_owner_first on family_members;

create policy members_owner_first on family_members
  for insert with check (
    role = 'owner'
    and can_claim_owner_seat(family_id)
  );
