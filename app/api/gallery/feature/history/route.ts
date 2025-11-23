import { NextResponse } from 'next/server';
import { gallerySupabase } from '@/lib/gallery/db';

// GAIA · Gallery 4.1 – Week 3
// Feature history API.
//
// GET /api/gallery/feature/history?limit=60
//   → returns the most recent stored features from gallery_daily_features.
//
// This is read-only and purely for admin / introspection.

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(365, Number(limitParam))) : 60;

    const supabase = gallerySupabase();

    const { data, error } = await supabase
      .from('gallery_daily_features')
      .select('*')
      .order('feature_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Gallery] feature/history error', error);
      return NextResponse.json(
        { ok: false, history: [], error: 'Failed to load feature history.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      history: data ?? [],
    });
  } catch (err: any) {
    console.error('[Gallery] feature/history exception', err);
    return NextResponse.json(
      { ok: false, history: [], error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
