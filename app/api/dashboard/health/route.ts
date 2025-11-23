import { NextResponse } from 'next/server';
import {
  addWalkMinutes,
  addWater,
  getTodaySummary,
  markSkipped,
  setSleepState,
} from '@/lib/dashboard/healthQuick';

// GAIA Level 3 – Dashboard Pulse
// Version 4.2 · Week 1+2
//
// API: /api/dashboard/health
//
// GET
//   → returns a summary of today's health quick actions, based on
//     guardian_checkins rows.
//
// POST
//   Body: { action: string, ...payload }
//   Supported actions:
//     - 'water_250'       → add 250 ml
//     - 'water_500'       → add 500 ml
//     - 'water_skip'      → mark water as skipped
//     - 'walk_15'         → add 15 minutes
//     - 'walk_30'         → add 30 minutes
//     - 'walk_skip'       → mark walk as skipped
//     - 'sleep_asleep'    → set sleep state to 'asleep'
//     - 'sleep_awake'     → set sleep state to 'awake'
//
//   Returns the updated summary on success.

export async function GET() {
  try {
    const summary = await getTodaySummary();
    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    console.error('[Dashboard] GET /api/dashboard/health error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action ?? '').trim();

    let summary;

    switch (action) {
      case 'water_250':
        summary = await addWater(250);
        break;
      case 'water_500':
        summary = await addWater(500);
        break;
      case 'water_skip':
        summary = await markSkipped('water');
        break;
      case 'walk_15':
        summary = await addWalkMinutes(15);
        break;
      case 'walk_30':
        summary = await addWalkMinutes(30);
        break;
      case 'walk_skip':
        summary = await markSkipped('walk');
        break;
      case 'sleep_asleep':
        summary = await setSleepState('asleep');
        break;
      case 'sleep_awake':
        summary = await setSleepState('awake');
        break;
      default:
        return NextResponse.json(
          { ok: false, error: 'Unsupported action.' },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    console.error('[Dashboard] POST /api/dashboard/health error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
