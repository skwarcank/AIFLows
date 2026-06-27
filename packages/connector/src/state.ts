import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface SelectedHermesProfile {
  id: string;
  label: string;
  dbPath: string;
  profileType: 'default' | 'named';
}

export interface FailedUpload {
  flowExternalId: string;
  profileId: string;
  attempts: number;
  lastError: string;
  updatedAt: string;
}

export interface ConnectorState {
  apiBaseUrl: string;
  connectorToken: string;
  integrationId: string;
  workspaceId: string;
  integrationName: string;
  provider: string;
  pairedAt: string;
  hermesHome?: string;
  selectedProfiles?: SelectedHermesProfile[];
  syncRecentHistory?: boolean;
  syncedFlowIds?: string[];
  failedUploads?: FailedUpload[];
  lastHeartbeatAt?: string;
  lastSyncAt?: string;
}

export function getConnectorStatePath(customHomeDir = homedir()): string {
  return join(customHomeDir, '.aiflows', 'connector.json');
}

export async function readConnectorState(customHomeDir?: string): Promise<ConnectorState | null> {
  const path = getConnectorStatePath(customHomeDir);

  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as ConnectorState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function writeConnectorState(state: ConnectorState, customHomeDir?: string): Promise<string> {
  const path = getConnectorStatePath(customHomeDir);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return path;
}

export function markFlowSynced(state: ConnectorState, flowExternalId: string): ConnectorState {
  const existing = new Set(state.syncedFlowIds ?? []);
  existing.add(flowExternalId);
  return { ...state, syncedFlowIds: [...existing].sort(), lastSyncAt: new Date().toISOString() };
}

export function recordFailedUpload(state: ConnectorState, flowExternalId: string, profileId: string, error: string): ConnectorState {
  const failures = [...(state.failedUploads ?? [])];
  const current = failures.find((item) => item.flowExternalId === flowExternalId);
  if (current) {
    current.attempts += 1;
    current.lastError = error;
    current.updatedAt = new Date().toISOString();
  } else {
    failures.push({ flowExternalId, profileId, attempts: 1, lastError: error, updatedAt: new Date().toISOString() });
  }
  return { ...state, failedUploads: failures };
}

export function clearFailedUpload(state: ConnectorState, flowExternalId: string): ConnectorState {
  return { ...state, failedUploads: (state.failedUploads ?? []).filter((item) => item.flowExternalId !== flowExternalId) };
}
