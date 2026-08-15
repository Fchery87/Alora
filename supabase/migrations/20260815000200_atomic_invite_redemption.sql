-- Make invite redemption and its brute-force limiter durable and atomic.

create table invite_redemption_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0)
);

revoke all on invite_redemption_rate_limits from anon, authenticated;

-- Owner is a family invariant, not an invite-grantable role. Existing data
-- remains valid only when it is already partner/limited; fail closed for any
-- future direct insert or generated invite that attempts to mint ownership.
alter table invitation_tokens
  add constraint invitation_tokens_role_not_owner
  check (role <> 'owner');

create or replace function consume_invite_attempt(network_signal text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  key text;
  current_window invite_redemption_rate_limits%rowtype;
  window_size constant interval := interval '60 seconds';
  maximum_attempts constant integer := 5;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  key := encode(digest(actor::text || ':' || coalesce(network_signal, 'unknown'), 'sha256'), 'hex');
  -- One upsert owns both first creation and concurrent increments. A
  -- select-then-insert sequence can reset a bucket when two cold callers race
  -- to create it.
  insert into invite_redemption_rate_limits (bucket_key, window_started_at, attempts)
  values (key, now(), 1)
  on conflict (bucket_key) do update
  set window_started_at = case
        when invite_redemption_rate_limits.window_started_at + window_size <= now() then now()
        else invite_redemption_rate_limits.window_started_at
      end,
      attempts = case
        when invite_redemption_rate_limits.window_started_at + window_size <= now() then 1
        else invite_redemption_rate_limits.attempts + 1
      end
  returning * into current_window;

  return current_window.attempts <= maximum_attempts;
end;
$$;

create or replace function redeem_invite(invite_code text, actor_display_name text default 'Caregiver')
returns table (joined_family_id uuid, joined_role family_role)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  token invitation_tokens%rowtype;
  family_row families%rowtype;
  existing_role family_role;
  token_found boolean;
  member_name text := coalesce(nullif(trim(actor_display_name), ''), 'Caregiver');
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into token
  from invitation_tokens
  where code = upper(trim(invite_code))
  for update;
  token_found := found;

  -- A retry by the original winner is idempotent. Every other unavailable
  -- token follows the same generic P0001 error path in the Edge Function.
  if found and token.used_at is not null and token.used_by = actor then
    select role into existing_role
    from family_members
    where family_id = token.family_id and user_id = actor;
    if existing_role is not null then
      return query select token.family_id, existing_role;
      return;
    end if;
  end if;

  if not token_found
     or token.used_at is not null
     or token.revoked_at is not null
     or token.expires_at <= now() then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  select * into family_row
  from families
  where id = token.family_id
  for update;
  if not found then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  select role into existing_role
  from family_members
  where family_id = token.family_id and user_id = actor;
  if existing_role is not null then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  if family_row.seat_limit is not null
     and (select count(*) from family_members where family_id = token.family_id) >= family_row.seat_limit then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  insert into users (id, display_name)
  values (actor, member_name)
  on conflict (id) do update set display_name = excluded.display_name;

  insert into family_members (family_id, user_id, role, display_name)
  values (token.family_id, actor, token.role, member_name);

  update invitation_tokens
  set used_at = now(), used_by = actor
  where id = token.id and used_at is null;
  if not found then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  insert into audit_logs (family_id, actor_id, action, detail)
  values (token.family_id, actor, 'member.joined', jsonb_build_object('role', token.role));

  return query select token.family_id, token.role;
exception
  when unique_violation then
    raise exception 'Invalid invite code' using errcode = 'P0001';
end;
$$;

grant execute on function consume_invite_attempt(text) to authenticated;
grant execute on function redeem_invite(text, text) to authenticated;
