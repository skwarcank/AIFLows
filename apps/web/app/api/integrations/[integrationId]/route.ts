import { NextRequest, NextResponse } from 'next/server';

import { createRouteSupabaseClient } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type IntegrationOwnerJoin = {
  id: string;
  workspace_id: string;
  workspaces: { created_by: string } | { created_by: string }[] | null;
};

type IntegrationRouteContext = { params: Promise<{ integrationId: string }> };

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: IntegrationRouteContext) {
  const { integrationId } = await context.params;
  const supabase = createRouteSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const staleThreshold = new Date(Date.now() - 60_000).toISOString();
  const admin = createSupabaseAdminClient();
  await admin.from('integrations').update({ status: 'offline' }).eq('id', integrationId).lt('last_heartbeat_at', staleThreshold).in('status', ['connected', 'syncing']);

  const { data, error } = await supabase
    .from('integrations')
    .select('id, provider, name, status, last_heartbeat_at, last_synced_at, sync_error')
    .eq('id', integrationId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ integration: data });
}

export async function DELETE(request: NextRequest, context: IntegrationRouteContext) {
  const { integrationId } = await context.params;
  const supabase = createRouteSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: integration, error: readError } = await admin
    .from('integrations')
    .select('id, workspace_id, workspaces!inner(created_by)')
    .eq('id', integrationId)
    .single();
  if (readError || !integration) return NextResponse.json({ error: 'Integration not found.' }, { status: 404 });
  const typedIntegration = integration as unknown as IntegrationOwnerJoin;
  const workspace = Array.isArray(typedIntegration.workspaces) ? typedIntegration.workspaces[0] : typedIntegration.workspaces;
  if (workspace?.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await admin.from('connector_tokens').update({ revoked_at: new Date().toISOString() }).eq('integration_id', integrationId).is('revoked_at', null);
  await admin.from('pairing_tokens').update({ revoked_at: new Date().toISOString() }).eq('integration_id', integrationId).is('revoked_at', null);
  const { error } = await admin.from('integrations').delete().eq('id', integrationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
