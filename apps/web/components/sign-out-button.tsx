"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setBusy(false);
    router.replace('/login');
    router.refresh();
  }

  return (
    <button className="ghost-btn" onClick={handleSignOut} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
