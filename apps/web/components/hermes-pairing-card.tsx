"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { IntegrationRecord, WorkspaceRecord } from '@/lib/app-state';
import type { MissionControlData, MissionFlow } from '@/lib/mission-control';

interface PairingPayload {
  command: string;
  expiresAt: string;
  ttlMinutes: number;
}

interface Props {
  email: string;
  workspace: WorkspaceRecord;
  integration: IntegrationRecord | null;
  missionControl: MissionControlData | null;
}

export default function HermesPairingCard({ email, workspace, integration: initialIntegration, missionControl }: Props) {
  const router = useRouter();
  const [integration, setIntegration] = useState<IntegrationRecord | null>(initialIntegration);
  const [pairing, setPairing] = useState<PairingPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(missionControl?.flows[0]?.id ?? null);

  const isPending = integration?.status === 'pending';
  const isReady = Boolean(integration && integration.status !== 'pending' && integration.status !== 'revoked');
  const selectedFlow = missionControl?.flows.find((flow) => flow.id === selectedFlowId) ?? missionControl?.flows[0] ?? null;

  useEffect(() => {
    setIntegration(initialIntegration);
  }, [initialIntegration]);

  useEffect(() => {
    if (!integration?.id) return;

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/integrations/${integration.id}`, { method: 'GET', cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { integration: IntegrationRecord };
        setIntegration(data.integration);
        if (data.integration.status !== integration.status) {
          setStatus(`Integration status: ${data.integration.status}`);
          router.refresh();
        }
      } catch {
        // keep polling quietly; the UI already shows the last known state
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [integration?.id, integration?.status, router]);

  const expiryLabel = useMemo(() => {
    if (!pairing?.expiresAt) return null;
    return new Date(pairing.expiresAt).toLocaleString();
  }, [pairing?.expiresAt]);

  async function handleCreateOrRotate() {
    setBusy(true);
    setCopied(false);
    setStatus(null);

    try {
      const response = await fetch('/api/integrations/hermes/pair', { method: 'POST' });
      const data = (await response.json()) as { error?: string; integration?: IntegrationRecord; workspace?: WorkspaceRecord; pairing?: PairingPayload };
      if (!response.ok || !data.integration || !data.pairing) throw new Error(data.error ?? 'Could not create the Hermes pairing command.');
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

  async function handleDeleteIntegration() {
    if (!integration?.id) return;
    const confirmed = window.confirm('Delete this Hermes Integration and all synced Flows? This cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/integrations/${integration.id}`, { method: 'DELETE' });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not delete integration.');
      setIntegration(null);
      setStatus('Integration deleted. Connector credentials are revoked.');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not delete integration.');
    } finally {
      setBusy(false);
    }
  }

  if (isReady) {
    return <MissionControlView email={email} workspace={workspace} integration={integration} data={missionControl} selectedFlow={selectedFlow} selectedFlowId={selectedFlowId} setSelectedFlowId={setSelectedFlowId} onDelete={handleDeleteIntegration} busy={busy} status={status} />;
  }

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
                <button className="primary-btn" type="button" onClick={handleCopy}>{copied ? 'Copied' : 'Copy command'}</button>
                <button className="secondary-btn" type="button" onClick={handleCreateOrRotate} disabled={busy}>{busy ? 'Rotating…' : 'Generate new token'}</button>
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
                <button className="primary-btn" type="button" onClick={handleCreateOrRotate} disabled={busy}>{busy ? 'Creating…' : 'Create Hermes Integration'}</button>
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

function MissionControlView({ email, workspace, integration, data, selectedFlow, selectedFlowId, setSelectedFlowId, onDelete, busy, status }: { email: string; workspace: WorkspaceRecord; integration: IntegrationRecord | null; data: MissionControlData | null; selectedFlow: MissionFlow | null; selectedFlowId: string | null; setSelectedFlowId: (id: string) => void; onDelete: () => void; busy: boolean; status: string | null }) {
  return (
    <>
      <section className="hero-panel">
        <p className="muted">Signed in as {email} · Workspace: {workspace.name}</p>
        <h2>Hosted Flow Replay</h2>
        <p>Hermes integration <strong>{integration?.name}</strong> is <strong>{integration?.status}</strong>. Synced Flows appear below with shallow prompts, tool summaries, and final answers.</p>
        <div className="inline-actions"><button className="secondary-btn" type="button" onClick={onDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete Integration'}</button></div>
      </section>

      {!data || data.flows.length === 0 ? (
        <section className="card-grid"><article className="info-card"><h3>No synced Flows yet</h3><p>Run <code>aiflows-connector run</code> beside Hermes. The connector will upload completed Flows for selected profiles.</p></article><article className="info-card"><h3>Status</h3><p>{status ?? `Current status: ${integration?.status}`}</p></article></section>
      ) : (
        <section className="mission-grid">
          <article className="info-card flow-list-card">
            <h3>Flows</h3>
            <div className="flow-list">
              {data.flows.map((flow) => (
                <button key={flow.id} className={`flow-list-item ${flow.id === selectedFlowId ? 'flow-list-item-active' : ''}`} type="button" onClick={() => setSelectedFlowId(flow.id)}>
                  <strong>{flow.title}</strong>
                  <span>{flow.finishedAt ? new Date(flow.finishedAt).toLocaleString() : 'No finish time'} · {flow.steps.length} steps</span>
                </button>
              ))}
            </div>
          </article>
          {selectedFlow ? <FlowReplay flow={selectedFlow} /> : null}
        </section>
      )}
      <p className={`status-text ${status ? 'status-visible' : ''}`}>{status ?? 'Connector heartbeat and ingestion status refresh every few seconds.'}</p>
    </>
  );
}

function FlowReplay({ flow }: { flow: MissionFlow }) {
  return (
    <article className="info-card replay-card">
      <p className="eyebrow">Flow Replay</p>
      <h3>{flow.title}</h3>
      <p className="muted">{flow.model ?? 'unknown model'} · {flow.source ?? 'unknown source'} · {flow.status}</p>
      <div className="replay-section"><h4>Prompt</h4><p>{flow.prompt}</p></div>
      <div className="timeline">
        {flow.steps.map((step) => (
          <div className="timeline-step" key={step.id}>
            <span className="timeline-dot" />
            <div><strong>{step.title}</strong><p>{step.description ?? 'No shallow description stored.'}</p>{step.toolName ? <p className="muted">Tool: {step.toolName}</p> : null}</div>
          </div>
        ))}
      </div>
      {flow.finalAnswer ? <div className="replay-section"><h4>Final answer</h4><p>{flow.finalAnswer}</p></div> : null}
    </article>
  );
}
