"use client";

import Link from "next/link";
import type { ArcDefinition } from "../types";
import { arcs } from "./arcs";

export default function ProgrammingPathPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <header className="mb-8 space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-gray-500">
          Apollo Academy · Path
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
          Programming
        </h1>
        <p className="text-base sm:text-lg text-gray-400">
          Your main developer path: HTML, CSS, JavaScript, React, Next.js, Tailwind and
          more.
        </p>
        <div>
          <Link
            href="/apollo/Academy/Paths"
            className="inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1 text-xs sm:text-sm text-gray-300 hover:border-emerald-400 hover:text-emerald-200"
          >
            ← Back to all paths
          </Link>
        </div>
      </header>

      <section className="space-y-6">
        {arcs.map((arc: ArcDefinition) => (
          <article
            key={arc.id}
            className="rounded-2xl border border-gray-800 bg-black/40 p-4 sm:p-5 lg:p-6 shadow-sm"
          >
            <header className="mb-3 space-y-1 sm:space-y-1.5">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500">
                Programming · {`Arc ${arc.label}`}
              </p>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                {arc.title}
              </h2>
              {arc.description && (
                <p className="text-sm sm:text-base text-gray-400">
                  {arc.description}
                </p>
              )}
            </header>

            <div className="rounded-xl border border-gray-700 bg-black/60 p-3 sm:p-4">
              {arc.lessons.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No lessons wired yet. This arc is an empty shell ready to be filled.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {arc.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm sm:text-base text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 text-xs font-medium text-gray-300">
                          {lesson.code}
                        </span>
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                      <span className="text-[11px] sm:text-xs text-gray-500">
                        {lesson.status === "active"
                          ? "Empty (ready to write)"
                          : "Archived"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
