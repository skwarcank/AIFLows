import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseWorkspaceStore } from '@/lib/app-state';
import { createSupabaseHermesPairingStore, createHermesPairingSession } from '@/lib/hermes-pairing';
import { createRouteSupabaseClient } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = createRouteSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const workspaceStore = createSupabaseWorkspaceStore(adminSupabase);
    const pairingStore = createSupabaseHermesPairingStore(adminSupabase, workspaceStore);
    const pairing = await createHermesPairingSession(pairingStore, {
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({
      integration: pairing.integration,
      workspace: pairing.workspace,
      pairing: {
        command: pairing.command,
        expiresAt: pairing.expiresAt,
        ttlMinutes: pairing.ttlMinutes,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create Hermes pairing session.';
    const status = message.includes('already active') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
