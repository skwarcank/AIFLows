"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function HermesPairingCard({ email, workspace, integration: initialIntegration }: Props) {
  const router = useRouter();
  const [integration, setIntegration] = useState<IntegrationRecord | null>(initialIntegration);
  const [pairing, setPairing] = useState<PairingPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPending = integration?.status === 'pending';
  const isActive = integration?.status === 'active';

  useEffect(() => {
    setIntegration(initialIntegration);
  }, [initialIntegration]);

  useEffect(() => {
    if (!isPending || !integration?.id) return;

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/integrations/${integration.id}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) return;

        const data = (await response.json()) as { integration: IntegrationRecord };
        setIntegration(data.integration);

        if (data.integration.status !== 'pending') {
          setStatus(`Integration status: ${data.integration.status}`);
          window.clearInterval(timer);
          router.refresh();
        }
      } catch {
        // keep polling quietly; the UI already shows the last known state
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [integration?.id, isPending, router]);

  const expiryLabel = useMemo(() => {
    if (!pairing?.expiresAt) return null;
    return new Date(pairing.expiresAt).toLocaleString();
  }, [pairing?.expiresAt]);

  async function handleCreateOrRotate() {
    setBusy(true);
    setCopied(false);
    setStatus(null);

    try {
      const response = await fetch('/api/integrations/hermes/pair', {
        method: 'POST',
      });
      const data = (await response.json()) as {
        error?: string;
        integration?: IntegrationRecord;
        workspace?: WorkspaceRecord;
        pairing?: PairingPayload;
      };

      if (!response.ok || !data.integration || !data.pairing) {
        throw new Error(data.error ?? 'Could not create the Hermes pairing command.');
      }

      setIntegration(data.integration);
      setPairing(data.pairing);
      setStatus(`Pairing command ready. Token expires in ${data.pairing.ttlMinutes} minutes.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the Hermes pairing command.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!pairing?.command) return;
    await navigator.clipboard.writeText(pairing.command);
    setCopied(true);
  }

  if (isActive) {
    return (
      <>
        <section className="hero-panel">
          <p className="muted">
            Signed in as {email} · Workspace: {workspace.name}
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
            <p>The pairing gate is complete. Next up is connector sync and hosted Mission Control data.</p>
          </article>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="hero-panel">
        <p className="muted">
          Signed in as {email} · Workspace: {workspace.name}
        </p>
        <h2>{isPending ? 'Run this connector command next to Hermes' : 'Create your Hermes Integration'}</h2>
        <p>
          Run the connector on the same machine or VPS as Hermes. AIFlows stays hosted; only the lightweight connector
          sits beside your Hermes install.
        </p>
      </section>

      <section className="card-grid">
        <article className="info-card">
          <h3>{isPending ? 'Pairing command' : 'Hermes onboarding'}</h3>
          {pairing ? (
            <>
              <pre className="command-block"><code>{pairing.command}</code></pre>
              <p className="muted">Token expires at {expiryLabel}. It is shown once in this command and stored hashed on the server.</p>
              <div className="inline-actions">
                <button className="primary-btn" type="button" onClick={handleCopy}>
                  {copied ? 'Copied' : 'Copy command'}
                </button>
                <button className="secondary-btn" type="button" onClick={handleCreateOrRotate} disabled={busy}>
                  {busy ? 'Rotating…' : 'Generate new token'}
                </button>
              </div>
            </>
          ) : (
            <>
              <ol className="steps-list">
                <li>Create a pending Hermes integration for this workspace.</li>
                <li>Copy the one-command connector pairing command.</li>
                <li>Run it on the same machine or VPS as Hermes.</li>
              </ol>
              <div className="inline-actions">
                <button className="primary-btn" type="button" onClick={handleCreateOrRotate} disabled={busy}>
                  {busy ? 'Creating…' : 'Create Hermes Integration'}
                </button>
              </div>
            </>
          )}
        </article>

        <article className="info-card">
          <h3>Status</h3>
          <p>
            Integration status: <strong>{integration?.status ?? 'not created yet'}</strong>
          </p>
          <p>
            {isPending
              ? 'This page polls the integration status every few seconds while you run the command.'
              : 'No integration exists yet. Create one to get a one-time pairing command.'}
          </p>
        </article>
      </section>

      <p className={`status-text ${status ? 'status-visible' : ''}`}>
        {status ?? 'The pairing token is short-lived and should be used immediately on the Hermes machine.'}
      </p>
    </>
  );
}
