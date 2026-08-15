create or replace function bootstrap_family(
  family_name text default 'Our family',
  baby_name text default 'Baby',
  baby_birth_date date default null
)
returns table (created_family_id uuid, created_baby_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  existing_family uuid;
  existing_baby uuid;
  family_id uuid;
  baby_id uuid;
  safe_family_name text := coalesce(nullif(trim(family_name), ''), 'Our family');
  safe_baby_name text := coalesce(nullif(trim(baby_name), ''), 'Baby');
  actor_name text;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select coalesce(raw_user_meta_data ->> 'display_name', 'Caregiver')
    into actor_name
  from auth.users
  where id = actor;

  perform pg_advisory_xact_lock(hashtextextended('alora.bootstrap:' || actor::text, 0));

  select fm.family_id, b.id
    into existing_family, existing_baby
  from family_members fm
  left join babies b on b.family_id = fm.family_id
  where fm.user_id = actor
  order by fm.joined_at asc, b.created_at asc nulls last
  limit 1;

  if existing_family is not null then
    if existing_baby is null then
      insert into babies (family_id, name, birth_date)
      values (existing_family, safe_baby_name, baby_birth_date)
      returning id into existing_baby;
    end if;
    return query select existing_family, existing_baby;
    return;
  end if;

  insert into users (id, display_name)
  values (actor, coalesce(nullif(trim(actor_name), ''), 'Caregiver'))
  on conflict (id) do update set display_name = excluded.display_name;

  insert into families (name, created_by)
  values (safe_family_name, actor)
  returning id into family_id;

  insert into family_members (family_id, user_id, role, display_name)
  values (family_id, actor, 'owner', coalesce(nullif(trim(actor_name), ''), 'Caregiver'));

  insert into babies (family_id, name, birth_date)
  values (family_id, safe_baby_name, baby_birth_date)
  returning id into baby_id;

  insert into audit_logs (family_id, actor_id, action, detail)
  values (family_id, actor, 'family.created', jsonb_build_object('baby_name', safe_baby_name));

  return query select family_id, baby_id;
end;
$$;

grant execute on function bootstrap_family(text, text, date) to authenticated;
