"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import HermesIntegrationOnboarding from '@/components/hermes-integration-onboarding';
import MissionControlView from '@/components/mission-control-view';
import type { IntegrationRecord, WorkspaceRecord } from '@/lib/app-state';
import { formatUtcDateTime } from '@/lib/date-format';
import type { MissionControlData } from '@/lib/mission-control';
import { chooseInitialProfileId, getFlowsForProfile } from '@/lib/profile-selection';

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
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => chooseInitialProfileId(missionControl?.profiles ?? []));
  const selectedProfileFlows = useMemo(() => getFlowsForProfile(missionControl?.flows ?? [], selectedProfileId), [missionControl?.flows, selectedProfileId]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(() => selectedProfileFlows[0]?.id ?? null);

  const isReady = Boolean(integration && integration.status !== 'pending' && integration.status !== 'revoked');
  const selectedFlow = selectedProfileFlows.find((flow) => flow.id === selectedFlowId) ?? selectedProfileFlows[0] ?? null;
  const selectedProfileName = missionControl?.profiles.find((profile) => profile.id === selectedProfileId)?.name ?? null;

  useEffect(() => {
    setIntegration(initialIntegration);
  }, [initialIntegration]);

  useEffect(() => {
    const profiles = missionControl?.profiles ?? [];
    if (profiles.length === 0) {
      setSelectedProfileId(null);
      setSelectedFlowId(null);
      return;
    }

    if (!selectedProfileId || !profiles.some((profile) => profile.id === selectedProfileId)) {
      const nextProfileId = chooseInitialProfileId(profiles);
      setSelectedProfileId(nextProfileId);
      setSelectedFlowId(getFlowsForProfile(missionControl?.flows ?? [], nextProfileId)[0]?.id ?? null);
    }
  }, [missionControl?.profiles, missionControl?.flows, selectedProfileId]);

  useEffect(() => {
    if (!selectedProfileId) return;
    if (selectedProfileFlows.some((flow) => flow.id === selectedFlowId)) return;
    setSelectedFlowId(selectedProfileFlows[0]?.id ?? null);
  }, [selectedFlowId, selectedProfileFlows, selectedProfileId]);

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
        // Keep polling quietly; the UI already shows the last known state.
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [integration?.id, integration?.status, router]);

  const expiryLabel = useMemo(() => {
    if (!pairing?.expiresAt) return null;
    return formatUtcDateTime(pairing.expiresAt);
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

  function handleSelectProfile(profileId: string) {
    setSelectedProfileId(profileId);
    setSelectedFlowId(getFlowsForProfile(missionControl?.flows ?? [], profileId)[0]?.id ?? null);
  }

  if (isReady) {
    return (
      <MissionControlView
        email={email}
        workspace={workspace}
        integration={integration}
        profiles={missionControl?.profiles ?? []}
        flows={selectedProfileFlows}
        selectedFlow={selectedFlow}
        selectedFlowId={selectedFlowId}
        selectedProfileId={selectedProfileId}
        selectedProfileName={selectedProfileName}
        onSelectProfile={handleSelectProfile}
        onSelectFlow={setSelectedFlowId}
        onDelete={handleDeleteIntegration}
        busy={busy}
        status={status}
      />
    );
  }

  return (
    <HermesIntegrationOnboarding
      email={email}
      workspace={workspace}
      integration={integration}
      pairing={pairing}
      busy={busy}
      copied={copied}
      status={status}
      expiryLabel={expiryLabel}
      onCreateOrRotate={handleCreateOrRotate}
      onCopy={handleCopy}
    />
  );
}
