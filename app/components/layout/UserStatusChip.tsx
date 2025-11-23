'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CurrentUser {
  name: string | null;
  email: string | null;
}

const UserStatusChip: React.FC = () => {
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

  if (!user) return null;

  const displayName = user.name || user.email || 'Unknown';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-black/60 px-3 py-1.5 text-[11px] text-zinc-100 shadow-sm">
      <span className="max-w-[140px] truncate font-medium">{displayName}</span>
      {user.email && (
        <span className="hidden max-w-[140px] truncate text-[10px] text-zinc-400 sm:inline">
          {user.email}
        </span>
      )}
      <span className="h-4 w-px bg-zinc-700" aria-hidden="true" />
      <Link
        href="/settings"
        className="text-[10px] font-medium text-emerald-300 hover:text-emerald-200"
      >
        Permissions
      </Link>
    </div>
  );
};

export default UserStatusChip;
