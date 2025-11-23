'use client';

import React, { useEffect, useState } from 'react';

interface HealthSummary {
  date: string;
  totalWaterMl: number;
  totalWalkMinutes: number;
  sleepState: 'unknown' | 'asleep' | 'awake';
}

interface HealthApiResponse {
  ok: boolean;
  summary?: HealthSummary;
  error?: string;
}

interface HealthQuickCardProps {
  className?: string;
}

// GAIA Level 3 – Dashboard Pulse
// Version 4.2 · Week 1
//
// Dashboard card that exposes "quick actions" for your body:
//   - Add 250 / 500 ml water
//   - Add 15 / 30 minutes of walking
//   - Mark yourself as asleep / awake
//
// All writes go through /api/dashboard/health which in turn writes
// into guardian_checkins so Guardian + Dashboard see the same data.
//
// This component is self-contained and safe to remove at any time.

const HealthQuickCard: React.FC<HealthQuickCardProps> = ({ className = '' }) => {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/health');
      const data = (await res.json()) as HealthApiResponse;
      if (!data.ok || !data.summary) {
        throw new Error(data.error || 'Failed to load health summary.');
      }
      setSummary(data.summary);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load health summary.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: string, message: string) => {
    setBusyAction(action);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as HealthApiResponse;
      if (!data.ok || !data.summary) {
        throw new Error(data.error || 'Action failed.');
      }
      setSummary(data.summary);
      setFlash(message);
      window.setTimeout(() => {
        setFlash((current) => (current === message ? null : current));
      }, 2800);
    } catch (err: any) {
      setError(err?.message ?? 'Action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const waterLiters = summary ? (summary.totalWaterMl / 1000).toFixed(2) : '0.00';

  const sleepLabel =
    summary?.sleepState === 'asleep'
      ? 'Sleeping'
      : summary?.sleepState === 'awake'
      ? 'Awake'
      : 'Not set';

  const rootClasses =
    'rounded-xl border bg-black/5 p-4 shadow-sm flex flex-col gap-3 ' +
    'border-sky-900/40 bg-gradient-to-b from-black/40 to-sky-900/10';

  return (
    <section className={`${rootClasses} ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sky-300">
            Body · Quick Actions
          </p>
          <h2 className="text-sm font-semibold text-zinc-50">
            Protect future you
          </h2>
          <p className="text-[11px] text-zinc-400 max-w-xs">
            Tiny decisions that stack up over years. Log water, walking, and sleep state
            right from the Dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 text-[11px] font-medium text-sky-100 hover:bg-sky-500/10 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      {error && (
        <p className="text-[11px] text-red-500">
          {error}
        </p>
      )}

      {flash && !error && (
        <p className="text-[11px] text-emerald-300">
          {flash}
        </p>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
          <p className="opacity-60">Water today</p>
          <p className="mt-1 text-sm font-semibold text-sky-100">
            {loading && !summary ? '—' : `${waterLiters} L`}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
          <p className="opacity-60">Walking</p>
          <p className="mt-1 text-sm font-semibold text-sky-100">
            {loading && !summary ? '—' : `${summary?.totalWalkMinutes ?? 0} min`}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
          <p className="opacity-60">Sleep state</p>
          <p className="mt-1 text-sm font-semibold text-sky-100">
            {sleepLabel}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 text-[11px]">
        {/* Water */}
        <div className="space-y-1">
          <p className="opacity-70">Water</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction('water_250', 'Nice, you just protected future you by 250ml. 💧')}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 font-medium hover:bg-sky-500/10 disabled:opacity-60"
            >
              + 250 ml
            </button>
            <button
              type="button"
              onClick={() => runAction('water_500', '500ml logged. Your body says thank you. 💧')}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 font-medium hover:bg-sky-500/10 disabled:opacity-60"
            >
              + 500 ml
            </button>
          </div>
        </div>

        {/* Walking */}
        <div className="space-y-1">
          <p className="opacity-70">Walking</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction('walk_15', '15 minutes towards a stronger heart. 🚶‍♀️')}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 font-medium hover:bg-sky-500/10 disabled:opacity-60"
            >
              + 15 min
            </button>
            <button
              type="button"
              onClick={() => runAction('walk_30', '30 minutes logged. Future joints are happy. 🚶‍♀️')}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 font-medium hover:bg-sky-500/10 disabled:opacity-60"
            >
              + 30 min
            </button>
          </div>
        </div>

        {/* Sleep */}
        <div className="space-y-1">
          <p className="opacity-70">Sleep</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction('sleep_asleep', 'Okay, I will keep the world quiet for a while. 😴')}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 font-medium hover:bg-sky-500/10 disabled:opacity-60"
            >
              I&apos;m sleeping now
            </button>
            <button
              type="button"
              onClick={() => runAction('sleep_awake', 'Welcome back. Let’s make today gentle and strong. ☀️')}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center rounded-md border border-sky-500/60 px-2.5 py-1 font-medium hover:bg-sky-500/10 disabled:opacity-60"
            >
              I&apos;m awake now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthQuickCard;
