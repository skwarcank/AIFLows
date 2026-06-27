import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appDir = process.cwd();
const envPath = resolve(appDir, '.env.local');

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const required = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error('Missing required web environment variables:');
  for (const name of missing) console.error(`- ${name}`);
  console.error('Set these in Vercel Project Settings → Environment Variables for Production, Preview, and Development as needed.');
  process.exit(1);
}

console.log('Web environment check passed.');
