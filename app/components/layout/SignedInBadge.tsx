'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CurrentUser {
  name: string | null;
  email: string | null;
}

const SignedInBadge: React.FC = () => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data?.user ?? null;
        if (!u) {
          if (!cancelled) setUser(null);
          return;
        }
        const meta = (u.user_metadata || {}) as any;
        const fullName: string | null =
          (meta.full_name as string | undefined) ||
          (meta.name as string | undefined) ||
          null;
        const email: string | null = (u.email as string | undefined) ?? null;

        if (!cancelled) {
          setUser({
            name: fullName ?? (email ? email.split('@')[0] : 'Anonymous'),
            email,
          });
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email || 'Unknown';

  return (
    <div className="relative inline-flex items-center text-[11px] text-zinc-200">
      <div className="group inline-flex items-center rounded-full border border-zinc-700 bg-black/60 px-3 py-1.5">
        {/* Default state: show name only */}
        <span className="max-w-[160px] truncate text-[11px] font-medium text-zinc-50">
          {displayName}
        </span>

        {/* Hover card */}
        <div className="pointer-events-none absolute right-0 top-full z-30 mt-1 w-max min-w-[200px] translate-y-1 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-xl border border-zinc-800 bg-black/90 px-3 py-2 text-left shadow-xl">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Signed in as
            </p>
            <p className="mt-1 text-[11px] font-semibold text-zinc-100">
              {displayName}
            </p>
            {user.email && (
              <p className="mt-[2px] text-[10px] text-zinc-400">{user.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignedInBadge;
