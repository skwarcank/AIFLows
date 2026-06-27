import { redirect } from 'next/navigation';

import LoginForm from '@/components/login-form';
import { createReadOnlySupabaseServerClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const supabase = createReadOnlySupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/app');
  }

  return (
    <main className="screen auth-screen">
      <LoginForm />
    </main>
  );
}
