import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

import { getPublicSupabaseConfig } from '@/lib/env';

export function createRouteSupabaseClient(request: NextRequest) {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // These route handlers only read auth/session state for now.
      },
    },
  });
}
