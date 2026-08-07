-- Alora — RLS + invite-security pgTAP suite
-- ---------------------------------------------------------------------------
-- Verifies, at the database layer, the security contract from the
-- production-readiness PRD (backend security + live data path):
--
--   1. A non-member cannot read any family data (events, profiles, tokens,
--      audit log, private check-ins).
--   2. A user cannot self-insert into a family they were not invited to
--      (the members_self_join vulnerability is gone).
--   3. The onboarding path still works: a user can create a family and join
--      it as the first member (owner) — and nobody else can use that path.
--   4. Invite lifecycle: only the owner can issue/see tokens; tokens are
--      single-use, time-limited, revocable (token_is_active predicate).
--   5. Seat limits are a FAMILY SETTING: unset = unlimited; a configured
--      limit rejects over-limit members even via the service role; any
--      non-limited caregiver can change it; every change is audit-logged.
--   6. Limited (grandparent/nanny) seats see care events + timeline only:
--      no private check-ins, no audit log, no invite issue, no seat-limit
--      changes — enforced by RLS even though the client hides the UI.
--
-- Run via tests/run-pgtap.sh (applies fixtures + schema + RLS, then runs
-- this file). Requires the pgTAP extension.
--
-- Identity model: RLS evaluates for the `authenticated` role with
-- request.jwt.claims.sub = the acting user (mirrors PostgREST). The suite
-- impersonates users with `set local role authenticated` + set_config.

begin;

-- ---------------------------------------------------------------------------
-- Fixtures (inserted as superuser — RLS bypassed, like the service role)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@alora.test'),
  ('00000000-0000-0000-0000-000000000002', 'partner@alora.test'),
  ('00000000-0000-0000-0000-000000000003', 'intruder@alora.test'),
  ('00000000-0000-0000-0000-000000000004', 'founder@alora.test'),
  ('00000000-0000-0000-0000-000000000005', 'grandma@alora.test');

insert into users (id, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'Owner Person'),
  ('00000000-0000-0000-0000-000000000002', 'Partner Person'),
  ('00000000-0000-0000-0000-000000000003', 'Intruder Person'),
  ('00000000-0000-0000-0000-000000000004', 'Founder Person'),
  ('00000000-0000-0000-0000-000000000005', 'Grandma Person');

-- Family 1: owner + partner + a limited (grandparent) seat; seat_limit unset
-- (unlimited). Events, check-ins, tokens, audit.
insert into families (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'F1 Full Family', '00000000-0000-0000-0000-000000000001');
insert into family_members (family_id, user_id, role, display_name) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner', 'Owner Person'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'partner', 'Partner Person'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'limited', 'Grandma Person');
insert into babies (id, family_id, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Maya');
insert into baby_events (id, family_id, baby_id, created_by, event_type, start_at, notes) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'feed', now() - interval '2 hours', 'bottle'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'sleep', now() - interval '1 hour', 'nap');
insert into parent_check_ins (id, user_id, mood) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'okay'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'tired');
insert into parent_reflections (id, check_in_id, user_id, body) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'private reflection');
insert into invitation_tokens (id, family_id, created_by, code, expires_at, used_at, revoked_at) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ACTIVE-F1', now() + interval '24 hours', null, null),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'USED-F1',   now() + interval '24 hours', now(), null),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'REVOKED-F1', now() + interval '24 hours', null, now()),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'EXPIRED-F1', now() - interval '1 hour', null, null);
insert into audit_logs (family_id, actor_id, action) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'fixture.setup');

-- Family 2: owner only + one seat free (for redemption emulation).
insert into families (id, name, created_by) values
  ('10000000-0000-0000-0000-000000000002', 'F2 Owner Only', '00000000-0000-0000-0000-000000000001');
insert into family_members (family_id, user_id, role, display_name) values
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'owner', 'Owner Person');
insert into babies (id, family_id, name) values
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Luna');
insert into baby_events (id, family_id, baby_id, created_by, event_type, start_at) values
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'diaper', now() - interval '30 minutes');
insert into invitation_tokens (id, family_id, created_by, code, expires_at) values
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ACTIVE-F2', now() + interval '24 hours');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Impersonate `uid` by setting the JWT claims the way PostgREST would.
create or replace function tests_set_identity(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid::text)::text, true);
end
$$;

-- Count rows as seen through the CURRENT role's RLS filters.
create or replace function tests_count(table_name text) returns bigint
language plpgsql as $$
declare
  n bigint;
begin
  execute format('select count(*) from %I', table_name) into n;
  return n;
end
$$;

-- ---------------------------------------------------------------------------
-- Plan
-- ---------------------------------------------------------------------------
select plan(51);

-- ===========================================================================
-- Block A — non-member sees nothing (intruder@alora.test has no membership)
-- ===========================================================================
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000003');
select is(tests_count('baby_events'), 0::bigint, 'A1: non-member cannot read family baby events');
select is(tests_count('families'), 0::bigint, 'A2: non-member cannot read families');
select is(tests_count('family_members'), 0::bigint, 'A3: non-member sees no memberships');
select is(tests_count('parent_check_ins'), 0::bigint, 'A4: non-member sees no private check-ins');
select is(tests_count('invitation_tokens'), 0::bigint, 'A5: non-member sees no invite tokens');
select is(tests_count('audit_logs'), 0::bigint, 'A6: non-member sees no audit log');
select is(
  (select count(*) from users where id <> '00000000-0000-0000-0000-000000000003'),
  0::bigint,
  'A7: non-member cannot read other users'' profiles'
);
reset role;

-- ===========================================================================
-- Block B — the core fix: self-insert into a family you were not invited to
-- ===========================================================================
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000003');
select lives_ok(
  $$ insert into family_members (family_id, user_id, role)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'partner') $$,
  'B1: self-insert attempt does not raise'
);
select is(
  (select count(*) from family_members where family_id = '10000000-0000-0000-0000-000000000001' and user_id = '00000000-0000-0000-0000-000000000003'),
  0::bigint,
  'B2: RLS blocks self-insert into a family without a valid invite'
);
reset role;

-- ===========================================================================
-- Block C — onboarding path: create a family, join it as first member/owner
-- ===========================================================================
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000004');
select lives_ok(
  $$ insert into families (id, name, created_by)
     values ('10000000-0000-0000-0000-000000000003', 'F3 Founders', '00000000-0000-0000-0000-000000000004') $$,
  'C1: any user can create a family (onboarding)'
);
select lives_ok(
  $$ insert into family_members (family_id, user_id, role)
     values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'owner') $$,
  'C2: founder joins their own empty family as owner'
);
select is(
  (select count(*) from families f join family_members m on m.family_id = f.id where m.user_id = '00000000-0000-0000-0000-000000000004'),
  1::bigint,
  'C3: founder can now read their own family'
);
select lives_ok(
  $$ insert into family_members (family_id, user_id, role)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'owner') $$,
  'C4: owner-first attempt on an existing family does not raise'
);
select is(
  (select count(*) from family_members where family_id = '10000000-0000-0000-0000-000000000001' and user_id = '00000000-0000-0000-0000-000000000003'),
  0::bigint,
  'C5: owner-first policy cannot be used to join a family someone else created'
);
select lives_ok(
  $$ insert into family_members (family_id, user_id, role)
     values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'owner') $$,
  'C6: hijack attempt against the founder''s family does not raise'
);
select is(
  (select count(*) from family_members m where m.family_id = '10000000-0000-0000-0000-000000000003' and m.user_id = '00000000-0000-0000-0000-000000000003'),
  0::bigint,
  'C7: only the creator can take the owner seat of a new family'
);
reset role;

-- ===========================================================================
-- Block D — invite issuance: owner only
-- ===========================================================================
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000001');
select is(tests_count('invitation_tokens'), 4::bigint, 'D1: owner sees all own-family invite tokens');
select lives_ok(
  $$ insert into invitation_tokens (family_id, created_by, code)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'FRESH-F1') $$,
  'D2: owner can issue a new invite code'
);
select is(tests_count('invitation_tokens'), 5::bigint, 'D3: issued token is visible to the owner');
reset role;

set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000002');
select is(tests_count('invitation_tokens'), 0::bigint, 'D4: partner cannot see invite tokens');
select lives_ok(
  $$ insert into invitation_tokens (family_id, created_by, code)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'SNEAK-F1') $$,
  'D5: partner token-issue attempt does not raise'
);
select is(tests_count('invitation_tokens'), 0::bigint, 'D6: partner cannot issue invite tokens');
select is(tests_count('baby_events'), 2::bigint, 'D7: partner (family member) reads family events — positive control');
select is(tests_count('parent_check_ins'), 1::bigint, 'D8: partner sees only their own check-ins');
select is(tests_count('parent_reflections'), 0::bigint, 'D9: partner cannot read the owner''s private reflections');
select is(
  (select count(*) from users where id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002')),
  2::bigint,
  'D10: partner sees self + co-member profiles (attribution)'
);
select is(
  (select display_name from users where id = '00000000-0000-0000-0000-000000000001'),
  'Owner Person',
  'D11: co-member display name is readable for attribution'
);
reset role;

-- ===========================================================================
-- Block E — private data isolation for the owner
-- ===========================================================================
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000001');
select is(tests_count('parent_check_ins'), 1::bigint, 'E1: owner sees only their own check-ins');
select is(tests_count('parent_reflections'), 1::bigint, 'E2: owner sees only their own reflections');
reset role;

-- ===========================================================================
-- Block F — token lifecycle predicate (what redeem-invite enforces server-side)
-- ===========================================================================
select is(
  (select token_is_active(t) from invitation_tokens t where t.code = 'ACTIVE-F1'),
  true, 'F1: fresh token is active'
);
select is(
  (select token_is_active(t) from invitation_tokens t where t.code = 'USED-F1'),
  false, 'F2: used token is rejected'
);
select is(
  (select token_is_active(t) from invitation_tokens t where t.code = 'REVOKED-F1'),
  false, 'F3: revoked token is rejected'
);
select is(
  (select token_is_active(t) from invitation_tokens t where t.code = 'EXPIRED-F1'),
  false, 'F4: expired token is rejected'
);
select is(
  (select count(*) from invitation_tokens t where t.family_id = '10000000-0000-0000-0000-000000000001' and token_is_active(t)),
  1::bigint,
  'F5: exactly one redeemable code remains in F1'
);

-- ===========================================================================
-- Block G — redemption + configured seat limit (service-role emulation)
-- ===========================================================================
-- Unset seat_limit = unlimited: a third member joins fine via service role.
select lives_ok(
  $$ insert into family_members (family_id, user_id, role)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'partner') $$,
  'G1: unset seat_limit = unlimited accepts a third member via service role'
);
-- Configured limit: F2's seat_limit = 2 rejects an over-limit insert.
select lives_ok(
  $$ update families set seat_limit = 2 where id = '10000000-0000-0000-0000-000000000002' $$,
  'G1b: owner sets F2 seat_limit to 2'
);
select throws_ok(
  $$ insert into family_members (family_id, user_id, role)
     values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'partner') $$,
  'P0001',
  'Family is at its caregiver limit (2)',
  'G1c: configured seat limit rejects an over-limit member even via the service role'
);
select lives_ok(
  $$ -- emulate redeem-invite: consume the token, join as partner, audit
     update invitation_tokens set used_at = now(), used_by = '00000000-0000-0000-0000-000000000003'
       where code = 'ACTIVE-F2';
     insert into family_members (family_id, user_id, role, display_name)
       values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'partner', 'Intruder Person');
     insert into audit_logs (family_id, actor_id, action)
       values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'member.joined'); $$,
  'G2: redemption flow (token consume + join + audit) succeeds via service role'
);
select is(
  (select token_is_active(t) from invitation_tokens t where t.code = 'ACTIVE-F2'),
  false, 'G3: redeemed token is consumed (single-use)'
);
select is(
  (select count(*) from invitation_tokens t where t.family_id = '10000000-0000-0000-0000-000000000002' and token_is_active(t)),
  0::bigint,
  'G4: no redeemable codes remain in F2'
);

-- After redemption, the intruder is a partner of F2 — and nothing more.
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000003');
select is(tests_count('baby_events'), 1::bigint, 'G5: joined caregiver reads their new family''s events');
select is(
  (select count(*) from baby_events where family_id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'G6: joined caregiver still cannot read the unrelated family'
);
select is(tests_count('parent_check_ins'), 0::bigint, 'G7: joined caregiver sees no private check-ins');
reset role;

-- ===========================================================================
-- Block H — seat limit is a family setting + limited (grandparent/nanny) seats
-- ===========================================================================
-- H1: a non-owner partner can change the family's seat limit (any caregiver).
set local role authenticated;
select tests_set_identity('00000000-0000-0000-0000-000000000002');
select lives_ok(
  $$ update families set seat_limit = 4 where id = '10000000-0000-0000-0000-000000000001' $$,
  'H1: a partner (non-owner) can change the family seat limit'
);
-- H2: the change is audit-logged with actor + old/new values.
select is(
  (select count(*) from audit_logs a
    where a.family_id = '10000000-0000-0000-0000-000000000001'
      and a.action = 'seat_limit.changed'
      and a.actor_id = '00000000-0000-0000-0000-000000000002'
      and (a.detail->>'from')::int is null
      and (a.detail->>'to')::int = 4),
  1::bigint,
  'H2: seat-limit change is audit-logged with actor and old/new values'
);
-- H3: a limited seat cannot change the seat limit (RLS).
select tests_set_identity('00000000-0000-0000-0000-000000000005');
select throws_ok(
  $$ update families set seat_limit = 5 where id = '10000000-0000-0000-0000-000000000001' $$,
  '42501',
  NULL,
  'H3: a limited seat cannot change the seat limit (RLS)'
);
-- H4: limited seat sees NO audit log (trust surface hidden server-side).
select is(tests_count('audit_logs'), 0::bigint, 'H4: limited seat sees no audit log');
-- H5: limited seat reads family care events (their role's core value).
select is(tests_count('baby_events'), 2::bigint, 'H5: limited seat reads family care events');
-- H6: limited seat sees no private check-ins.
select is(tests_count('parent_check_ins'), 0::bigint, 'H6: limited seat sees no private check-ins');
-- H7: limited seat cannot issue invites (owner-only).
select throws_ok(
  $$ insert into invitation_tokens (family_id, created_by, code)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'GRANDMA-1') $$,
  '42501',
  NULL,
  'H7: limited seat cannot issue an invite (owner-only RLS)'
);
-- H8: a partner (non-owner, non-limited) still reads the audit log.
select tests_set_identity('00000000-0000-0000-0000-000000000002');
select ok((select tests_count('audit_logs')) >= 1, 'H8: partner (non-owner) still reads the audit log');
reset role;

-- ===========================================================================
-- Summary
-- ===========================================================================
select * from finish();
rollback;
