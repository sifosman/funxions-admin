'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .single();

        if (userData?.role === 'admin') {
          router.replace('/dashboard');
        }
      } finally {
        setCheckingSession(false);
      }
    };

    restoreSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, full_name, auth_user_id')
        .eq('auth_user_id', data.user.id)
        .single();

      if (userError) {
        throw new Error(`User lookup failed: ${userError.message}`);
      }

      if (!userData) {
        throw new Error('User record not found in database. Please contact administrator.');
      }

      if (userData.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error(`Unauthorized. User role is "${userData.role}". Admin access only.`);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#113f59]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0] px-4 py-10">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[#EDE9DD] bg-white p-8 shadow-[0_10px_40px_rgba(71,115,114,0.08)] sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113f59] via-[#9DCFDB] to-[#D9EBE8] p-1.5 shadow-[0_10px_24px_rgba(17,63,89,0.35)]">
            <Image src="/icon.png" alt="Funxon" width={44} height={44} className="rounded-xl" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#113f59]">Admin panel</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Funxon
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-12 block w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-12 block w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#113f59] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#113f59] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
