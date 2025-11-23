// lib/dashboard/todayStrip.ts
//
// GAIA Level 3 – Dashboard Pulse (4.2 · Week 3)
// Combined "today" summary for Guardian + Body + Gallery.
//
// This module stays light and only reads from Supabase, using
// the same tables we already created for Guardian + Gallery:
//   - guardian_checkins
//   - gallery_daily_features
//
// It also reuses the Dashboard health summary so there is a single
// source of truth for water / walk / sleep on this level.

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { gallerySupabase } from '@/lib/gallery/db';
import { getTodaySummary as getHealthTodaySummary } from '@/lib/dashboard/healthQuick';

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface GuardianTodaySummary {
  date: string;
  totalCheckins: number;
  answered: number;
  skipped: number;
  pending: number;
}

export interface GalleryTodayStatus {
  date: string;
  hasFeature: boolean;
  source: 'manual' | 'auto' | null;
  storedAt: string | null;
}

export interface DashboardTodayStripSummary {
  date: string;
  guardian: GuardianTodaySummary;
  health: Awaited<ReturnType<typeof getHealthTodaySummary>>;
  gallery: GalleryTodayStatus;
}

export async function getGuardianTodaySummary(): Promise<GuardianTodaySummary> {
  const supabase = supabaseAdmin();
  const today = toDateOnlyIso(new Date());

  const { data, error } = await supabase
    .from('guardian_checkins')
    .select('status')
    .eq('checkin_date', today);

  if (error) {
    console.error('[Dashboard] getGuardianTodaySummary error', error);
    return {
      date: today,
      totalCheckins: 0,
      answered: 0,
      skipped: 0,
      pending: 0,
    };
  }

  let answered = 0;
  let skipped = 0;
  let pending = 0;

  for (const row of data ?? []) {
    const status = (row as any).status as string | null;
    if (status === 'answered') answered += 1;
    else if (status === 'skipped') skipped += 1;
    else pending += 1;
  }

  const totalCheckins = (data ?? []).length;

  return {
    date: today,
    totalCheckins,
    answered,
    skipped,
    pending,
  };
}

export async function getGalleryTodayStatus(): Promise<GalleryTodayStatus> {
  const supabase = gallerySupabase();
  const today = toDateOnlyIso(new Date());

  const { data, error } = await supabase
    .from('gallery_daily_features')
    .select('feature_date, source, created_at')
    .eq('feature_date', today)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[Dashboard] getGalleryTodayStatus error', error);
    return {
      date: today,
      hasFeature: false,
      source: null,
      storedAt: null,
    };
  }

  if (!data || data.length === 0) {
    return {
      date: today,
      hasFeature: false,
      source: null,
      storedAt: null,
    };
  }

  const row = data[0] as any;

  return {
    date: today,
    hasFeature: true,
    source: (row.source === 'manual' ? 'manual' : 'auto') as 'manual' | 'auto',
    storedAt: row.created_at ?? null,
  };
}

export async function getDashboardTodayStripSummary(): Promise<DashboardTodayStripSummary> {
  const today = toDateOnlyIso(new Date());

  const [guardian, health, gallery] = await Promise.all([
    getGuardianTodaySummary(),
    getHealthTodaySummary(),
    getGalleryTodayStatus(),
  ]);

  return {
    date: today,
    guardian,
    health,
    gallery,
  };
}
