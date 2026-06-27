import { describe, expect, it } from 'vitest';

import type { HermesPairingStore } from '../lib/hermes-pairing';
import { buildDefaultIntegrationName, createHermesPairingSession } from '../lib/hermes-pairing';

function createStore(overrides: Partial<HermesPairingStore>): HermesPairingStore {
  return {
    findWorkspaceByOwner: async () => ({ id: 'workspace-1', name: 'My Workspace', slug: 'user-1' }),
    createWorkspace: async () => ({ id: 'workspace-1', name: 'My Workspace', slug: 'user-1' }),
    findFirstIntegration: async () => null,
    createIntegration: async () => ({ id: 'integration-1', provider: 'hermes', name: 'My Workspace Hermes', status: 'pending' }),
    revokeOpenPairingTokens: async () => {},
    createPairingToken: async () => {},
    ...overrides,
  };
}

describe('Hermes pairing service', () => {
  it('builds the default integration name from the workspace name', () => {
    expect(buildDefaultIntegrationName('Krzysztof Workspace')).toBe('Krzysztof Workspace Hermes');
  });

  it('creates a pending Hermes integration and pairing token', async () => {
    const calls: string[] = [];
    const store = createStore({
      findWorkspaceByOwner: async () => ({ id: 'workspace-1', name: 'Alpha Workspace', slug: 'user-1' }),
      findFirstIntegration: async () => {
        calls.push('findFirstIntegration');
        return null;
      },
      createIntegration: async ({ workspaceId, name }) => {
        calls.push(`createIntegration:${workspaceId}:${name}`);
        return { id: 'integration-1', provider: 'hermes', name, status: 'pending' };
      },
      revokeOpenPairingTokens: async (integrationId) => {
        calls.push(`revoke:${integrationId}`);
      },
      createPairingToken: async ({ workspaceId, integrationId, tokenHash, tokenPrefix, expiresAt }) => {
        calls.push(`token:${workspaceId}:${integrationId}:${tokenPrefix}:${expiresAt}`);
        expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
      },
    });

    const result = await createHermesPairingSession(store, { id: 'user-1', email: 'krzysztof@example.com' });

    expect(result.integration.status).toBe('pending');
    expect(result.command).toMatch(/^npx aiflows-connector connect --token [0-9a-f]{48}$/);
    expect(calls[0]).toBe('findFirstIntegration');
    expect(calls[1]).toBe('createIntegration:workspace-1:Alpha Workspace Hermes');
    expect(calls[2]).toBe('revoke:integration-1');
    expect(calls[3]).toMatch(/^token:workspace-1:integration-1:[0-9a-f]{8}:/);
  });

  it('reuses an existing pending integration and just rotates the pairing token', async () => {
    const calls: string[] = [];
    const store = createStore({
      findFirstIntegration: async () => ({ id: 'integration-1', provider: 'hermes', name: 'Existing Hermes', status: 'pending' }),
      createIntegration: async () => {
        throw new Error('should not create a second integration');
      },
      revokeOpenPairingTokens: async () => {
        calls.push('revoke');
      },
      createPairingToken: async () => {
        calls.push('token');
      },
    });

    const result = await createHermesPairingSession(store, { id: 'user-1', email: 'user@example.com' });
    expect(result.integration.name).toBe('Existing Hermes');
    expect(calls).toEqual(['revoke', 'token']);
  });

  it('rejects generating a pairing command for an already active integration', async () => {
    const store = createStore({
      findFirstIntegration: async () => ({ id: 'integration-1', provider: 'hermes', name: 'Existing Hermes', status: 'active' }),
    });

    await expect(createHermesPairingSession(store, { id: 'user-1', email: 'user@example.com' })).rejects.toThrow(
      'This Hermes integration is already active.',
    );
  });
});
