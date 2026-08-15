-- The first owner seat belongs to the authenticated creator, not an
-- arbitrary user id supplied by that creator's client.

drop policy if exists members_owner_first on family_members;

create policy members_owner_first on family_members
  for insert with check (
    role = 'owner'
    and user_id = auth.uid()
    and can_claim_owner_seat(family_id)
  );
