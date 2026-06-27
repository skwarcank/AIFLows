function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isMissingRequiredEnvError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('Missing required environment variable:');
}

export function getPublicSupabaseConfig() {
  return {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getAppUrl(): string {
  return requireEnv('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL);
}

export function getAuthCallbackUrl(): string {
  return new URL('/auth/callback', getAppUrl()).toString();
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}
