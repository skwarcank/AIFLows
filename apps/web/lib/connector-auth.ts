import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, IntegrationStatus } from '@/lib/database.types';
import { sha256Hex } from './pairing';

export interface ConnectorAuthContext {
  workspaceId: string;
  integrationId: string;
  tokenHash: string;
}

export class ConnectorAuthError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
  }
}

export function getBearerToken(header: string | null): string {
  if (!header?.startsWith('Bearer ')) throw new ConnectorAuthError('Missing connector bearer token.');
  const token = header.slice('Bearer '.length).trim();
  if (!token) throw new ConnectorAuthError('Missing connector bearer token.');
  return token;
}

type ConnectorAuthSupabaseClient = Pick<SupabaseClient<Database>, 'from'>;
type ConnectorTokenWithIntegration = {
  workspace_id: string;
  integration_id: string;
  revoked_at: string | null;
  integrations: { id: string; status: IntegrationStatus } | { id: string; status: IntegrationStatus }[] | null;
};

export async function authenticateConnector(supabase: ConnectorAuthSupabaseClient, authorizationHeader: string | null): Promise<ConnectorAuthContext> {
  const token = getBearerToken(authorizationHeader);
  const tokenHash = sha256Hex(token);
  const { data, error } = await supabase
    .from('connector_tokens')
    .select('workspace_id, integration_id, revoked_at, integrations!inner(id, status)')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) throw error;
  const tokenRow = data as unknown as ConnectorTokenWithIntegration | null;
  if (!tokenRow) throw new ConnectorAuthError('Connector token is invalid or revoked.');
  const integration = Array.isArray(tokenRow.integrations) ? tokenRow.integrations[0] : tokenRow.integrations;
  if (!integration || integration.status === 'revoked') throw new ConnectorAuthError('Integration was deleted or revoked.', 404);

  await supabase.from('connector_tokens').update({ last_used_at: new Date().toISOString() }).eq('token_hash', tokenHash);

  return { workspaceId: tokenRow.workspace_id, integrationId: tokenRow.integration_id, tokenHash };
}
