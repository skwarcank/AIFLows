import SignOutButton from '@/components/sign-out-button';

interface Props {
  email: string;
}

export default function AppShell({ email }: Props) {
  return (
    <div className="mission-control-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h1>Welcome back</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="hero-panel">
        <p className="muted">Signed in as {email}</p>
        <h2>No Integrations yet</h2>
        <p>
          This is the first SaaS shell. Issue 003 will turn this into guided Hermes onboarding.
        </p>
      </section>

      <section className="card-grid">
        <article className="info-card">
          <h3>What happens next?</h3>
          <p>Create your first Hermes Integration, then run the Connector near Hermes.</p>
        </article>
        <article className="info-card">
          <h3>Current scope</h3>
          <p>Email/password auth, GitHub OAuth prep, and an authenticated app shell.</p>
        </article>
      </section>
    </div>
  );
}
