import { redirect } from 'next/navigation';

import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = createReadOnlySupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  redirect(data.session ? '/app' : '/login');
}
