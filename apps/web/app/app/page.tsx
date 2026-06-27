import { redirect } from 'next/navigation';

import AppShell from '@/components/app-shell';
import { createSupabaseWorkspaceStore, ensureAppShellState } from '@/lib/app-state';
import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function AppPage() {
  const supabase = createReadOnlySupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const state = await ensureAppShellState(createSupabaseWorkspaceStore(supabase), {
    id: user.id,
    email: user.email,
  });

  return (
    <main className="screen app-screen">
      <AppShell email={user.email ?? 'signed-in user'} workspace={state.workspace} integration={state.integration} />
    </main>
  );
}
