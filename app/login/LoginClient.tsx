'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const LOCAL_CURRENT_USER_ID_KEY = 'gaia_current_user_id_v1';

type Mode = 'signin' | 'signup';

interface LoginClientProps {
  className?: string;
  initialMode?: Mode;
}

// GAIA Level 3 – Multi-user & Permissions
// Version 4.3 · Auth · Email verify + name
//
// LoginClient
// -----------
// Combined Sign-in / Create-account / Guest entry UI.
// Adds:
//   • email confirmation gating on sign-in using user.email_confirmed_at
//   • keeps initialMode wiring for /login?mode=signin|signup

const LoginClient: React.FC<LoginClientProps> = ({
  className = '',
  initialMode = 'signin',
}) => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [mode, setMode] = useState<Mode>(initialMode);

  // Keep local mode in sync with route query (?mode=)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        throw signInError;
      }

      // Extra gate: make sure email is confirmed.
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      const user = userData?.user ?? null;

      // If email confirmation is enabled in Supabase, this will be null
      // until the user clicks the email link. If confirmations are disabled,
      // Supabase sets this automatically.
      const confirmedAt = (user as any)?.email_confirmed_at;
      if (!confirmedAt) {
        // Not confirmed → immediately sign out again and show message.
        await supabase.auth.signOut();
        setError(
          'Your email is not verified yet. Please check your inbox for a verification email, confirm it, and then sign in again.'
        );
        return;
      }

      router.refresh();
      router.push('/');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          // Optional: you can set a custom redirect URL in Supabase dashboard.
          // emailRedirectTo: `${window.location.origin}/login?mode=signin`,
        },
      });
      if (signUpError) {
        throw signUpError;
      }

      // Best-effort: keep GAIA internal users table in sync.
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: name.trim(),
            email: email.trim(),
            role: 'member',
            permissions: {
              canViewGalleryPrivate: true,
              canViewWealth: true,
              canViewHealth: true,
              canViewGuardian: true,
            },
          }),
        });
      } catch {
        // ignore
      }

      if (data?.user?.id) {
        setInfo(
          'Account created. Please check your email for a verification link before signing in.'
        );
      } else {
        setInfo(
          'Sign-up request sent. If email confirmation is enabled, you should receive an email shortly.'
        );
      }
      setMode('signin');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Guest',
          email: null,
          role: 'guest',
          permissions: {
            canViewGalleryPrivate: false,
            canViewWealth: false,
            canViewHealth: false,
            canViewGuardian: false,
          },
        }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!data.ok || !data.user) {
        throw new Error(data.error || 'Failed to create guest user.');
      }

      const guestId = String(data.user.id);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LOCAL_CURRENT_USER_ID_KEY, guestId);
        }
      } catch {
        // ignore
      }

      router.push('/');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to continue as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen flex items-center justify-center px-4 py-8 ${className}`}>
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-black/60 p-6 text-[11px] text-zinc-200 shadow-xl">
        {/* Header */}
        <header className="mb-4 space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
            Welcome to GAIA
          </h1>
          <p className="text-[12px] text-zinc-400">
            {mode === 'signin'
              ? 'Sign in to continue your journey.'
              : 'Create a new GAIA account.'}
          </p>
        </header>

        {error && (
          <p className="mb-2 rounded-md border border-red-500/40 bg-red-950/40 px-2 py-1 text-[11px] text-red-200">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-2 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2 py-1 text-[11px] text-emerald-200">
            {info}
          </p>
        )}

        {/* FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black/70 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black/70 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-50 hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black/70 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black/70 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black/70 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400">
                Confirm password
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-black/70 px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="Repeat your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-50 hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        {/* Footer: mode switch + guest */}
        <div className="mt-4 space-y-2 text-center text-[11px] text-zinc-400">
          {mode === 'signin' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('signup');
                }}
                className="text-emerald-300 hover:text-emerald-200"
              >
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('signin');
                }}
                className="text-emerald-300 hover:text-emerald-200"
              >
                Sign in
              </button>
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleContinueAsGuest}
              disabled={loading}
              className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
            >
              Continue as guest
            </button>
            <p className="mt-1 text-[10px] text-zinc-500">
              Guests can view the intro page only. Other sections will stay locked
              according to permissions.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginClient;
