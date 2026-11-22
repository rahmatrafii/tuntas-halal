create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create extension if not exists pgcrypto with schema extensions;

create type public.membership_role as enum ('companion', 'coordinator');
create type public.revision_status as enum ('needs_sending', 'awaiting_reply', 'needs_review', 'completed');

create function private.valid_timezone(p_timezone text) returns boolean
language sql stable set search_path = '' as $$
  select exists(select 1 from pg_catalog.pg_timezone_names where name = p_timezone);
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  timezone text not null default 'Asia/Jakarta' check (private.valid_timezone(timezone)),
  created_at timestamptz not null default now()
);
create table public.memberships (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  role public.membership_role not null,
  is_active boolean not null default true,
  primary key (organization_id, user_id)
);
create index memberships_user on public.memberships(user_id, organization_id);
create table public.business_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  owner_id uuid not null,
  business_name text not null check (btrim(business_name) <> ''),
  whatsapp_number text not null check (whatsapp_number ~ '^[1-9][0-9]{7,14}$'),
  greeting_name text not null default '',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, owner_id) references public.memberships(organization_id, user_id)
);
create index contacts_owner_phone on public.business_contacts(organization_id, owner_id, whatsapp_number);
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  contact_id uuid not null,
  assignee_id uuid not null,
  official_reference text check (official_reference is null or btrim(official_reference) <> ''),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, contact_id) references public.business_contacts(organization_id, id),
  foreign key (organization_id, assignee_id) references public.memberships(organization_id, user_id)
);
create index cases_assignee on public.cases(organization_id, assignee_id);
create index cases_contact on public.cases(contact_id);
create table public.revision_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  instruction text not null check (btrim(instruction) <> ''),
  status public.revision_status not null default 'needs_sending',
  follow_up_on date check (follow_up_on is null or (isfinite(follow_up_on) and follow_up_on between date '0001-01-01' and date '9999-12-31')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, id)
);
create index tasks_case on public.revision_tasks(case_id);
create index tasks_follow_up on public.revision_tasks(status, follow_up_on) where follow_up_on is not null;
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  task_id uuid,
  actor_id uuid references auth.users(id),
  event_type text not null check (event_type in ('case_created', 'case_updated', 'case_transferred', 'task_created', 'task_updated', 'status_changed')),
  before jsonb,
  after jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (case_id, task_id) references public.revision_tasks(case_id, id),
  check (before is null or (jsonb_typeof(before) = 'object' and before - array['status','follow_up_on','assignee_id','version'] = '{}'::jsonb)),
  check (jsonb_typeof(after) = 'object' and after - array['status','follow_up_on','assignee_id','version'] = '{}'::jsonb)
);
create index audit_case_time on public.audit_events(case_id, created_at desc);

-- A receipt contains a request hash and identifiers/versions only, never message or instruction text.
create table private.mutation_requests (
  actor_id uuid not null references auth.users(id),
  request_id uuid not null,
  operation text not null,
  payload_hash text not null,
  result jsonb not null default '{}',
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);
revoke all on private.mutation_requests from public, anon, authenticated, service_role;

create function private.is_active_member(p_organization_id uuid, p_role public.membership_role default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.memberships m
    where m.organization_id = p_organization_id and m.user_id = auth.uid()
      and m.is_active and (p_role is null or m.role = p_role));
$$;
create function private.can_read_case(p_case_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.cases c join public.memberships m on m.organization_id = c.organization_id
    where c.id = p_case_id and m.user_id = auth.uid() and m.is_active
      and (m.role = 'coordinator' or (m.role = 'companion' and c.assignee_id = auth.uid())));
$$;
create function private.can_read_contact(p_contact_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.business_contacts b join public.memberships m on m.organization_id = b.organization_id
    where b.id = p_contact_id and m.user_id = auth.uid() and m.is_active
      and ((m.role = 'companion' and b.owner_id = auth.uid()) or exists(
        select 1 from public.cases c where c.contact_id = b.id
          and (m.role = 'coordinator' or (m.role = 'companion' and c.assignee_id = auth.uid())))));
$$;

create function private.validate_contact_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.memberships where organization_id = new.organization_id
    and user_id = new.owner_id and role = 'companion' and is_active) then
    raise exception using errcode = '22023', message = 'Pemilik kontak harus pendamping aktif pada LP3H yang sama.';
  end if;
  return new;
end;
$$;
create trigger contact_owner before insert or update of owner_id, organization_id on public.business_contacts
for each row execute function private.validate_contact_owner();
create function private.validate_assignee() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.memberships where organization_id = new.organization_id
    and user_id = new.assignee_id and role = 'companion' and is_active) then
    raise exception using errcode = '22023', message = 'Penanggung jawab harus pendamping aktif pada LP3H yang sama.';
  end if;
  return new;
end;
$$;
create trigger case_assignee before insert or update of assignee_id, organization_id on public.cases
for each row execute function private.validate_assignee();
create function private.touch_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.updated_at := clock_timestamp();
  new.created_at := old.created_at;
  return new;
end;
$$;
create trigger contacts_version before update on public.business_contacts for each row execute function private.touch_version();
create trigger cases_version before update on public.cases for each row execute function private.touch_version();
create trigger tasks_version before update on public.revision_tasks for each row execute function private.touch_version();

create function private.audit_case_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(case_id, actor_id, event_type, before, after)
  values (new.id, auth.uid(),
    case when tg_op = 'INSERT' then 'case_created' when old.assignee_id <> new.assignee_id then 'case_transferred' else 'case_updated' end,
    case when tg_op = 'INSERT' then null else jsonb_build_object('assignee_id',old.assignee_id,'version',old.version) end,
    jsonb_build_object('assignee_id',new.assignee_id,'version',new.version));
  return new;
end;
$$;
create trigger case_audit after insert or update on public.cases for each row execute function private.audit_case_change();
create function private.audit_task_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(case_id, task_id, actor_id, event_type, before, after)
  values (new.case_id, new.id, auth.uid(),
    case when tg_op = 'INSERT' then 'task_created' when old.status <> new.status then 'status_changed' else 'task_updated' end,
    case when tg_op = 'INSERT' then null else jsonb_build_object('status',old.status,'follow_up_on',old.follow_up_on,'version',old.version) end,
    jsonb_build_object('status',new.status,'follow_up_on',new.follow_up_on,'version',new.version));
  return new;
end;
$$;
create trigger task_audit after insert or update on public.revision_tasks for each row execute function private.audit_task_change();
create function private.reject_audit_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '42501', message = 'Riwayat bersifat append-only.';
end;
$$;
create trigger immutable_audit before update or delete on public.audit_events for each row execute function private.reject_audit_change();

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.business_contacts enable row level security;
alter table public.cases enable row level security;
alter table public.revision_tasks enable row level security;
alter table public.audit_events enable row level security;
create policy read_organization on public.organizations for select to authenticated using (private.is_active_member(id));
create policy read_memberships on public.memberships for select to authenticated using (private.is_active_member(organization_id));
create policy read_contacts on public.business_contacts for select to authenticated using (private.can_read_contact(id));
create policy read_cases on public.cases for select to authenticated using (private.can_read_case(id));
create policy read_tasks on public.revision_tasks for select to authenticated using (private.can_read_case(case_id));
create policy read_audit on public.audit_events for select to authenticated using (private.can_read_case(case_id));

revoke all on public.organizations, public.memberships, public.business_contacts, public.cases, public.revision_tasks, public.audit_events from public, anon, authenticated;
grant select on public.organizations, public.memberships, public.business_contacts, public.cases, public.revision_tasks, public.audit_events to authenticated;
-- Administrative provisioning/fixtures only. Application mutations use the user's RPC session.
grant select, insert, update, delete on public.organizations, public.memberships, public.business_contacts, public.cases, public.revision_tasks to service_role;
grant select on public.audit_events to service_role;
revoke all on all functions in schema private from public, anon, authenticated, service_role;
grant execute on function private.is_active_member(uuid,public.membership_role), private.can_read_case(uuid), private.can_read_contact(uuid) to authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;

create function public.case_is_complete(p_case_id uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select count(*) > 0 and coalesce(bool_and(t.status = 'completed'),false)
  from public.revision_tasks t where t.case_id = p_case_id and private.can_read_case(p_case_id);
$$;
revoke all on function public.case_is_complete(uuid) from public, anon;
grant execute on function public.case_is_complete(uuid) to authenticated;
