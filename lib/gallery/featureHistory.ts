// lib/gallery/featureHistory.ts
//
// GAIA · Gallery 4.1
// Daily feature history stored in Supabase.
//
// Table expected (see README for SQL):
//
//   gallery_daily_features
//     id           uuid primary key
//     feature_date date not null
//     source       text not null  -- 'auto' | 'manual'
//     payload_json jsonb not null
//     created_at   timestamptz not null default now()
//
// This module does not know anything about R2 vs local; it stores a
// snapshot of the MediaItem object that the Gallery already uses.

import { gallerySupabase } from './db';

export type GalleryFeatureSource = 'auto' | 'manual';

export interface GalleryDailyFeature {
  id: string;
  feature_date: string; // 'YYYY-MM-DD'
  source: GalleryFeatureSource;
  payload_json: any;
  created_at: string;
}

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function loadGalleryFeatureForDate(dateIso?: string) {
  const supabase = gallerySupabase();
  const effectiveDate = dateIso || toDateOnlyIso(new Date());

  const { data, error } = await supabase
    .from('gallery_daily_features')
    .select('*')
    .eq('feature_date', effectiveDate)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[Gallery] featureHistory load error', error);
    return { feature: null, error };
  }

  const row = data && data[0];
  if (!row) {
    return { feature: null, error: null };
  }

  return {
    feature: row as GalleryDailyFeature,
    error: null,
  };
}

export async function saveGalleryFeature(
  payload: any,
  source: GalleryFeatureSource = 'auto',
  dateIso?: string
) {
  const supabase = gallerySupabase();
  const effectiveDate = dateIso || toDateOnlyIso(new Date());

  const insertRow = {
    feature_date: effectiveDate,
    source,
    payload_json: payload,
  };

  const { data, error } = await supabase
    .from('gallery_daily_features')
    .insert(insertRow)
    .select('*')
    .limit(1);

  if (error) {
    console.error('[Gallery] featureHistory save error', error);
    return { feature: null, error };
  }

  return { feature: data && data[0], error: null };
}
