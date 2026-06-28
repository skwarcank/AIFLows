import type { IntegrationRecord, WorkspaceRecord } from '@/lib/app-state';

interface PairingPayload {
  command: string;
  expiresAt: string;
  ttlMinutes: number;
}

interface Props {
  email: string;
  workspace: WorkspaceRecord;
  integration: IntegrationRecord | null;
  pairing: PairingPayload | null;
  busy: boolean;
  copied: boolean;
  status: string | null;
  expiryLabel: string | null;
  onCreateOrRotate: () => void;
  onCopy: () => void;
}

export default function HermesIntegrationOnboarding({ email, workspace, integration, pairing, busy, copied, status, expiryLabel, onCreateOrRotate, onCopy }: Props) {
  const isPending = integration?.status === 'pending';

  return (
    <>
      <section className="hero-panel">
        <p className="muted">Signed in as {email} · Workspace: {workspace.name}</p>
        <h2>{isPending ? 'Run this connector command next to Hermes' : 'Create your Hermes Integration'}</h2>
        <p>Run the connector on the same machine or VPS as Hermes. AIFlows stays hosted; only the lightweight connector sits beside your Hermes install.</p>
      </section>

      <section className="card-grid">
        <article className="info-card">
          <h3>{isPending ? 'Pairing command' : 'Hermes onboarding'}</h3>
          {pairing ? (
            <>
              <pre className="command-block"><code>{pairing.command}</code></pre>
              <p className="muted">Token expires at {expiryLabel}. It is shown once in this command and stored hashed on the server.</p>
              <div className="inline-actions">
                <button className="primary-btn" type="button" onClick={onCopy}>{copied ? 'Copied' : 'Copy command'}</button>
                <button className="secondary-btn" type="button" onClick={onCreateOrRotate} disabled={busy}>{busy ? 'Rotating…' : 'Generate new token'}</button>
              </div>
            </>
          ) : (
            <>
              <ol className="steps-list">
                <li>Create a pending Hermes integration for this workspace.</li>
                <li>Copy the one-command curl connector pairing command.</li>
                <li>Run it on the same machine or VPS as Hermes.</li>
              </ol>
              <div className="inline-actions">
                <button className="primary-btn" type="button" onClick={onCreateOrRotate} disabled={busy}>{busy ? 'Creating…' : 'Create Hermes Integration'}</button>
              </div>
            </>
          )}
        </article>

        <article className="info-card">
          <h3>Status</h3>
          <p>Integration status: <strong>{integration?.status ?? 'not created yet'}</strong></p>
          <p>{isPending ? 'This page polls the integration status every few seconds while you run the command.' : 'No integration exists yet. Create one to get a one-time pairing command.'}</p>
        </article>
      </section>

      <p className={`status-text ${status ? 'status-visible' : ''}`}>{status ?? 'The pairing token is short-lived and should be used immediately on the Hermes machine.'}</p>
    </>
  );
}
