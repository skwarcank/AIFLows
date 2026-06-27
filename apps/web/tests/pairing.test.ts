import { describe, expect, it, vi } from 'vitest';

import { buildConnectorCommand, createPairingSecret, getPairingTokenTtlMinutes, sha256Hex } from '../lib/pairing';

describe('pairing helpers', () => {
  it('hashes tokens with sha256 hex output', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('creates a pairing secret with hash, prefix, and expiry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00.000Z'));

    const secret = createPairingSecret();

    expect(secret.token).toMatch(/^[0-9a-f]{48}$/);
    expect(secret.tokenHash).toBe(sha256Hex(secret.token));
    expect(secret.tokenPrefix).toBe(secret.token.slice(0, 8));
    expect(secret.expiresAt).toBe('2026-06-27T12:15:00.000Z');

    vi.useRealTimers();
  });

  it('builds the connector command shown to the user', () => {
    expect(buildConnectorCommand('secret-token')).toBe('npx aiflows-connector connect --token secret-token');
  });

  it('keeps the token ttl pragmatic and short lived', () => {
    expect(getPairingTokenTtlMinutes()).toBe(15);
  });
});
