-- Membership is a server-side trust operation.  The bootstrap policy is the
-- only authenticated client write allowed on family_members: a creator may
-- claim their own empty family's first owner seat.  Invites, removals, and
-- role changes must use the transactional server operation introduced by the
-- corresponding application flow.
--
-- `members_owner_manage` was `for all`, so its INSERT check let an existing
-- owner add any user (including another owner), bypassing the bootstrap rule
-- and invite lifecycle.

drop policy if exists members_owner_manage on family_members;
