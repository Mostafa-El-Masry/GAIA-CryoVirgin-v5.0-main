import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type LessonRunPayload = {
  lessonId?: string;
  trackId?: string | null;
  quizAnswers?: Record<string, string> | null;
  quizCorrect?: boolean | null;
  quizSubmittedAt?: string | null;
  codeLanguage?: string | null;
  codeSubmitted?: string | null;
  codeResult?: unknown;
  completedAt?: string | null;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function resolveUserId(admin: any, token: string) {
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return null;
  return userData.user.id as string;
}

export async function GET(req: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return json(
      { error: "Supabase service role key not configured on this server" },
      501
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Authorization token" }, 401);

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return json({ error: "lessonId is required" }, 400);

  const userId = await resolveUserId(admin, token);
  if (!userId) return json({ error: "Invalid token" }, 401);

  // Prefer meta table if present
  try {
    const { data: metaData, error: metaError } = await admin
      .from("academy_lesson_runs_meta")
      .select(
        "last_quiz_answers, last_quiz_correct, last_quiz_submitted_at, last_code_language, last_code_submitted, last_code_result, last_completed_at"
      )
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (!metaError && metaData) {
      return json({ data: { source: "meta", ...metaData } }, 200);
    }
  } catch {
    // ignore and fall through to runs
  }

  // Fallback to latest run
  const { data, error } = await admin
    .from("academy_lesson_runs")
    .select(
      "quiz_answers, quiz_correct, quiz_submitted_at, code_language, code_submitted, code_result, completed_at"
    )
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("/api/academy/lesson-run GET error:", error);
    return json({ error: error.message }, 500);
  }

  return json({ data: data ? { source: "runs", ...data } : null }, 200);
}

export async function POST(req: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return json(
      { error: "Supabase service role key not configured on this server" },
      501
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Authorization token" }, 401);

  const userId = await resolveUserId(admin, token);
  if (!userId) return json({ error: "Invalid token" }, 401);

  let body: LessonRunPayload;
  try {
    body = (await req.json()) as LessonRunPayload;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const lessonId = body.lessonId;
  if (!lessonId) return json({ error: "lessonId is required" }, 400);

  const {
    trackId = null,
    quizAnswers = null,
    quizCorrect = null,
    quizSubmittedAt = null,
    codeLanguage = null,
    codeSubmitted = null,
    codeResult = null,
    completedAt = null,
  } = body;

  // Require at least one meaningful payload field
  const hasQuiz = quizAnswers !== null || quizCorrect !== null;
  const hasCode = codeSubmitted !== null || codeResult !== null;
  const hasCompletion = completedAt !== null;
  if (!hasQuiz && !hasCode && !hasCompletion) {
    return json(
      {
        error:
          "Provide at least one of quizAnswers/quizCorrect, codeSubmitted/codeResult, or completedAt",
      },
      400
    );
  }

  const nowIso = new Date().toISOString();

  const runRow = {
    user_id: userId,
    lesson_id: lessonId,
    track_id: trackId,
    quiz_answers: quizAnswers,
    quiz_correct: quizCorrect,
    quiz_submitted_at: quizSubmittedAt ?? (hasQuiz ? nowIso : null),
    code_language: codeLanguage,
    code_submitted: codeSubmitted,
    code_result: codeResult,
    completed_at: completedAt,
  };

  const { error: insertError } = await admin
    .from("academy_lesson_runs")
    .insert(runRow);

  if (insertError) {
    console.error("/api/academy/lesson-run insert error:", insertError);
    return json({ error: insertError.message }, 500);
  }

  // Update latest state if table exists; ignore errors to avoid blocking history logging
  try {
    await admin.from("academy_lesson_runs_meta").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        track_id: trackId,
        last_quiz_answers: quizAnswers,
        last_quiz_correct: quizCorrect,
        last_quiz_submitted_at: quizSubmittedAt ?? (hasQuiz ? nowIso : null),
        last_code_language: codeLanguage,
        last_code_submitted: codeSubmitted,
        last_code_result: codeResult,
        last_completed_at: completedAt,
        updated_at: nowIso,
      },
      { onConflict: "user_id,lesson_id" }
    );
  } catch (err) {
    console.warn(
      "/api/academy/lesson-run meta upsert warning:",
      (err as Error).message || err
    );
  }

  return json({ ok: true });
}
