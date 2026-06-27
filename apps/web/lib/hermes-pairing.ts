import { randomUUID } from 'node:crypto';

import type { SupabaseClient, User } from '@supabase/supabase-js';

import type { IntegrationRecord, WorkspaceRecord, WorkspaceStore } from './app-state';
import { getAppUrl } from './env';
import { buildConnectorCommand, createPairingSecret, getPairingTokenTtlMinutes } from './pairing';

export interface PairingSession {
  integration: IntegrationRecord;
  workspace: WorkspaceRecord;
  command: string;
  token: string;
  expiresAt: string;
  ttlMinutes: number;
}

export interface HermesPairingStore extends WorkspaceStore {
  revokeOpenPairingTokens(integrationId: string): Promise<void>;
  createPairingToken(input: {
    workspaceId: string;
    integrationId: string;
    tokenHash: string;
    tokenPrefix: string;
    expiresAt: string;
  }): Promise<void>;
  createIntegration(input: { workspaceId: string; name: string }): Promise<IntegrationRecord>;
}

export async function createHermesPairingSession(store: HermesPairingStore, user: Pick<User, 'id' | 'email'>): Promise<PairingSession> {
  let workspace = await store.findWorkspaceByOwner(user.id);

  if (!workspace) {
    workspace = await store.createWorkspace({ userId: user.id, email: user.email ?? undefined });
  }

  let integration = await store.findFirstIntegration(workspace.id);

  if (!integration) {
    integration = await store.createIntegration({
      workspaceId: workspace.id,
      name: buildDefaultIntegrationName(workspace.name),
    });
  }

  if (integration.provider !== 'hermes') {
    throw new Error('Only Hermes integrations are supported in this onboarding flow.');
  }

  if (integration.status !== 'pending' && integration.status !== 'active') {
    throw new Error(`Unsupported integration status: ${integration.status}`);
  }

  if (integration.status === 'active') {
    throw new Error('This Hermes integration is already active.');
  }

  await store.revokeOpenPairingTokens(integration.id);

  const secret = createPairingSecret();
  await store.createPairingToken({
    workspaceId: workspace.id,
    integrationId: integration.id,
    tokenHash: secret.tokenHash,
    tokenPrefix: secret.tokenPrefix,
    expiresAt: secret.expiresAt,
  });

  return {
    integration,
    workspace,
    token: secret.token,
    command: buildConnectorCommand(secret.token, getAppUrl()),
    expiresAt: secret.expiresAt,
    ttlMinutes: getPairingTokenTtlMinutes(),
  };
}

export function buildDefaultIntegrationName(workspaceName: string): string {
  return `${workspaceName} Hermes`;
}

export function createSupabaseHermesPairingStore(supabase: SupabaseClient<any, 'public', any>, workspaceStore: WorkspaceStore): HermesPairingStore {
  return {
    ...workspaceStore,

    async createIntegration({ workspaceId, name }) {
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          workspace_id: workspaceId,
          provider: 'hermes',
          external_id: `pending-${randomUUID()}`,
          name,
          status: 'pending',
        })
        .select('id, provider, name, status')
        .single();

      if (error) throw error;
      return data;
    },

    async revokeOpenPairingTokens(integrationId) {
      const { error } = await supabase
        .from('pairing_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('integration_id', integrationId)
        .is('used_at', null)
        .is('revoked_at', null);

      if (error) throw error;
    },

    async createPairingToken({ workspaceId, integrationId, tokenHash, tokenPrefix, expiresAt }) {
      const { error } = await supabase.from('pairing_tokens').insert({
        workspace_id: workspaceId,
        integration_id: integrationId,
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        expires_at: expiresAt,
      });

      if (error) throw error;
    },
  };
}
