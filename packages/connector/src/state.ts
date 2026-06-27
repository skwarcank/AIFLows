import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface ConnectorState {
  apiBaseUrl: string;
  connectorToken: string;
  integrationId: string;
  workspaceId: string;
  integrationName: string;
  provider: string;
  pairedAt: string;
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
