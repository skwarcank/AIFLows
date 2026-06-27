import { NextRequest, NextResponse } from 'next/server';

import { createRouteSupabaseClient } from '@/lib/supabase/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { integrationId: string } }) {
  const supabase = createRouteSupabaseClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('integrations')
    .select('id, provider, name, status')
    .eq('id', params.integrationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  return NextResponse.json({ integration: data });
}
