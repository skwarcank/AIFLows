import { NextRequest, NextResponse } from 'next/server';

import { authenticateConnector, ConnectorAuthError } from '@/lib/connector-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    const context = await authenticateConnector(supabase, request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as { status?: string; message?: string };
    const requested = body.status === 'syncing' || body.status === 'error' ? body.status : 'connected';
    const staleThreshold = new Date(Date.now() - 60_000).toISOString();
    await supabase
      .from('integrations')
      .update({ status: 'offline' })
      .lt('last_heartbeat_at', staleThreshold)
      .in('status', ['connected', 'syncing']);
    const { data, error } = await supabase
      .from('integrations')
      .update({ status: requested, last_heartbeat_at: new Date().toISOString(), sync_error: requested === 'error' ? body.message ?? 'Connector reported an error.' : null })
      .eq('id', context.integrationId)
      .select('id, status')
      .single();
    if (error) throw error;
    return NextResponse.json({ integration: data });
  } catch (error) {
    if (error instanceof ConnectorAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Heartbeat failed.' }, { status: 500 });
  }
}
