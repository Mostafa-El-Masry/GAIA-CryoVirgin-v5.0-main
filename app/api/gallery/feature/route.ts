import { NextResponse } from 'next/server';
import { loadGalleryFeatureForDate, saveGalleryFeature } from '@/lib/gallery/featureHistory';
import type { GalleryFeatureSource } from '@/lib/gallery/featureHistory';

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// GAIA · Gallery 4.1
// Daily feature API.
//
// GET /api/gallery/feature
//   ?date=YYYY-MM-DD   (optional)
//   → returns the stored feature for that date, if any.
//
// POST /api/gallery/feature
//   Body: { feature: any, source?: 'auto' | 'manual', date?: 'YYYY-MM-DD' }
//   → stores a feature snapshot for the given date (or today if omitted).

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const { feature, error } = await loadGalleryFeatureForDate(dateParam || undefined);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          date: dateParam || null,
          feature: null,
          error: 'Failed to load gallery feature.',
        },
        { status: 500 }
      );
    }

    if (!feature) {
      const dateIso = dateParam || toDateOnlyIso(new Date());
      return NextResponse.json({
        ok: false,
        date: dateIso,
        feature: null,
        error: 'No feature stored for this date.',
      });
    }

    return NextResponse.json({
      ok: true,
      date: feature.feature_date,
      feature: feature.payload_json,
      source: feature.source,
    });
  } catch (err: any) {
    console.error('[Gallery] feature GET exception', err);
    return NextResponse.json(
      {
        ok: false,
        date: null,
        feature: null,
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const feature = body?.feature;
    const source = (body?.source as GalleryFeatureSource | undefined) || 'auto';
    const date = body?.date as string | undefined;

    if (typeof feature === 'undefined' || feature === null) {
      return NextResponse.json(
        { ok: false, error: 'Missing feature payload.' },
        { status: 400 }
      );
    }

    const { feature: saved, error } = await saveGalleryFeature(feature, source, date);
    if (error || !saved) {
      return NextResponse.json(
        { ok: false, error: 'Failed to save gallery feature.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      date: saved.feature_date,
      source: saved.source,
    });
  } catch (err: any) {
    console.error('[Gallery] feature POST exception', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
