import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getPublicSupabaseConfig } from '@/lib/env';

export function createReadOnlySupabaseServerClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getPublicSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server components only read session state. Mutations happen in route handlers.
      },
    },
  });
}
