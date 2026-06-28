import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/database.types';
import { getPublicSupabaseConfig } from '@/lib/env';

export async function createReadOnlySupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
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
