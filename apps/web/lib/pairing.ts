import { createHash, randomBytes } from 'node:crypto';

const PAIRING_TOKEN_BYTES = 24;
const PAIRING_TOKEN_TTL_MINUTES = 15;

export interface PairingSecret {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
  expiresAt: string;
}

export function createPairingSecret(now = new Date()): PairingSecret {
  const token = randomBytes(PAIRING_TOKEN_BYTES).toString('hex');
  const tokenHash = sha256Hex(token);
  const tokenPrefix = token.slice(0, 8);
  const expiresAt = new Date(now.getTime() + PAIRING_TOKEN_TTL_MINUTES * 60_000).toISOString();

  return { token, tokenHash, tokenPrefix, expiresAt };
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function buildConnectorCommand(token: string): string {
  return `npx aiflows-connector connect --token ${token}`;
}

export function getPairingTokenTtlMinutes(): number {
  return PAIRING_TOKEN_TTL_MINUTES;
}
