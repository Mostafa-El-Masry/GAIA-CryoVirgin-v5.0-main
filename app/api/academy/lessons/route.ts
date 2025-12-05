// app/api/academy/lessons/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLessonContent } from "@/app/apollo/academy/Paths/lesson/lessonContent";

const TABLE = "academy_lessons";

type AdminClient = SupabaseClient<any, "public", any>;
type LessonRow = {
  lesson_id: string;
  track_id: string | null;
  content: unknown;
  created_at?: string;
  updated_at?: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: Request) {
  const supabase = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  const trackId = searchParams.get("trackId");

  if (!lessonId) {
    return json({ error: "Missing lessonId query param" }, 400);
  }

  const { data, error } = await (supabase as AdminClient)
    .from(TABLE)
    .select("lesson_id, track_id, content, created_at, updated_at")
    .eq("lesson_id", lessonId)
    .maybeSingle<LessonRow>();

  if (error) {
    console.error("/api/academy/lessons GET error:", error);
    return json({ error: error.message }, 500);
  }

  if (data) {
    return json({ data }, 200);
  }

  // Lazy seed from base TypeScript lesson if nothing is in the database yet
  try {
    const baseContent = getLessonContent(lessonId, (trackId ?? undefined) as any);

    if (!baseContent) {
      // If we can't resolve the base lesson, just return null so the client falls back to TS.
      return json({ data: null }, 200);
    }

    const now = new Date().toISOString();

    const toUpsert: Partial<LessonRow> & { lesson_id: string } = {
      lesson_id: lessonId,
      track_id: trackId ?? null,
      content: baseContent,
      updated_at: now,
    };

    const { data: seeded, error: seedError } = await (supabase as AdminClient)
      .from(TABLE)
      .upsert(toUpsert, { onConflict: "lesson_id" })
      .select("lesson_id, track_id, content, created_at, updated_at")
      .maybeSingle<LessonRow>();

    if (seedError) {
      console.error("/api/academy/lessons GET seed error:", seedError);
      return json({ error: seedError.message }, 500);
    }

    return json({ data: seeded }, 200);
  } catch (err) {
    console.error("/api/academy/lessons GET base seed error:", err);
    return json({ error: "Failed to seed base lesson content" }, 500);
  }
}

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { lessonId, trackId, content } = body as {
    lessonId?: string;
    trackId?: string;
    content?: unknown;
  };

  if (!lessonId) {
    return json({ error: "lessonId is required" }, 400);
  }
  if (!content) {
    return json({ error: "content is required" }, 400);
  }

  const now = new Date().toISOString();

  const toUpsert: Partial<LessonRow> & { lesson_id: string } = {
    lesson_id: lessonId,
    track_id: trackId ?? null,
    content,
    updated_at: now,
  };

  const { data, error } = await (supabase as AdminClient)
    .from(TABLE)
    .upsert(toUpsert, { onConflict: "lesson_id" })
    .select("lesson_id, track_id, content, created_at, updated_at")
    .maybeSingle<LessonRow>();

  if (error) {
    console.error("/api/academy/lessons POST error:", error);
    return json({ error: error.message }, 500);
  }

  return json({ data }, 200);
}

export async function DELETE(req: Request) {
  const supabase = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) {
    return json({ error: "Missing lessonId query param" }, 400);
  }

  const { error } = await (supabase as AdminClient)
    .from(TABLE)
    .delete()
    .eq("lesson_id", lessonId);

  if (error) {
    console.error("/api/academy/lessons DELETE error:", error);
    return json({ error: error.message }, 500);
  }

  return json({ ok: true }, 200);
}
