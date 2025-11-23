import { NextResponse } from 'next/server';
import { getGuardianTodayDashboardSummary } from '@/lib/dashboard/guardianToday';

// GAIA Level 3 – Dashboard Pulse
// Version 4.2 · Week 5
//
// API: /api/dashboard/guardian-today
//
// GET
//   → returns a read-only view of Guardian check-ins for today,
//     specifically shaped for the Dashboard Guardian card.
//
// Does not modify anything; it only reads from guardian_checkins.

export async function GET() {
  try {
    const summary = await getGuardianTodayDashboardSummary();
    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    console.error('[Dashboard] GET /api/dashboard/guardian-today error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
