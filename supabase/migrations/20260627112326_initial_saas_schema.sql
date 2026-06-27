create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.workspace_has_access(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_is_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  );
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null default 'hermes',
  external_id text not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, external_id)
);

create table if not exists public.integration_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  external_id text not null,
  name text not null,
  profile_type text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (integration_id, external_id)
);

create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  integration_profile_id uuid references public.integration_profiles(id) on delete set null,
  external_id text not null,
  title text not null,
  prompt text not null,
  final_answer text,
  status text not null default 'completed' check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (integration_id, external_id)
);

create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  flow_id uuid not null references public.flows(id) on delete cascade,
  external_id text,
  step_index integer not null,
  kind text not null,
  title text not null,
  description text,
  tool_name text,
  tool_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flow_id, step_index)
);

create table if not exists public.pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.connector_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists integrations_workspace_provider_idx on public.integrations (workspace_id, provider, external_id);
create index if not exists integration_profiles_workspace_integration_idx on public.integration_profiles (workspace_id, integration_id, external_id);
create index if not exists flows_workspace_created_idx on public.flows (workspace_id, created_at desc);
create index if not exists flows_integration_created_idx on public.flows (integration_id, created_at desc);
create index if not exists steps_flow_index_idx on public.steps (flow_id, step_index);
create index if not exists pairing_tokens_workspace_idx on public.pairing_tokens (workspace_id, expires_at desc);
create index if not exists connector_tokens_integration_idx on public.connector_tokens (workspace_id, integration_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_profiles enable row level security;
alter table public.flows enable row level security;
alter table public.steps enable row level security;
alter table public.pairing_tokens enable row level security;
alter table public.connector_tokens enable row level security;

create policy workspaces_select_own
  on public.workspaces
  for select
  using (public.workspace_has_access(id));

create policy workspaces_insert_own
  on public.workspaces
  for insert
  with check (created_by = auth.uid());

create policy workspaces_update_own
  on public.workspaces
  for update
  using (public.workspace_is_owner(id))
  with check (public.workspace_is_owner(id));

create policy workspaces_delete_own
  on public.workspaces
  for delete
  using (public.workspace_is_owner(id));

create policy workspace_members_select_own
  on public.workspace_members
  for select
  using (public.workspace_has_access(workspace_id) or user_id = auth.uid());

create policy workspace_members_insert_owner_workspace
  on public.workspace_members
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.created_by = auth.uid()
    )
  );

create policy workspace_members_update_owner
  on public.workspace_members
  for update
  using (public.workspace_is_owner(workspace_id))
  with check (public.workspace_is_owner(workspace_id));

create policy workspace_members_delete_owner
  on public.workspace_members
  for delete
  using (public.workspace_is_owner(workspace_id));

create policy integrations_select_own
  on public.integrations
  for select
  using (public.workspace_has_access(workspace_id));

create policy integrations_insert_owner
  on public.integrations
  for insert
  with check (public.workspace_is_owner(workspace_id));

create policy integrations_update_owner
  on public.integrations
  for update
  using (public.workspace_is_owner(workspace_id))
  with check (public.workspace_is_owner(workspace_id));

create policy integrations_delete_owner
  on public.integrations
  for delete
  using (public.workspace_is_owner(workspace_id));

create policy integration_profiles_select_own
  on public.integration_profiles
  for select
  using (public.workspace_has_access(workspace_id));

create policy integration_profiles_insert_owner
  on public.integration_profiles
  for insert
  with check (public.workspace_is_owner(workspace_id));

create policy integration_profiles_update_owner
  on public.integration_profiles
  for update
  using (public.workspace_is_owner(workspace_id))
  with check (public.workspace_is_owner(workspace_id));

create policy integration_profiles_delete_owner
  on public.integration_profiles
  for delete
  using (public.workspace_is_owner(workspace_id));

create policy flows_select_own
  on public.flows
  for select
  using (public.workspace_has_access(workspace_id));

create policy flows_insert_owner
  on public.flows
  for insert
  with check (public.workspace_is_owner(workspace_id));

create policy flows_update_owner
  on public.flows
  for update
  using (public.workspace_is_owner(workspace_id))
  with check (public.workspace_is_owner(workspace_id));

create policy flows_delete_owner
  on public.flows
  for delete
  using (public.workspace_is_owner(workspace_id));

create policy steps_select_own
  on public.steps
  for select
  using (public.workspace_has_access(workspace_id));

create policy steps_insert_owner
  on public.steps
  for insert
  with check (public.workspace_is_owner(workspace_id));

create policy steps_update_owner
  on public.steps
  for update
  using (public.workspace_is_owner(workspace_id))
  with check (public.workspace_is_owner(workspace_id));

create policy steps_delete_owner
  on public.steps
  for delete
  using (public.workspace_is_owner(workspace_id));

create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger set_integrations_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

create trigger set_integration_profiles_updated_at
before update on public.integration_profiles
for each row execute function public.set_updated_at();

create trigger set_flows_updated_at
before update on public.flows
for each row execute function public.set_updated_at();

create trigger set_steps_updated_at
before update on public.steps
for each row execute function public.set_updated_at();

create or replace function public.add_owner_membership_after_workspace_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do update
    set role = excluded.role;
  return new;
end;
$$;

create trigger add_owner_membership_after_workspace_insert
after insert on public.workspaces
for each row execute function public.add_owner_membership_after_workspace_insert();

comment on table public.flows is 'Stores hosted SaaS flows. Ingestion keeps the latest 100 flows per integration in a later issue; the created_at indexes support that cleanup.';
comment on table public.pairing_tokens is 'Store only hashed pairing tokens; plaintext pairing secrets must never be persisted.';
comment on table public.connector_tokens is 'Store only hashed connector tokens; plaintext connector secrets must never be persisted.';
