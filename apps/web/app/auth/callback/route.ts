import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

import { getAppUrl, getPublicSupabaseConfig } from '@/lib/env';

type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: any;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { url, anonKey } = getPublicSupabaseConfig();
  const appUrl = getAppUrl();
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get('code');

  const response = NextResponse.redirect(new URL('/app', appUrl));
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing-code', appUrl));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, appUrl));
  }

  return response;
}
