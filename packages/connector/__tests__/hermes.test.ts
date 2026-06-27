import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';

import { discoverHermes } from '../src/hermes';

let tempDir: string | null = null;

describe('Hermes discovery', () => {
  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  });

  it('discovers default and named Hermes profiles read-only by path', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'aiflows-hermes-'));
    await writeFile(join(tempDir, 'state.db'), 'not a real db');
    await mkdir(join(tempDir, 'profiles', 'amon'), { recursive: true });
    await writeFile(join(tempDir, 'profiles', 'amon', 'state.db'), 'not a real db');

    const result = discoverHermes(tempDir);

    expect(result?.home).toBe(tempDir);
    expect(result?.profiles.map((profile) => profile.id)).toEqual(['amon', 'default']);
    expect(result?.profiles.find((profile) => profile.id === 'amon')?.profileType).toBe('named');
    expect(result?.profiles.find((profile) => profile.id === 'default')?.profileType).toBe('default');
  });

  it('returns null with actionable no-data state when no Hermes DB exists', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'aiflows-no-hermes-'));
    expect(discoverHermes(tempDir)).toBeNull();
  });
});
