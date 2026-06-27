import { createClient } from '@supabase/supabase-js';

import { getPublicSupabaseConfig, getSupabaseServiceRoleKey } from '@/lib/env';

export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
