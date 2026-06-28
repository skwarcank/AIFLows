import { describe, expect, it } from 'vitest';

import { authenticateConnector, ConnectorAuthError, getBearerToken } from '../lib/connector-auth';
import { sha256Hex } from '../lib/pairing';

function createAuthSupabaseMock(row: unknown = null) {
  const updates: unknown[] = [];
  return {
    updates,
    from(table: string) {
      const chain = {
        select() { return chain; },
        eq() { return chain; },
        is() { return chain; },
        update(payload: unknown) {
          updates.push({ table, payload });
          return chain;
        },
        async maybeSingle() {
          return { data: row, error: null };
        },
      };
      return chain;
    },
  };
}

describe('connector auth', () => {
  it('requires a bearer token', () => {
    expect(() => getBearerToken(null)).toThrow(new ConnectorAuthError('Missing connector bearer token.'));
    expect(() => getBearerToken('Bearer   ')).toThrow(new ConnectorAuthError('Missing connector bearer token.'));
  });

  it('rejects invalid or revoked connector tokens', async () => {
    await expect(authenticateConnector(createAuthSupabaseMock() as never, 'Bearer missing')).rejects.toEqual(
      new ConnectorAuthError('Connector token is invalid or revoked.'),
    );
  });

  it('rejects connector tokens whose integration was revoked or deleted', async () => {
    const token = 'connector-secret';
    const supabase = createAuthSupabaseMock({
      workspace_id: 'workspace-1',
      integration_id: 'integration-1',
      revoked_at: null,
      integrations: { id: 'integration-1', status: 'revoked' },
    });

    await expect(authenticateConnector(supabase as never, `Bearer ${token}`)).rejects.toEqual(
      new ConnectorAuthError('Integration was deleted or revoked.', 404),
    );
  });

  it('returns workspace context and records last usage for a valid connector token', async () => {
    const token = 'connector-secret';
    const supabase = createAuthSupabaseMock({
      workspace_id: 'workspace-1',
      integration_id: 'integration-1',
      revoked_at: null,
      integrations: { id: 'integration-1', status: 'connected' },
    });

    await expect(authenticateConnector(supabase as never, `Bearer ${token}`)).resolves.toEqual({
      workspaceId: 'workspace-1',
      integrationId: 'integration-1',
      tokenHash: sha256Hex(token),
    });
    expect(supabase.updates).toHaveLength(1);
  });
});
