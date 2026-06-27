import type { FlowIngestionRequest } from '@aiflows/flow-core';

export interface PairConnectorResponse {
  connectorToken: string;
  integration: {
    id: string;
    workspaceId: string;
    name: string;
    provider: string;
    status: string;
  };
}

export interface PairConnectorInput {
  token: string;
  apiBaseUrl?: string;
  connectorName?: string;
}

export class ConnectorApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function resolveApiBaseUrl(input?: string): string {
  return (input || process.env.AIFLOWS_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function postJson<T>(apiBaseUrl: string, path: string, body: unknown, connectorToken?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(connectorToken ? { authorization: `Bearer ${connectorToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new ConnectorApiError(data.error ?? `Request failed with HTTP ${response.status}`, response.status);
  }
  return data as T;
}

export async function pairConnector(input: PairConnectorInput): Promise<{ apiBaseUrl: string; response: PairConnectorResponse }> {
  const apiBaseUrl = resolveApiBaseUrl(input.apiBaseUrl);
  const response = await postJson<PairConnectorResponse>(apiBaseUrl, '/api/connectors/pair', {
    token: input.token,
    connectorName: input.connectorName ?? 'aiflows-connector',
  });
  return { apiBaseUrl, response };
}

export async function sendHeartbeat(input: { apiBaseUrl: string; connectorToken: string; status?: 'connected' | 'syncing' | 'error'; message?: string }): Promise<{ integration: { id: string; status: string } }> {
  return postJson(input.apiBaseUrl, '/api/connectors/heartbeat', { status: input.status ?? 'connected', message: input.message }, input.connectorToken);
}

export async function uploadFlows(input: { apiBaseUrl: string; connectorToken: string; payload: FlowIngestionRequest }): Promise<{ accepted: number }> {
  return postJson(input.apiBaseUrl, '/api/connectors/ingest', input.payload, input.connectorToken);
}
