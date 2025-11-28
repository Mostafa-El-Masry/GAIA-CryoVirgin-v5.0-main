"use client";

import { useEffect, useMemo, useState } from "react";
import { selfRepairArcs, totalSelfRepairLessons, type Lesson } from "./trackConfig";
import { getLessonContent } from "./lessonContent";
import { useAcademyProgress } from "../useAcademyProgress";

// The lessons and arcs live in `trackConfig.ts`; this file only renders them.

export default function SelfRepairTrackPage() {
const allLessons: Lesson[] = useMemo(
  () => selfRepairArcs.flatMap((arc) => arc.lessons),
  []
);

const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

const activeLessonIndex = useMemo(
  () => (activeLessonId ? allLessons.findIndex((l) => l.id === activeLessonId) : -1),
  [activeLessonId, allLessons]
);

const activeLesson =
  activeLessonIndex >= 0 && activeLessonIndex < allLessons.length
    ? allLessons[activeLessonIndex]
    : null;

const prevLesson =
  activeLessonIndex > 0 && activeLessonIndex < allLessons.length
    ? allLessons[activeLessonIndex - 1]
    : null;

const nextLesson =
  activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1
    ? allLessons[activeLessonIndex + 1]
    : null;

  const { isLessonCompleted, toggleLessonCompleted, markStudyVisit } = useAcademyProgress();

  useEffect(() => {
    markStudyVisit("self-repair");
  }, [markStudyVisit]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Self-Repair · Rebuilding Me</h1>
        <p className="text-sm gaia-muted max-w-2xl">
          This track has no fixed end date. It&apos;s the quiet work of taking yourself seriously
          again — body, mind, and story — while you keep studying and working.
        </p>
        <p className="text-xs gaia-muted mt-1">
          Total planned reflections / lessons:{" "}
            <span className="gaia-strong">{totalSelfRepairLessons}</span>. You keep Fridays free from heavy
          studying and use them for this path: reflection, walks, reading, and honest check-ins.
        </p>
      </header>

{activeLesson && (
  <section className="rounded-2xl gaia-panel-soft border border-white/10 p-4 sm:p-5 space-y-4">
    <header className="space-y-2">
      <div className="flex items-start justify-between">
        <h2 className="text-lg sm:text-xl font-semibold gaia-strong">
          {activeLesson.code} · {activeLesson.title}
        </h2>
        <button
          type="button"
          onClick={() => setActiveLessonId(null)}
          className="ml-4 mt-1 rounded-full border px-3 py-1 text-[11px] sm:text-xs bg-black/10 hover:bg-black/20"
        >
          Back to list
        </button>
      </div>
      <p className="text-xs sm:text-sm gaia-muted">
        Self-Repair · Arc 1 · Stabilizing the Basics
      </p>
      <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs gaia-muted">
        <span>
          Estimated time:{" "}
          <span className="gaia-strong">
            {(() => {
              if (!activeLesson) return "";
              const content = getLessonContent(activeLesson.code);
              return content.minutes === 0 ? "0 min (MBT)" : `${content.minutes} min`;
            })()}
          </span>
        </span>
        <span className="opacity-60">·</span>
        <span>
          Status:{" "}
          <span className="gaia-strong">
            {isLessonCompleted("self-repair", activeLesson.id) ? "Completed" : "In progress"}
          </span>
        </span>
      </div>
    </header>

    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
          disabled={!prevLesson}
          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] sm:text-xs ${
            prevLesson
              ? "border-white/30 bg-white/5 hover:bg-white/10 gaia-muted"
              : "border-white/10 bg-black/20 text-white/40 cursor-default"
          }`}
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => nextLesson && nextLesson.code === "1.1" ? setActiveLessonId(nextLesson.id) : null}
          disabled={!nextLesson}
          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] sm:text-xs ${
            nextLesson
              ? "border-white/30 bg-white/5 hover:bg-white/10 gaia-muted"
              : "border-white/10 bg-black/20 text-white/40 cursor-default"
          }`}
        >
          Next →
        </button>
      </div>
    </div>

    <div className="space-y-4">
      <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed gaia-muted">
        <h3 className="text-sm sm:text-base font-semibold gaia-strong">
          Today&apos;s focus: mapping your current work rhythm
        </h3>
        <p>
          For this first Self-Repair lesson, you are not fixing anything. You are just
          putting your current pattern on the table so it stops hiding in the dark.
        </p>
        <p>
          Choose one workday (today or yesterday) and write it as a timeline: when you
          woke up, commuted, worked, scrolled, ate, played, watched, and finally went to
          sleep. No judgment. Just facts.
        </p>
        <p>
          Notice which moments feel heavy, empty, or blurry. These are usually the
          autopilot zones: late-night scrolling, gaming to avoid thinking, ordering food
          because everything feels too much.
        </p>
      </div>

      <div className="rounded-2xl border border-white/15 bg-black/40 p-3 sm:p-4 space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-gray-200">
          Workshop · Rebuild Me at Work
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-gray-200">
          <li>Write your full workday as a simple timeline.</li>
          <li>Circle or highlight the moments where you typically escape or shut down.</li>
          <li>Next to each of those moments, write one honest sentence about what you are trying not to feel or think.</li>
          <li>Choose just one of these moments and star it. This will be your first repair point for future lessons.</li>
        </ol>
        <p className="mt-2 text-[11px] sm:text-xs text-gray-200">
          You can keep these notes in your own notebook, in GAIA notes, or both. Later
          lessons will use this map as a reference.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isLessonCompleted("self-repair", activeLesson.id)) {
            toggleLessonCompleted("self-repair", activeLesson.id);
          }
        }}
        className="inline-flex items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-emerald-50 hover:bg-emerald-400/20"
      >
        {isLessonCompleted("self-repair", activeLesson.id)
          ? "Lesson completed"
          : "Mark lesson as done"}
      </button>
    </div>
  </section>
)}



      {!activeLesson && (
      <section className="space-y-4">
        {selfRepairArcs.map((arc) => (
          <article
            key={arc.id}
            className="rounded-2xl gaia-panel-soft p-4 sm:p-5 shadow-sm border border-white/5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] gaia-muted">
              {arc.label}
            </p>
            <h2 className="mt-1 text-sm font-semibold gaia-strong">{arc.title}</h2>
            <p className="mt-2 text-xs gaia-muted">{arc.focus}</p>

            <ul className="mt-3 space-y-1.5 text-xs gaia-muted">
              {arc.lessons.map((lesson) => (
                <li
                  id={lesson.id}
                  key={lesson.id}
                  className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1 last:border-b-0 last:pb-0"
                >
                  <button
                    type="button"
                    onClick={() => setActiveLessonId(lesson.id)}
                    className="flex w-full items-baseline justify-between gap-2 text-left"
                  >
                    <span className="text-[11px] w-4">
                      {isLessonCompleted("self-repair", lesson.id) ? "✓" : ""}
                    </span>
                    <span className="gaia-strong text-[11px] w-10">
                      {lesson.code}
                    </span>
                    <span className="flex-1">{lesson.title}</span>
                    <span className="text-[11px]">{(() => {
                      const content = getLessonContent(lesson.code);
                      if (content.minutes === 0) return "0 min";
                      if (lesson.estimate === "Flexible") return `${content.minutes} min`;
                      return lesson.estimate;
                    })()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      )}
    </main>
  );
}