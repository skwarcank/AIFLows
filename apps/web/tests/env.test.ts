import { afterEach, describe, expect, it } from 'vitest';

import { getAppUrl, getAuthCallbackUrl, getPublicSupabaseConfig, getSupabaseServiceRoleKey } from '../lib/env';

const previousEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = previousEnv.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = previousEnv.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = previousEnv.SUPABASE_SERVICE_ROLE_KEY;
});

describe('env helpers', () => {
  it('builds auth callback URLs from the configured app URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    expect(getAppUrl()).toBe('http://localhost:3000');
    expect(getAuthCallbackUrl()).toBe('http://localhost:3000/auth/callback');
  });

  it('reads the required public Supabase config', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    expect(getPublicSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('reads the server-only Supabase service role key', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    expect(getSupabaseServiceRoleKey()).toBe('service-role-key');
  });
});
