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

export async function authenticateConnector(supabase: any, authorizationHeader: string | null): Promise<ConnectorAuthContext> {
  const token = getBearerToken(authorizationHeader);
  const tokenHash = sha256Hex(token);
  const { data, error } = await supabase
    .from('connector_tokens')
    .select('workspace_id, integration_id, revoked_at, integrations!inner(id, status)')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ConnectorAuthError('Connector token is invalid or revoked.');
  const integration = Array.isArray(data.integrations) ? data.integrations[0] : data.integrations;
  if (!integration || integration.status === 'revoked') throw new ConnectorAuthError('Integration was deleted or revoked.', 404);

  await supabase.from('connector_tokens').update({ last_used_at: new Date().toISOString() }).eq('token_hash', tokenHash);

  return { workspaceId: data.workspace_id, integrationId: data.integration_id, tokenHash };
}
