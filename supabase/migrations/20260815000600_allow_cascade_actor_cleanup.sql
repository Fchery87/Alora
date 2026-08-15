-- Allow provider-driven foreign-key cleanup to null event actors without
-- weakening authenticated actor attribution for ordinary client updates.
create or replace function enforce_event_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role and fixture writes have no authenticated JWT and bypass this
  -- actor check. A nested FK action may also null an actor while auth.users is
  -- being deleted; pg_trigger_depth distinguishes that provider cleanup from
  -- a direct client attempt to erase attribution.
  if auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'baby_events' then
    if tg_op = 'INSERT' and new.created_by is distinct from auth.uid() then
      raise exception 'created_by must match the authenticated actor' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
      if new.created_by is null and pg_trigger_depth() > 1 then
        return new;
      end if;
      raise exception 'created_by cannot be changed' using errcode = '42501';
    end if;
  elsif tg_table_name = 'event_edits' then
    if tg_op = 'INSERT' and new.edited_by is distinct from auth.uid() then
      raise exception 'edited_by must match the authenticated actor' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.edited_by is distinct from old.edited_by then
      if new.edited_by is null and pg_trigger_depth() > 1 then
        return new;
      end if;
      raise exception 'edited_by cannot be changed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
