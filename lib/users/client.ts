'use client';

import { useEffect, useState } from 'react';
import type { GaiaUser } from '@/lib/users/types';

export const LOCAL_CURRENT_USER_ID_KEY = 'gaia_current_user_id_v1';

export interface ActiveUserState {
  user: GaiaUser | null;
  loading: boolean;
  error: string | null;
}

export function getActiveUserIdFromLocal(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LOCAL_CURRENT_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveUserIdLocal(id: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!id) {
      window.localStorage.removeItem(LOCAL_CURRENT_USER_ID_KEY);
    } else {
      window.localStorage.setItem(LOCAL_CURRENT_USER_ID_KEY, id);
    }
  } catch {
    // ignore
  }
}

interface UsersApiListResponse {
  ok: boolean;
  users?: GaiaUser[];
  error?: string;
}

// Simple hook that reads the "active user" id from localStorage and then
// fetches /api/users to find that user. This mirrors the behaviour in
// Settings > Users, but is lightweight and can be used anywhere in
// client components (Dashboard, Gallery, etc.).
export function useActiveUser(): ActiveUserState {
  const [user, setUser] = useState<GaiaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = getActiveUserIdFromLocal();
        if (!id) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const res = await fetch('/api/users');
        const data = (await res.json()) as UsersApiListResponse;
        if (!data.ok || !data.users) {
          throw new Error(data.error || 'Failed to load users.');
        }

        const found = data.users.find((u) => u.id === id) || null;
        if (!cancelled) {
          setUser(found);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load active user.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}
