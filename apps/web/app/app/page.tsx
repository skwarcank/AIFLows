import { redirect } from 'next/navigation';

import AppShell from '@/components/app-shell';
import { createSupabaseWorkspaceStore, ensureAppShellState } from '@/lib/app-state';
import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function AppPage() {
  const supabase = createReadOnlySupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect('/login');
  }

  const state = await ensureAppShellState(createSupabaseWorkspaceStore(supabase), {
    id: data.session.user.id,
    email: data.session.user.email,
  });

  return (
    <main className="screen app-screen">
      <AppShell email={data.session.user.email ?? 'signed-in user'} workspace={state.workspace} integration={state.integration} />
    </main>
  );
}
