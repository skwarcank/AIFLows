import { redirect } from 'next/navigation';

import AppShell from '@/components/app-shell';
import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function AppPage() {
  const supabase = createReadOnlySupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect('/login');
  }

  const email = data.session.user.email ?? 'signed-in user';
  return (
    <main className="screen app-screen">
      <AppShell email={email} />
    </main>
  );
}
