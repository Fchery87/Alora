create table account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null check (status in ('requested', 'auth_pending', 'completed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  failure_category text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index account_deletion_requests_active_idx
  on account_deletion_requests (user_id)
  where status in ('requested', 'auth_pending');

revoke all on account_deletion_requests from anon, authenticated;

create or replace function request_account_deletion()
returns table (request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  existing account_deletion_requests%rowtype;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into existing
  from account_deletion_requests
  where user_id = actor
  order by requested_at desc
  limit 1
  for update;

  if found and existing.status = 'completed' then
    return query select existing.id, existing.status;
    return;
  end if;

  if found and existing.status in ('requested', 'auth_pending') then
    return query select existing.id, existing.status;
    return;
  end if;

  if found then
    update account_deletion_requests
    set status = 'requested',
        attempt_count = existing.attempt_count + 1,
        failure_category = null,
        updated_at = now()
    where id = existing.id;
    return query select existing.id, 'requested'::text;
    return;
  end if;

  insert into account_deletion_requests (user_id, status)
  values (actor, 'requested')
  returning id, status into request_id, request_status;
  return next;
end;
$$;

create or replace function mark_account_deletion_failed(request_id uuid, failure text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  update account_deletion_requests
  set status = 'failed',
      failure_category = left(coalesce(failure, 'provider_error'), 80),
      updated_at = now()
  where id = request_id
    and (actor is null or user_id = actor)
    and status <> 'completed';
end;
$$;

create or replace function cleanup_deleted_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_family_id uuid;
  successor uuid;
begin
  for target_family_id in
    select fm.family_id
    from family_members fm
    where user_id = old.id
      and role = 'owner'
    order by fm.family_id
  loop
    perform 1 from families where id = target_family_id for update;

    select user_id into successor
    from family_members
    where family_members.family_id = target_family_id
      and user_id <> old.id
      and role <> 'limited'
    order by case when role = 'partner' then 0 else 1 end, joined_at, user_id
    limit 1;

    delete from family_members
    where family_members.family_id = target_family_id
      and user_id = old.id;

    if successor is null then
      delete from families where id = target_family_id;
    else
      update family_members
      set role = 'owner'
      where family_members.family_id = target_family_id
        and user_id = successor;
      insert into audit_logs (family_id, actor_id, action, detail)
      values (target_family_id, null, 'owner.transferred', jsonb_build_object('to', successor));
    end if;
  end loop;

  delete from event_duplicate_resolutions where resolved_by = old.id;
  delete from parent_reflections where user_id = old.id;
  delete from parent_check_ins where user_id = old.id;
  delete from notification_preferences where user_id = old.id;
  delete from invitation_tokens where created_by = old.id;
  delete from family_members where user_id = old.id;

  update account_deletion_requests
  set status = 'completed', completed_at = now(), updated_at = now(), failure_category = null
  where user_id = old.id
    and status <> 'completed';

  return old;
end;
$$;

drop trigger if exists trg_cleanup_deleted_auth_user on auth.users;
create trigger trg_cleanup_deleted_auth_user
before delete on auth.users
for each row execute function cleanup_deleted_auth_user();

grant execute on function request_account_deletion() to authenticated;
grant execute on function mark_account_deletion_failed(uuid, text) to authenticated;
