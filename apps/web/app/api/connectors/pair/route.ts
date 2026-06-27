import { NextRequest, NextResponse } from 'next/server';

import { exchangePairingToken, PairingExchangeError } from '@/lib/pairing-exchange';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { token?: string; connectorName?: string };

  try {
    body = (await request.json()) as { token?: string; connectorName?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const result = await exchangePairingToken(supabase, body.token ?? '');

    return NextResponse.json({
      connectorToken: result.connectorToken,
      integration: {
        id: result.integrationId,
        workspaceId: result.workspaceId,
        name: result.integrationName,
        provider: result.provider,
        status: result.status,
      },
    });
  } catch (error) {
    if (error instanceof PairingExchangeError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Failed to exchange pairing token.' }, { status: 500 });
  }
}
