import { describe, expect, it, vi, afterEach } from 'vitest';

import { ConnectorApiError, pairConnector, resolveApiBaseUrl } from '../src/api';

describe('connector api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.AIFLOWS_API_BASE_URL;
  });

  it('resolves api base url from explicit input or env', () => {
    process.env.AIFLOWS_API_BASE_URL = 'https://example.com/';
    expect(resolveApiBaseUrl()).toBe('https://example.com');
    expect(resolveApiBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });

  it('pairs successfully against the hosted endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          connectorToken: 'connector-secret',
          integration: {
            id: 'integration-1',
            workspaceId: 'workspace-1',
            name: 'My Hermes',
            provider: 'hermes',
            status: 'active',
          },
        }),
      })),
    );

    const result = await pairConnector({ token: 'pairing-token', apiBaseUrl: 'http://localhost:3000/' });
    expect(result.apiBaseUrl).toBe('http://localhost:3000');
    expect(result.response.connectorToken).toBe('connector-secret');
  });

  it('surfaces actionable hosted errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Integration was revoked.' }),
      })),
    );

    await expect(pairConnector({ token: 'pairing-token', apiBaseUrl: 'http://localhost:3000' })).rejects.toEqual(
      new ConnectorApiError('Integration was revoked.', 409),
    );
  });
});
