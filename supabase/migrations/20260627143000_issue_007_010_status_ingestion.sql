alter table public.integrations drop constraint if exists integrations_status_check;

alter table public.integrations
  add constraint integrations_status_check
  check (status in ('pending', 'connected', 'syncing', 'offline', 'error', 'active', 'paused', 'revoked'));

alter table public.integrations
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists sync_error text;

create index if not exists integrations_status_heartbeat_idx
  on public.integrations (status, last_heartbeat_at desc);

alter table public.steps
  add column if not exists occurred_at timestamptz;

alter table public.flows
  add column if not exists source text,
  add column if not exists model text;
