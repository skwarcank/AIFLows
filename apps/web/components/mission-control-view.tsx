import FlowList from '@/components/flow-list';
import FlowReplay from '@/components/flow-replay';
import ProfileTabs from '@/components/profile-tabs';
import type { IntegrationRecord, WorkspaceRecord } from '@/lib/app-state';
import type { MissionFlow, MissionProfile } from '@/lib/mission-control';

interface Props {
  email: string;
  workspace: WorkspaceRecord;
  integration: IntegrationRecord | null;
  profiles: MissionProfile[];
  flows: MissionFlow[];
  selectedFlow: MissionFlow | null;
  selectedFlowId: string | null;
  selectedProfileId: string | null;
  selectedProfileName: string | null;
  onSelectProfile: (id: string) => void;
  onSelectFlow: (id: string) => void;
  onDelete: () => void;
  busy: boolean;
  status: string | null;
}

export default function MissionControlView({ email, workspace, integration, profiles, flows, selectedFlow, selectedFlowId, selectedProfileId, selectedProfileName, onSelectProfile, onSelectFlow, onDelete, busy, status }: Props) {
  const hasProfiles = profiles.length > 0;

  return (
    <>
      <section className="hero-panel">
        <p className="muted">Signed in as {email} · Workspace: {workspace.name}</p>
        <h2>Hosted Flow Replay</h2>
        <p>Hermes integration <strong>{integration?.name}</strong> is <strong>{integration?.status}</strong>. Synced Flows appear below with shallow prompts, tool summaries, and final answers.</p>
        <ProfileTabs profiles={profiles} selectedProfileId={selectedProfileId} onSelectProfile={onSelectProfile} />
        <div className="inline-actions"><button className="secondary-btn" type="button" onClick={onDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete Integration'}</button></div>
      </section>

      {!hasProfiles ? (
        <section className="card-grid"><article className="info-card"><h3>No synced Flows yet</h3><p>Run <code>aiflows-connector run</code> beside Hermes. The connector will upload completed Flows for selected profiles.</p></article><article className="info-card"><h3>Status</h3><p>{status ?? `Current status: ${integration?.status}`}</p></article></section>
      ) : (
        <section className="mission-grid">
          <FlowList flows={flows} selectedFlowId={selectedFlowId} selectedProfileName={selectedProfileName} onSelectFlow={onSelectFlow} />
          {selectedFlow ? <FlowReplay flow={selectedFlow} /> : null}
        </section>
      )}
      <p className={`status-text ${status ? 'status-visible' : ''}`}>{status ?? 'Connector heartbeat and ingestion status refresh every few seconds.'}</p>
    </>
  );
}
