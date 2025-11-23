import { NextResponse } from 'next/server';
import { getDashboardTodayStripSummary } from '@/lib/dashboard/todayStrip';

// GAIA Level 3 – Dashboard Pulse
// Version 4.2 · Week 3
//
// API: /api/dashboard/today-strip
//
// GET
//   → returns a compact "today" snapshot that combines:
//        - Guardian (checkins counts)
//        - Health (water / walk / sleep state)
//        - Gallery (whether a feature is set for today)
//
// This endpoint is read-only and only used by the TodayStrip
// Dashboard component.

export async function GET() {
  try {
    const summary = await getDashboardTodayStripSummary();
    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    console.error('[Dashboard] GET /api/dashboard/today-strip error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
