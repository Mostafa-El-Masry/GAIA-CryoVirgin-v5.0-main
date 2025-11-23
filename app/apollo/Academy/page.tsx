"use client";

import Link from "next/link";
import { useMemo } from "react";
import { lessonsByTrack, type TrackId } from "./lessonsMap";
import { useAcademyProgress } from "./useAcademyProgress";

type TrackSummaryView = {
  id: TrackId;
  title: string;
  href: string;
};

const TRACKS: TrackSummaryView[] = [
  {
    id: "programming",
    title: "Web Programming · Builder of Worlds",
    href: "/apollo/academy/programming",
  },
  {
    id: "accounting",
    title: "Accounting · Keeper of Numbers",
    href: "/apollo/academy/accounting",
  },
  {
    id: "self-repair",
    title: "Self-Repair · Rebuilding Me",
    href: "/apollo/academy/self-repair",
  },
];

function formatPercent(completed: number, total: number) {
  if (!total) return "0%";
  const pct = Math.round((completed / total) * 100);
  return `${pct}%`;
}

function formatNiceDate(d: Date): string {
  try {
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function getTodayTrackId(date: Date): TrackId {
  // JS getDay: 0 = Sunday, 6 = Saturday
  const dow = date.getDay();
  // For now we assume:
  //   Sun, Mon, Tue  → Programming
  //   Wed, Thu, Sat  → Accounting
  //   Fri            → Self-Repair
  if (dow === 5) return "self-repair";
  if (dow === 0 || dow === 1 || dow === 2) return "programming";
  return "accounting";
}

function getMinutesForDay(trackId: TrackId, date: Date): number {
  const dow = date.getDay();
  // Study ladder: 30 → 45 → 60 minutes across the three track days.
  if (trackId === "programming") {
    if (dow === 0) return 60;
    if (dow === 1) return 45;
    if (dow === 2) return 30;
  }
  if (trackId === "accounting") {
    if (dow === 3) return 30;
    if (dow === 4) return 45;
    if (dow === 6) return 60;
  }
  if (trackId === "self-repair") {
    // Fridays: one solid hour for reflection/soul work.
    return 60;
  }
  return 30;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export default function AcademyPage() {
  const { state, isLessonCompleted } = useAcademyProgress();
  const today = useMemo(() => new Date(), []);
  const todayIso = today.toISOString().slice(0, 10);
  const niceDate = formatNiceDate(today);
  const todayTrackId = getTodayTrackId(today);
  const todayMinutes = getMinutesForDay(todayTrackId, today);
  const todayLessons = lessonsByTrack[todayTrackId] ?? [];
  const incompleteToday = todayLessons.filter(
    (lesson) => !isLessonCompleted(todayTrackId, lesson.id)
  );
  const suggestedCount =
    todayMinutes <= 30 ? 1 : todayMinutes <= 45 ? 2 : 3;
  const suggestedLessons = incompleteToday.slice(0, suggestedCount);

  const todayTrackState = state.byTrack[todayTrackId];
  const lastStudyDate = todayTrackState?.lastStudyDate;
  const daysSinceLast =
    lastStudyDate && lastStudyDate !== todayIso
      ? daysBetween(lastStudyDate, todayIso)
      : 0;

  const trackCards = TRACKS.map((track) => {
    const lessons = lessonsByTrack[track.id] ?? [];
    const total = lessons.length;
    const completed =
      state.byTrack[track.id]?.completedLessonIds.length ?? 0;
    const percent = formatPercent(completed, total);

    return {
      ...track,
      total,
      completed,
      percent,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Daily study dashboard */}
      <section className="rounded-2xl gaia-panel-soft p-4 sm:p-5 shadow-sm border border-white/5 space-y-2">
        <p className="text-xs gaia-muted">Academy · Daily Schedule</p>
        <h1 className="text-xl font-semibold">
          Welcome, Sasa.
        </h1>
        <p className="text-sm gaia-muted">
          Today is <span className="gaia-strong">{niceDate}</span>.
        </p>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3 space-y-2">
          <p className="text-xs gaia-muted">
            Today&apos;s focus:{" "}
            <span className="gaia-strong">
              {todayTrackId === "programming"
                ? "Web Programming"
                : todayTrackId === "accounting"
                ? "Accounting"
                : "Self-Repair"}
            </span>{" "}
            ·{" "}
            <span className="gaia-strong">
              {todayMinutes} minutes
            </span>
            .
          </p>

          {suggestedLessons.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] gaia-muted">
                Suggested lesson
                {suggestedLessons.length > 1 ? "s" : ""} for today:
              </p>
              <ul className="space-y-1 text-xs gaia-muted">
                {suggestedLessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-baseline justify-between gap-2 rounded-lg bg-black/20 px-2 py-1"
                  >
                    <span className="gaia-strong text-[11px] w-12">
                      {lesson.code}
                    </span>
                    <span className="flex-1">{lesson.title}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-2">
                <Link
                  href={`/apollo/academy/${todayTrackId}#${suggestedLessons[0]?.id}`}
                  className="inline-flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-[11px] font-semibold gaia-accent hover:border-white/40 hover:bg-white/5 transition"
                >
                  Start today&apos;s session →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-[11px] gaia-muted">
              You&apos;ve completed all planned lessons in this path.
              You can review, practice, or study ahead in another
              path if you feel like it.
            </p>
          )}

          {daysSinceLast > 1 && (
            <p className="text-[11px] gaia-muted mt-1">
              You last studied this path{" "}
              <span className="gaia-strong">
                {daysSinceLast} day
                {daysSinceLast === 1 ? "" : "s"} ago
              </span>
              . Don&apos;t worry — just do what you can today and
              we&apos;ll catch up slowly.
            </p>
          )}
        </div>

        <p className="text-[11px] gaia-muted mt-2">
          After you&apos;re done, you can come back here to see your
          updated percentage and what&apos;s next.
        </p>
      </section>

      {/* Track cards */}
      <section className="space-y-3">
        {trackCards.map((track) => (
          <Link
            key={track.id}
            href={track.href}
            className="group block rounded-2xl gaia-panel-soft p-4 sm:p-5 shadow-sm border border-white/5 hover:border-white/15 hover:shadow-md transition"
          >
            <div className="space-y-2">
              <h2 className="text-sm font-semibold gaia-strong">
                {track.title}
              </h2>

              <div className="mt-2 flex items-baseline justify-between text-xs gaia-muted">
                <span className="font-semibold gaia-strong">
                  {track.percent} complete
                </span>
                <span>
                  {track.completed} / {track.total} lessons
                </span>
              </div>

              <p className="mt-3 text-[11px] font-semibold gaia-accent group-hover:underline">
                Enter path →
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}