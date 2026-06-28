import { redirect } from 'next/navigation';

import AppShell from '@/components/app-shell';
import { createSupabaseWorkspaceStore, ensureAppShellState } from '@/lib/app-state';
import { isMissingRequiredEnvError } from '@/lib/env';
import { loadMissionControlData } from '@/lib/mission-control';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function AppPage() {
  const supabase = await createReadOnlySupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const state = await ensureAppShellState(createSupabaseWorkspaceStore(adminSupabase), {
      id: user.id,
      email: user.email,
    });
    const missionControl = state.integration ? await loadMissionControlData(adminSupabase, state.integration.id) : null;

    return (
      <main className="screen app-screen">
        <AppShell
          email={user.email ?? 'signed-in user'}
          workspace={state.workspace}
          integration={state.integration}
          missionControl={missionControl}
        />
      </main>
    );
  } catch (error) {
    if (isMissingRequiredEnvError(error)) {
      return <ProductionSetupError message={error instanceof Error ? error.message : 'Production environment is incomplete.'} />;
    }
    throw error;
  }
}

function ProductionSetupError({ message }: { message: string }) {
  return (
    <main className="screen app-screen">
      <section className="auth-card">
        <p className="eyebrow">Production setup incomplete</p>
        <h1>AIFlows needs one more server environment variable</h1>
        <p className="muted">{message}</p>
        <p>
          Add the missing value in Vercel Project Settings → Environment Variables, then redeploy. The dashboard uses this server-only key to create your first workspace and read synced connector data safely.
        </p>
        <pre className="command-block"><code>SUPABASE_SERVICE_ROLE_KEY=[REDACTED]</code></pre>
      </section>
    </main>
  );
}
