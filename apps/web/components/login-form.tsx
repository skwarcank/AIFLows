"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getAuthCallbackUrl } from '@/lib/env';

export default function LoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    router.replace('/app');
    router.refresh();
  }

  async function handleSignUp() {
    setBusy(true);
    setStatus(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });
    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus('Check your email for the verification link, then return here.');
  }

  async function handleGitHub() {
    setBusy(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getAuthCallbackUrl(),
      },
    });

    setBusy(false);

    if (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow">Hosted AIFlows</p>
        <h1>Sign in or create your account</h1>
        <p className="muted">
          Use email/password first. GitHub OAuth is ready once Supabase is configured.
        </p>
      </div>

      <label className="field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
        />
      </label>

      <div className="auth-actions">
        <button disabled={busy || !email || !password} onClick={handleSignIn} className="primary-btn">
          Sign in
        </button>
        <button disabled={busy || !email || !password} onClick={handleSignUp} className="secondary-btn">
          Create account
        </button>
      </div>

      <div className="divider">or</div>

      <button disabled={busy} onClick={handleGitHub} className="github-btn">
        Continue with GitHub
      </button>

      <p className={`status-text ${status ? 'status-visible' : ''}`}>{status ?? 'Email verification and GitHub OAuth both return to /auth/callback.'}</p>
    </div>
  );
}
