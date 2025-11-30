"use client";

import Link from "next/link";
import { useState } from "react";
import { useAcademyProgress } from "../../useAcademyProgress";
import type { PathDefinition } from "../types";
import { lessonsByTrack, type TrackId, type LessonMeta } from "../../lessonsMap";

type Props = {
  trackId: TrackId;
  path: PathDefinition;
};

type CourseLesson = {
  id: string;
  code: string;
  title: string;
  minutes: number;
};

type Course = {
  section: string;
  label: string;
  title: string;
  summary: string;
  lessons: CourseLesson[];
  totalMinutes: number;
};

const SELF_REPAIR_MINUTES: Record<string, number> = {
  "1.1": 30,
  "1.2": 25,
  "1.3": 25,
  "1.4": 30,
};

const LEVEL_BY_TRACK: Record<TrackId, string> = {
  programming: "Beginner",
  accounting: "Intermediate",
  "self-repair": "Gentle foundations",
};

const TAG_BY_TRACK: Record<TrackId, string> = {
  programming: "Dev path",
  accounting: "Finance path",
  "self-repair": "Self-repair",
};

const SKILLS_BY_TRACK: Record<TrackId, string[]> = {
  programming: [
    "HTML",
    "CSS",
    "JavaScript",
    "Git & GitHub",
    "React / Next.js",
    "Supabase basics",
  ],
  accounting: [
    "Double-entry",
    "Financial statements",
    "Trial balance checks",
    "Accrual vs cash",
    "Audit basics",
  ],
  "self-repair": [
    "Self-observation",
    "Rhythm tracking",
    "Gentle movement",
    "Bad-days protocol",
  ],
};

const COURSE_META: Record<TrackId, { section: string; title: string; summary: string }[]> = {
  programming: [
    {
      section: "0",
      title: "Environment & Comfort with Your Machine",
      summary:
        "Get comfortable with files, folders, VS Code, the terminal, Git, and how the web works before you touch real projects.",
    },
    {
      section: "1",
      title: "Programming Mindset & Study System",
      summary:
        "Learn how to study without burning out, how to use GAIA as a study companion, and how to keep progress realistic.",
    },
    {
      section: "2",
      title: "HTML Foundations",
      summary:
        "Build the skeleton of web pages: structure, text, lists, links, images, and simple layouts.",
    },
    {
      section: "3",
      title: "CSS & Tailwind Foundations",
      summary:
        "Understand the box model, layout, responsive design, and how Tailwind fits into your projects.",
    },
    {
      section: "4",
      title: "JavaScript Essentials",
      summary:
        "Learn the JS basics you need for GAIA: variables, conditions, loops, functions, and working with the DOM.",
    },
  ],
  accounting: [
    {
      section: "1",
      title: "Re-ground in Accounting Basics",
      summary:
        "Reset your foundations: assets, liabilities, equity, and how debits/credits actually behave in real systems.",
    },
    {
      section: "2",
      title: "Financial Statements",
      summary:
        "Rebuild your understanding of balance sheet, income statement, and cash flow, including how they connect.",
    },
    {
      section: "3",
      title: "Operational Accounting",
      summary:
        "Look at day-to-day entries, accruals, and adjustments similar to what you do in real work.",
    },
    {
      section: "4",
      title: "Controls & Reviews",
      summary:
        "Focus on checks, reconciliations, and how to spot errors before they hit the statements.",
    },
    {
      section: "5",
      title: "Towards GAIA Accounting Center",
      summary:
        "Sketch how these skills will connect to future GAIA modules for salary, payroll, and QuickBooks reviews.",
    },
  ],
  "self-repair": [
    {
      section: "1",
      title: "Rebuild Me: Stabilizing the Basics",
      summary:
        "Map your current rhythm, add one tiny anchor, reconnect to movement, and define a bad-days baseline.",
    },
  ],
};

function getLessonMinutes(trackId: TrackId, code: string): number {
  if (trackId === "self-repair") {
    return SELF_REPAIR_MINUTES[code] ?? 0;
  }
  // For now other tracks have no detailed timings yet.
  return 0;
}

function buildCourses(trackId: TrackId): Course[] {
  const allLessons = lessonsByTrack[trackId] ?? [];
  const meta = COURSE_META[trackId] ?? [];
  const bySection = new Map<string, LessonMeta[]>();

  for (const lesson of allLessons) {
    const section = lesson.code.split(".")[0] ?? "";
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(lesson);
  }

  const courses: Course[] = meta.map((courseMeta, index) => {
    const sectionLessons = (bySection.get(courseMeta.section) ?? []).slice();
    sectionLessons.sort((a, b) => {
      const [aMajor, aMinor] = a.code.split(".").map(Number);
      const [bMajor, bMinor] = b.code.split(".").map(Number);
      if (aMajor !== bMajor) return (aMajor ?? 0) - (bMajor ?? 0);
      return (aMinor ?? 0) - (bMinor ?? 0);
    });

    const lessons: CourseLesson[] = sectionLessons.map((lesson, idx) => ({
      id: lesson.id,
      code: lesson.code,
      title: lesson.title,
      minutes: getLessonMinutes(trackId, lesson.code),
    }));

    const totalMinutes = lessons.reduce((sum, l) => sum + (l.minutes || 0), 0);

    return {
      section: courseMeta.section,
      label: `Course ${index + 1}`,
      title: courseMeta.title,
      summary: courseMeta.summary,
      lessons,
      totalMinutes,
    };
  });

  return courses;
}

function formatTotalDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0 min";
  if (totalMinutes < 60) return `${totalMinutes} minutes`;
  const hours = totalMinutes / 60;
  if (hours < 1.5) return "About 1 hour";
  if (hours < 2.5) return "About 2 hours";
  return `About ${Math.round(hours)} hours`;
}

export function PathCurriculum({ trackId, path }: Props) {
  const { isLessonCompleted } = useAcademyProgress();
  const courses = buildCourses(trackId);
  const [openSection, setOpenSection] = useState<string | null>(
    courses[0]?.section ?? null,
  );

  const totalMinutes = courses.reduce((sum, c) => sum + c.totalMinutes, 0);
  const durationLabel = formatTotalDuration(totalMinutes);
  const levelLabel = LEVEL_BY_TRACK[trackId];
  const tagLabel = TAG_BY_TRACK[trackId];
  const skills = SKILLS_BY_TRACK[trackId] ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      {/* Hero / overview */}
      <header className="space-y-4 mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Apollo Academy · Path overview
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
          {path.title}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-slate-600">
          {path.shortDescription}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm text-slate-600">
          <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            {tagLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            Level: {levelLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            Duration: {durationLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            Pacing: personal pace
          </span>
        </div>
      </header>

      {/* Skills list (small chips) */}
      {skills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Skills you&apos;ll touch
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Courses accordion */}
      <section className="space-y-4">
        {courses.map((course) => {
          const isOpen = openSection === course.section;
          return (
            <div
              key={course.section}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenSection((prev) =>
                    prev === course.section ? null : course.section,
                  )
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4"
              >
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {course.label}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-slate-900">
                    {course.title}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {course.lessons.length} lesson
                    {course.lessons.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] sm:text-xs text-slate-600">
                  {course.totalMinutes > 0 && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700">
                      {course.totalMinutes} min
                    </span>
                  )}
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-slate-600 text-sm ${
                      isOpen
                        ? "border-sky-400 bg-sky-50 text-sky-600"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {isOpen ? "-" : "+"}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 px-4 py-4 sm:px-6 sm:py-5 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {course.summary}
                  </p>
                  {course.lessons.length > 0 && (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70">
                      {course.lessons.map((lesson, idx) => (
                        <Link
                          key={lesson.id}
                          href={`/apollo/academy/Paths/lesson/${lesson.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-white transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
                              L{idx + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-medium text-slate-900">
                                {lesson.title}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Lesson {lesson.code}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {lesson.minutes > 0 && (
                              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 font-semibold">
                                {lesson.minutes} min
                              </div>
                            )}
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-medium ${
                                isLessonCompleted(trackId, lesson.id)
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-slate-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {isLessonCompleted(trackId, lesson.id)
                                ? "Done"
                                : "Pending"}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
