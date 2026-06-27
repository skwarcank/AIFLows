#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const localEnvPath = resolve(repoRoot, 'supabase/.env.local');

function loadDotenv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function fail(message) {
  console.error(`\n[supabase-push] ${message}\n`);
  process.exit(1);
}

loadDotenv(localEnvPath);

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  fail('Missing SUPABASE_DB_URL. Set it in your shell or supabase/.env.local.');
}

const dryRun = process.argv.includes('--dry-run');
const supabaseArgs = [
  '--yes',
  'supabase@latest',
  'db',
  'push',
  '--db-url',
  dbUrl,
  '--include-all',
];

if (dryRun) {
  supabaseArgs.push('--dry-run');
}

const result = spawnSync('npx', supabaseArgs, {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  fail(result.error.message);
}

process.exit(result.status ?? 1);
