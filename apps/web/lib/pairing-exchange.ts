import { randomUUID } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import { sha256Hex } from './pairing';

export interface PairingExchangeResult {
  connectorToken: string;
  integrationId: string;
  workspaceId: string;
  integrationName: string;
  provider: string;
  status: string;
}

export class PairingExchangeError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'PairingExchangeError';
    this.statusCode = statusCode;
  }
}

interface PairingTokenRow {
  id: string;
  workspace_id: string;
  integration_id: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
}

interface IntegrationRow {
  id: string;
  workspace_id: string;
  provider: string;
  name: string;
  status: string;
}

export async function exchangePairingToken(
  supabase: SupabaseClient<any, 'public', any>,
  pairingToken: string,
): Promise<PairingExchangeResult> {
  const normalizedToken = pairingToken.trim();
  if (!normalizedToken) {
    throw new PairingExchangeError('Missing pairing token. Re-run the connect command with --token <value>.', 400);
  }

  const pairingHash = sha256Hex(normalizedToken);
  const nowIso = new Date().toISOString();

  const { data: pairingRow, error: pairingError } = await supabase
    .from('pairing_tokens')
    .select('id, workspace_id, integration_id, expires_at, used_at, revoked_at')
    .eq('token_hash', pairingHash)
    .maybeSingle<PairingTokenRow>();

  if (pairingError) {
    throw new PairingExchangeError(pairingError.message, 500);
  }

  if (!pairingRow) {
    throw new PairingExchangeError('Pairing token not found. Generate a fresh command in Hosted AIFlows and run it again.', 404);
  }

  if (pairingRow.revoked_at) {
    throw new PairingExchangeError('This pairing token was revoked. Generate a fresh command in Hosted AIFlows and re-run connect.', 409);
  }

  if (pairingRow.used_at) {
    throw new PairingExchangeError('This pairing token was already used. Generate a fresh command in Hosted AIFlows and re-run connect.', 409);
  }

  if (pairingRow.expires_at <= nowIso) {
    throw new PairingExchangeError('This pairing token expired. Generate a fresh command in Hosted AIFlows and re-run connect.', 410);
  }

  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id, workspace_id, provider, name, status')
    .eq('id', pairingRow.integration_id)
    .maybeSingle<IntegrationRow>();

  if (integrationError) {
    throw new PairingExchangeError(integrationError.message, 500);
  }

  if (!integration) {
    throw new PairingExchangeError('Integration was deleted. Re-open Hosted AIFlows and create a new Hermes Integration.', 404);
  }

  if (integration.status === 'revoked') {
    throw new PairingExchangeError('Integration was revoked. Create a new Hermes Integration in Hosted AIFlows and re-run connect.', 409);
  }

  if (integration.status === 'paused') {
    throw new PairingExchangeError('Integration is paused. Re-enable or recreate it in Hosted AIFlows, then re-run connect.', 409);
  }

  if (integration.workspace_id !== pairingRow.workspace_id) {
    throw new PairingExchangeError('Pairing token does not match the target workspace.', 409);
  }

  const connectorToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const connectorHash = sha256Hex(connectorToken);
  const connectorPrefix = connectorToken.slice(0, 8);
  const connectorExternalId = `connector-${randomUUID()}`;

  const { error: revokeTokensError } = await supabase
    .from('connector_tokens')
    .update({ revoked_at: nowIso })
    .eq('integration_id', integration.id)
    .is('revoked_at', null);

  if (revokeTokensError) {
    throw new PairingExchangeError(revokeTokensError.message, 500);
  }

  const { error: createConnectorError } = await supabase.from('connector_tokens').insert({
    workspace_id: integration.workspace_id,
    integration_id: integration.id,
    token_hash: connectorHash,
    token_prefix: connectorPrefix,
    last_used_at: nowIso,
  });

  if (createConnectorError) {
    throw new PairingExchangeError(createConnectorError.message, 500);
  }

  const nextStatus = integration.status === 'active' ? 'active' : 'active';
  const { error: updateIntegrationError } = await supabase
    .from('integrations')
    .update({
      status: nextStatus,
      external_id: connectorExternalId,
      last_synced_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', integration.id);

  if (updateIntegrationError) {
    throw new PairingExchangeError(updateIntegrationError.message, 500);
  }

  const { error: markUsedError } = await supabase
    .from('pairing_tokens')
    .update({ used_at: nowIso })
    .eq('id', pairingRow.id)
    .is('used_at', null)
    .is('revoked_at', null);

  if (markUsedError) {
    throw new PairingExchangeError(markUsedError.message, 500);
  }

  return {
    connectorToken,
    integrationId: integration.id,
    workspaceId: integration.workspace_id,
    integrationName: integration.name,
    provider: integration.provider,
    status: nextStatus,
  };
}
