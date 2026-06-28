import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { getPublicSupabaseConfig, getSupabaseServiceRoleKey } from '@/lib/env';

export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
