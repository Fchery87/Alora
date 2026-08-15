create table event_duplicate_resolutions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  event_id uuid not null,
  duplicate_of uuid not null,
  resolution text not null check (resolution in ('keep_both', 'merged')),
  resolved_by uuid references users (id) on delete set null,
  resolved_at timestamptz not null default now(),
  unique (family_id, event_id, duplicate_of),
  foreign key (family_id, event_id) references baby_events (family_id, id) on delete cascade,
  foreign key (family_id, duplicate_of) references baby_events (family_id, id) on delete cascade,
  check (event_id <> duplicate_of)
);

create index event_duplicate_resolutions_family_idx
  on event_duplicate_resolutions (family_id, resolved_at desc);

alter table event_duplicate_resolutions enable row level security;

create policy duplicate_resolutions_member_read on event_duplicate_resolutions
  for select using (is_family_member(family_id));

create policy duplicate_resolutions_member_write on event_duplicate_resolutions
  for insert
  with check (is_family_member(family_id) and resolved_by = auth.uid());

create policy duplicate_resolutions_member_update on event_duplicate_resolutions
  for update
  using (is_family_member(family_id))
  with check (is_family_member(family_id) and resolved_by = auth.uid());

grant select, insert on event_duplicate_resolutions to authenticated;
