// lib/gallery/db.ts
//
// Small helper to reuse the existing Supabase admin client for Gallery
// features (4.1).

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export function gallerySupabase() {
  return supabaseAdmin();
}
