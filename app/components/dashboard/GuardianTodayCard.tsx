'use client';

import React, { useEffect, useState } from 'react';

type GuardianStatus = 'pending' | 'answered' | 'skipped' | 'ignored' | 'unknown';

interface GuardianCheckinLite {
  id: string;
  checkin_date: string;
  type: string | null;
  status: GuardianStatus;
  question: string | null;
}

interface GuardianTodayDashboardSummary {
  date: string;
  total: number;
  answered: number;
  skipped: number;
  pending: number;
  ignored: number;
  examples: GuardianCheckinLite[];
}

interface GuardianTodayApiResponse {
  ok: boolean;
  summary?: GuardianTodayDashboardSummary;
  error?: string;
}

interface GuardianTodayCardProps {
  className?: string;
}

// GAIA Level 3 – Dashboard Pulse
// Version 4.2 · Week 5
//
// GuardianTodayCard
// -----------------
// A small Dashboard card that shows what Guardian is waiting on
// *today*. It does not write anything and is safe to remove later.
//
// Behaviour:
//   - On mount, calls GET /api/dashboard/guardian-today.
//   - Shows count of answered / remaining / skipped / ignored.
//   - Shows up to 3 example pending/ignored questions so you can
//     jump into Guardian with context.
//   - "Open Guardian" button simply links to /guardian (you can
//     change this route to match your real Guardian page).

const GuardianTodayCard: React.FC<GuardianTodayCardProps> = ({ className = '' }) => {
  const [summary, setSummary] = useState<GuardianTodayDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/guardian-today');
        const data = (await res.json()) as GuardianTodayApiResponse;
        if (!data.ok || !data.summary) {
          throw new Error(data.error || 'Failed to load Guardian today.');
        }
        if (!cancelled) {
          setSummary(data.summary);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load Guardian today.');
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

  const rootClasses =
    'rounded-xl border bg-black/5 p-4 shadow-sm flex flex-col gap-3 ' +
    'border-emerald-900/60 bg-gradient-to-b from-black/40 to-emerald-900/10 text-[11px]';

  const chipClasses =
    'inline-flex items-center rounded-full bg-black/40 border border-white/10 px-2 py-[2px] text-[10px] gap-1';

  return (
    <section className={`${rootClasses} ${className}`}>
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">
            Guardian · Today
          </p>
          <h2 className="text-sm font-semibold text-zinc-50">
            What your brain still wants from you
          </h2>
          <p className="text-[11px] text-zinc-400 max-w-xs">
            A small snapshot of today&apos;s Guardian check-ins so you don&apos;t
            forget what you promised yourself.
          </p>
        </div>
        <a
          href="/guardian"
          className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 px-2.5 py-1 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/10"
        >
          Open Guardian
        </a>
      </header>

      {loading && (
        <p className="text-[11px] text-zinc-400">
          Loading today&apos;s Guardian check-ins…
        </p>
      )}

      {error && !loading && (
        <p className="text-[11px] text-red-500">
          {error}
        </p>
      )}

      {!loading && !error && summary && (
        <div className="space-y-3">
          {/* Chips row */}
          <div className="flex flex-wrap gap-2">
            <span className={chipClasses}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-emerald-50">Answered</span>
              <span className="text-zinc-300">{summary.answered}</span>
            </span>
            <span className={chipClasses}>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="font-semibold text-amber-50">Remaining</span>
              <span className="text-zinc-300">
                {summary.total - summary.answered - summary.skipped}
              </span>
            </span>
            {summary.skipped > 0 && (
              <span className={chipClasses}>
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span className="font-semibold text-zinc-50">Skipped</span>
                <span className="text-zinc-300">{summary.skipped}</span>
              </span>
            )}
          </div>

          {/* Examples list */}
          {summary.examples.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] text-zinc-400">
                A few things still waiting for your answer:
              </p>
              <ul className="space-y-1">
                {summary.examples.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-white/5 bg-black/40 px-2 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                        {item.type || 'check-in'}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {item.status === 'pending'
                          ? 'Pending'
                          : item.status === 'ignored'
                          ? 'Ignored'
                          : 'Waiting'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-100 line-clamp-2">
                      {item.question || 'No question text.'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400">
              No unanswered Guardian check-ins for today. You can still open Guardian if
              you want to review older days or add new reflections.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default GuardianTodayCard;
