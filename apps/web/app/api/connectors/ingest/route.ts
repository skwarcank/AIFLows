import { NextRequest, NextResponse } from 'next/server';

import { authenticateConnector, ConnectorAuthError } from '@/lib/connector-auth';
import { ingestFlows } from '@/lib/flow-ingestion';
import { validateFlowPayload } from '@/lib/flow-ingestion-schema';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    const context = await authenticateConnector(supabase, request.headers.get('authorization'));
    const parsed = validateFlowPayload(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const result = await ingestFlows(supabase, context, parsed.value);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConnectorAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Ingestion failed.' }, { status: 500 });
  }
}
