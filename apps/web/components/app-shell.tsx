import HermesPairingCard from '@/components/hermes-pairing-card';
import SignOutButton from '@/components/sign-out-button';

import type { IntegrationRecord, WorkspaceRecord } from '@/lib/app-state';
import type { MissionControlData } from '@/lib/mission-control';

interface Props {
  email: string;
  workspace: WorkspaceRecord;
  integration: IntegrationRecord | null;
  missionControl: MissionControlData | null;
}

export default function AppShell({ email, workspace, integration, missionControl }: Props) {
  const hasIntegration = Boolean(integration);

  return (
    <div className="mission-control-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h1>{hasIntegration ? 'Hermes Mission Control' : 'Set up your first Hermes Integration'}</h1>
        </div>
        <SignOutButton />
      </header>

      <HermesPairingCard email={email} workspace={workspace} integration={integration} missionControl={missionControl} />
    </div>
  );
}
