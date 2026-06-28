import { redirect } from 'next/navigation';

import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createReadOnlySupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? '/app' : '/login');
}
