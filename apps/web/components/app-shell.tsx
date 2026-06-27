import SignOutButton from '@/components/sign-out-button';
import type { IntegrationRecord } from '@/lib/app-state';

interface Props {
  email: string;
  workspaceName: string;
  integration: IntegrationRecord | null;
}

export default function AppShell({ email, workspaceName, integration }: Props) {
  const hasIntegration = Boolean(integration);

  return (
    <div className="mission-control-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h1>{hasIntegration ? 'Welcome back' : 'Set up your first Hermes Integration'}</h1>
        </div>
        <SignOutButton />
      </header>

      {hasIntegration ? (
        <>
          <section className="hero-panel">
            <p className="muted">
              Signed in as {email} · Workspace: {workspaceName}
            </p>
            <h2>Mission Control is ready for hosted flow replay</h2>
            <p>
              Hermes integration <strong>{integration?.name}</strong> is connected. The next issues wire live ingestion,
              replay, and status details into this hosted dashboard.
            </p>
          </section>

          <section className="card-grid">
            <article className="info-card">
              <h3>Connected integration</h3>
              <p>
                Provider: {integration?.provider} · Status: {integration?.status}
              </p>
            </article>
            <article className="info-card">
              <h3>Current scope</h3>
              <p>The onboarding gate is complete. Next up is pairing, connector sync, and hosted Mission Control data.</p>
            </article>
          </section>
        </>
      ) : (
        <>
          <section className="hero-panel">
            <p className="muted">
              Signed in as {email} · Workspace: {workspaceName}
            </p>
            <h2>Hermes is the only integration in the SaaS onboarding flow</h2>
            <p>
              Your default workspace is ready. Next, add a Hermes Integration and run the connector next to your Hermes
              installation. No coming-soon adapters are shown here on purpose.
            </p>
          </section>

          <section className="card-grid">
            <article className="info-card">
              <h3>Guided path</h3>
              <ol className="steps-list">
                <li>Create a Hermes Integration for this workspace.</li>
                <li>Pair the local connector using the issued secret.</li>
                <li>Watch the first synced Flows appear in Mission Control.</li>
              </ol>
            </article>
            <article className="info-card">
              <h3>Why you are seeing this</h3>
              <p>
                This workspace has no integrations yet, so AIFlows keeps you in Hermes-only onboarding instead of an empty
                multi-adapter dashboard.
              </p>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
