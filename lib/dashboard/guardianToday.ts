// lib/dashboard/guardianToday.ts
//
// GAIA Level 3 – Dashboard Pulse (4.2 · Week 5)
// Read-only helpers for Guardian "today" Dashboard view.
//
// This keeps logic light and only reads from guardian_checkins,
// which was introduced in GAIA 4.0 (Guardian Core).
//
// It is safe to delete this file later if you decide you don't want
// a Guardian card on the Dashboard.

import { supabaseAdmin } from '@/lib/supabaseAdmin';

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type GuardianStatus = 'pending' | 'answered' | 'skipped' | 'ignored' | 'unknown';

export interface GuardianCheckinLite {
  id: string;
  checkin_date: string;
  type: string | null;
  status: GuardianStatus;
  question: string | null;
}

export interface GuardianTodayDashboardSummary {
  date: string;
  total: number;
  answered: number;
  skipped: number;
  pending: number;
  ignored: number;
  examples: GuardianCheckinLite[]; // small sample of non-answered items
}

export async function getGuardianTodayDashboardSummary(): Promise<GuardianTodayDashboardSummary> {
  const supabase = supabaseAdmin();
  const today = toDateOnlyIso(new Date());

  const { data, error } = await supabase
    .from('guardian_checkins')
    .select('id, checkin_date, type, status, question')
    .eq('checkin_date', today)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Dashboard] getGuardianTodayDashboardSummary error', error);
    return {
      date: today,
      total: 0,
      answered: 0,
      skipped: 0,
      pending: 0,
      ignored: 0,
      examples: [],
    };
  }

  const rows = (data ?? []) as any[];

  let answered = 0;
  let skipped = 0;
  let pending = 0;
  let ignored = 0;

  const examples: GuardianCheckinLite[] = [];

  for (const row of rows) {
    const status = (row.status as GuardianStatus | null) ?? 'unknown';
    if (status === 'answered') answered += 1;
    else if (status === 'skipped') skipped += 1;
    else if (status === 'ignored') ignored += 1;
    else pending += 1;

    // Keep a small sample of non-answered check-ins (pending / ignored)
    if ((status === 'pending' || status === 'ignored' || status === 'unknown') && examples.length < 3) {
      examples.push({
        id: String(row.id),
        checkin_date: row.checkin_date,
        type: (row.type as string | null) ?? null,
        status,
        question: (row.question as string | null) ?? null,
      });
    }
  }

  return {
    date: today,
    total: rows.length,
    answered,
    skipped,
    pending,
    ignored,
    examples,
  };
}
