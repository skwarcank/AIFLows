import { describe, expect, it } from 'vitest';

import { exchangePairingToken, PairingExchangeError } from '../lib/pairing-exchange';

function createSupabaseMock(overrides: Partial<Record<string, any>> = {}) {
  return {
    from(table: string) {
      const chain = {
        select() {
          return chain;
        },
        eq() {
          return chain;
        },
        is() {
          return chain;
        },
        async maybeSingle() {
          if (table === 'pairing_tokens') {
            return (
              overrides.pairingResult ?? {
                data: {
                  id: 'pair-1',
                  workspace_id: 'workspace-1',
                  integration_id: 'integration-1',
                  expires_at: '2999-01-01T00:00:00.000Z',
                  used_at: null,
                  revoked_at: null,
                },
                error: null,
              }
            );
          }

          return (
            overrides.integrationResult ?? {
              data: {
                id: 'integration-1',
                workspace_id: 'workspace-1',
                provider: 'hermes',
                name: 'My Hermes',
                status: 'pending',
              },
              error: null,
            }
          );
        },
        update(_payload: Record<string, unknown>) {
          return chain;
        },
        async insert() {
          return { error: null };
        },
        then(resolve: (value: { error: null }) => unknown) {
          return Promise.resolve({ error: null }).then(resolve);
        },
      };

      return chain;
    },
  } as any;
}

describe('pairing exchange', () => {
  it('exchanges a valid pairing token for a connector token', async () => {
    const result = await exchangePairingToken(createSupabaseMock(), 'pairing-token');
    expect(result.workspaceId).toBe('workspace-1');
    expect(result.integrationId).toBe('integration-1');
    expect(result.connectorToken).toMatch(/^[0-9a-f]{64}$/);
    expect(result.status).toBe('active');
  });

  it('rejects an already used pairing token', async () => {
    const supabase = createSupabaseMock({
      pairingResult: {
        data: {
          id: 'pair-1',
          workspace_id: 'workspace-1',
          integration_id: 'integration-1',
          expires_at: '2999-01-01T00:00:00.000Z',
          used_at: '2026-06-27T12:00:00.000Z',
          revoked_at: null,
        },
        error: null,
      },
    });

    await expect(exchangePairingToken(supabase, 'pairing-token')).rejects.toEqual(
      new PairingExchangeError(
        'This pairing token was already used. Generate a fresh command in Hosted AIFlows and re-run connect.',
        409,
      ),
    );
  });

  it('rejects a deleted integration', async () => {
    const supabase = createSupabaseMock({
      integrationResult: {
        data: null,
        error: null,
      },
    });

    await expect(exchangePairingToken(supabase, 'pairing-token')).rejects.toEqual(
      new PairingExchangeError('Integration was deleted. Re-open Hosted AIFlows and create a new Hermes Integration.', 404),
    );
  });
});
