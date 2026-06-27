alter table public.integrations drop constraint if exists integrations_status_check;

alter table public.integrations
  add constraint integrations_status_check
  check (status in ('pending', 'active', 'paused', 'revoked'));

alter table public.pairing_tokens
  add column if not exists integration_id uuid references public.integrations(id) on delete cascade;

update public.pairing_tokens pt
set integration_id = ct.integration_id
from public.connector_tokens ct
where ct.workspace_id = pt.workspace_id
  and pt.integration_id is null;

alter table public.pairing_tokens
  alter column integration_id set not null;

create index if not exists pairing_tokens_integration_idx
  on public.pairing_tokens (workspace_id, integration_id, expires_at desc);

drop policy if exists pairing_tokens_select_own on public.pairing_tokens;
create policy pairing_tokens_select_own
  on public.pairing_tokens
  for select
  using (public.workspace_has_access(workspace_id));

drop policy if exists pairing_tokens_insert_owner on public.pairing_tokens;
create policy pairing_tokens_insert_owner
  on public.pairing_tokens
  for insert
  with check (
    public.workspace_is_owner(workspace_id)
    and exists (
      select 1
      from public.integrations i
      where i.id = integration_id
        and i.workspace_id = pairing_tokens.workspace_id
    )
  );

drop policy if exists pairing_tokens_update_owner on public.pairing_tokens;
create policy pairing_tokens_update_owner
  on public.pairing_tokens
  for update
  using (public.workspace_is_owner(workspace_id))
  with check (
    public.workspace_is_owner(workspace_id)
    and exists (
      select 1
      from public.integrations i
      where i.id = integration_id
        and i.workspace_id = pairing_tokens.workspace_id
    )
  );

drop policy if exists pairing_tokens_delete_owner on public.pairing_tokens;
create policy pairing_tokens_delete_owner
  on public.pairing_tokens
  for delete
  using (public.workspace_is_owner(workspace_id));

comment on column public.pairing_tokens.integration_id is 'The pending Hermes integration this one-time pairing token can attach to.';
