import { describe, expect, it, vi } from 'vitest';

import { buildConnectorInstallScript } from '../lib/connector-install';
import {
  buildConnectorCommand,
  buildConnectorInstallUrl,
  createPairingSecret,
  getPairingTokenTtlMinutes,
  sha256Hex,
  shellQuote,
} from '../lib/pairing';

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

  it('builds the connector curl install command shown to the user', () => {
    expect(buildConnectorCommand('secret-token', 'https://app.example.com')).toBe(
      "curl -fsSL 'https://app.example.com/api/connectors/install.sh' | bash -s -- --token 'secret-token'",
    );
  });

  it('normalizes the connector install url against the app url', () => {
    expect(buildConnectorInstallUrl('https://app.example.com/dashboard')).toBe('https://app.example.com/api/connectors/install.sh');
  });

  it('shell-quotes single quotes safely', () => {
    expect(shellQuote("can't")).toBe("'can'\\''t'");
  });

  it('writes a connector wrapper that preserves runtime arguments', () => {
    const script = buildConnectorInstallScript('https://app.example.com');

    expect(script).toContain("cat > \"$BIN_PATH\" <<'EOF'");
    expect(script).toContain('exec node "$HOME/.aiflows/connector-src/packages/connector/dist/cli.js" "$@"');
  });

  it('keeps the token ttl pragmatic and short lived', () => {
    expect(getPairingTokenTtlMinutes()).toBe(15);
  });
});
