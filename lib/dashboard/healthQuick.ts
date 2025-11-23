// lib/dashboard/healthQuick.ts
//
// GAIA Level 3 – Dashboard Pulse (4.2 · Week 1+2)
// Quick helpers for Dashboard health actions.
//
// These helpers write into guardian_checkins so Guardian + Dashboard
// share the same signals. They are conservative and only touch
// today's rows for the given type.

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type HealthQuickType = 'water' | 'walk' | 'sleep';

export interface HealthQuickSummary {
  date: string;             // YYYY-MM-DD
  totalWaterMl: number;     // sum from answer_json for type 'water'
  totalWalkMinutes: number; // from answer_json for type 'walk'
  sleepState: 'unknown' | 'asleep' | 'awake';
}

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getTodaySummary(): Promise<HealthQuickSummary> {
  const supabase = supabaseAdmin();
  const today = toDateOnlyIso(new Date());

  const { data, error } = await supabase
    .from('guardian_checkins')
    .select('*')
    .eq('checkin_date', today);

  if (error) {
    console.error('[Dashboard] getTodaySummary error', error);
    return {
      date: today,
      totalWaterMl: 0,
      totalWalkMinutes: 0,
      sleepState: 'unknown',
    };
  }

  let totalWaterMl = 0;
  let totalWalkMinutes = 0;
  let sleepState: 'unknown' | 'asleep' | 'awake' = 'unknown';

  for (const row of data ?? []) {
    if (row.type === 'water' && row.answer_json) {
      const val = Number(row.answer_json.totalMl ?? row.answer_json.amountMl ?? 0);
      if (!Number.isNaN(val)) {
        totalWaterMl += val;
      }
    }
    if (row.type === 'walk' && row.answer_json) {
      const val = Number(row.answer_json.minutes ?? row.answer_json.durationMinutes ?? 0);
      if (!Number.isNaN(val)) {
        totalWalkMinutes += val;
      }
    }
    if (row.type === 'sleep' && row.answer_json) {
      const state = row.answer_json.state as 'asleep' | 'awake' | undefined;
      if (state === 'asleep' || state === 'awake') {
        sleepState = state;
      }
    }
  }

  return {
    date: today,
    totalWaterMl,
    totalWalkMinutes,
    sleepState,
  };
}

interface EnsureResult {
  id: string;
}

async function ensureRowForToday(
  type: HealthQuickType,
  defaultQuestion: string
): Promise<EnsureResult | null> {
  const supabase = supabaseAdmin();
  const today = toDateOnlyIso(new Date());

  const { data, error } = await supabase
    .from('guardian_checkins')
    .select('id')
    .eq('checkin_date', today)
    .eq('type', type)
    .limit(1);

  if (error) {
    console.error('[Dashboard] ensureRowForToday select error', error);
    return null;
  }

  if (data && data.length > 0) {
    return { id: data[0].id as string };
  }

  const insert = {
    checkin_date: today,
    type,
    status: 'pending',
    question: defaultQuestion,
    answer_json: {},
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('guardian_checkins')
    .insert(insert)
    .select('id')
    .limit(1);

  if (insertErr || !inserted || inserted.length === 0) {
    console.error('[Dashboard] ensureRowForToday insert error', insertErr);
    return null;
  }

  return { id: inserted[0].id as string };
}

export async function addWater(amountMl: number) {
  const supabase = supabaseAdmin();
  if (amountMl <= 0) {
    throw new Error('amountMl must be positive');
  }

  const ensured = await ensureRowForToday('water', 'Did you drink water today?');
  if (!ensured) {
    throw new Error('Failed to ensure water checkin row.');
  }

  const { data, error } = await supabase
    .from('guardian_checkins')
    .select('id, answer_json')
    .eq('id', ensured.id)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error('[Dashboard] addWater load error', error);
    throw new Error('Failed to load water checkin row.');
  }

  const existing = (data[0] as any).answer_json || {};
  const prev = Number(existing.totalMl ?? existing.amountMl ?? 0);
  const totalMl = (Number.isNaN(prev) ? 0 : prev) + amountMl;

  const nextAnswer = {
    ...existing,
    totalMl,
    lastAddedMl: amountMl,
    updatedAt: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from('guardian_checkins')
    .update({
      status: 'answered',
      answer_json: nextAnswer,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ensured.id);

  if (updateErr) {
    console.error('[Dashboard] addWater update error', updateErr);
    throw new Error('Failed to update water checkin.');
  }

  return await getTodaySummary();
}

export async function addWalkMinutes(minutes: number) {
  const supabase = supabaseAdmin();
  if (minutes <= 0) {
    throw new Error('minutes must be positive');
  }

  const ensured = await ensureRowForToday('walk', 'Did you walk today?');
  if (!ensured) {
    throw new Error('Failed to ensure walk checkin row.');
  }

  const { data, error } = await supabase
    .from('guardian_checkins')
    .select('id, answer_json')
    .eq('id', ensured.id)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error('[Dashboard] addWalkMinutes load error', error);
    throw new Error('Failed to load walk checkin row.');
  }

  const existing = (data[0] as any).answer_json || {};
  const prev = Number(existing.minutes ?? existing.durationMinutes ?? 0);
  const totalMinutes = (Number.isNaN(prev) ? 0 : prev) + minutes;

  const nextAnswer = {
    ...existing,
    minutes: totalMinutes,
    lastAddedMinutes: minutes,
    updatedAt: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from('guardian_checkins')
    .update({
      status: 'answered',
      answer_json: nextAnswer,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ensured.id);

  if (updateErr) {
    console.error('[Dashboard] addWalkMinutes update error', updateErr);
    throw new Error('Failed to update walk checkin.');
  }

  return await getTodaySummary();
}

export async function setSleepState(state: 'asleep' | 'awake') {
  const supabase = supabaseAdmin();
  const ensured = await ensureRowForToday('sleep', 'What is your sleep state now?');
  if (!ensured) {
    throw new Error('Failed to ensure sleep checkin row.');
  }

  const nextAnswer = {
    state,
    updatedAt: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from('guardian_checkins')
    .update({
      status: 'answered',
      answer_json: nextAnswer,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ensured.id);

  if (updateErr) {
    console.error('[Dashboard] setSleepState update error', updateErr);
    throw new Error('Failed to update sleep checkin.');
  }

  return await getTodaySummary();
}

// Week 2: allow marking a metric as "skipped" for today, so the
// Dashboard can politely ask, you can say "No", and Guardian will
// remember that you explicitly skipped it (status = 'skipped').

export async function markSkipped(type: 'water' | 'walk') {
  const supabase = supabaseAdmin();
  const defaultQuestion =
    type === 'water' ? 'Did you drink water today?' : 'Did you walk today?';

  const ensured = await ensureRowForToday(type, defaultQuestion);
  if (!ensured) {
    throw new Error('Failed to ensure checkin row for skip.');
  }

  const nextAnswer = {
    skipped: true,
    updatedAt: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from('guardian_checkins')
    .update({
      status: 'skipped',
      answer_json: nextAnswer,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ensured.id);

  if (updateErr) {
    console.error('[Dashboard] markSkipped update error', updateErr);
    throw new Error('Failed to mark checkin as skipped.');
  }

  return await getTodaySummary();
}
