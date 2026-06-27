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

export class ConnectorApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ConnectorApiError';
    this.statusCode = statusCode;
  }
}

export function resolveApiBaseUrl(explicit?: string): string {
  const raw = explicit || process.env.AIFLOWS_API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export async function pairConnector(input: {
  token: string;
  apiBaseUrl?: string;
  connectorName?: string;
}): Promise<{ apiBaseUrl: string; response: PairConnectorResponse }> {
  const apiBaseUrl = resolveApiBaseUrl(input.apiBaseUrl);
  const response = await fetch(`${apiBaseUrl}/api/connectors/pair`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      token: input.token,
      connectorName: input.connectorName ?? 'aiflows-connector',
    }),
  });

  const body = (await response.json().catch(() => ({ error: 'Invalid JSON response from Hosted AIFlows.' }))) as
    | PairConnectorResponse
    | { error?: string };

  if (!response.ok) {
    throw new ConnectorApiError((body as { error?: string }).error ?? 'Pairing failed.', response.status);
  }

  return { apiBaseUrl, response: body as PairConnectorResponse };
}
