import { NextResponse } from 'next/server';

import { buildConnectorInstallScript } from '@/lib/connector-install';
import { getAppUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return new NextResponse(buildConnectorInstallScript(getAppUrl()), {
    status: 200,
    headers: {
      'content-type': 'text/x-shellscript; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
