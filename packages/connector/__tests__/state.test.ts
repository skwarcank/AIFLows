import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getConnectorStatePath, readConnectorState, writeConnectorState } from '../src/state';

describe('connector state', () => {
  let homeDir: string | null = null;

  afterEach(async () => {
    if (homeDir) {
      await rm(homeDir, { recursive: true, force: true });
      homeDir = null;
    }
  });

  it('stores connector state under ~/.aiflows/connector.json', async () => {
    homeDir = await mkdtemp(join(tmpdir(), 'aiflows-connector-'));
    const path = await writeConnectorState(
      {
        apiBaseUrl: 'http://localhost:3000',
        connectorToken: 'secret-token',
        integrationId: 'integration-1',
        workspaceId: 'workspace-1',
        integrationName: 'My Hermes',
        provider: 'hermes',
        pairedAt: '2026-06-27T12:00:00.000Z',
      },
      homeDir,
    );

    expect(path).toBe(getConnectorStatePath(homeDir));
    const state = await readConnectorState(homeDir);
    expect(state?.connectorToken).toBe('secret-token');
    expect(state?.integrationId).toBe('integration-1');
  });

  it('returns null when local state does not exist yet', async () => {
    homeDir = await mkdtemp(join(tmpdir(), 'aiflows-connector-'));
    await rm(homeDir, { recursive: true, force: true });
    expect(await readConnectorState(homeDir)).toBeNull();
  });
});
