"use client";

import dynamic from "next/dynamic";
import TodoDaily from "./TodoDaily";
import { useDailyRitualGate } from "../hooks/useDailyRitualGate";

const DashboardClient = dynamic(() => import("./DashboardClient"), {
  ssr: false,
});

export default function DashboardWrapper() {
  const { completedToday, ready } = useDailyRitualGate();

  if (!ready) {
    return (
      <div className="space-y-8">
        <TodoDaily />
        <section className="h-40 rounded-2xl border border-[var(--gaia-border)] bg-[var(--gaia-surface-soft)] p-6 shadow-lg">
          <div className="h-full w-full animate-pulse rounded-xl bg-[var(--gaia-surface)]/60" />
        </section>
      </div>
    );
  }

  if (!completedToday) {
    return (
      <div className="space-y-8">
        <TodoDaily />

        <section className="rounded-2xl border border-[var(--gaia-border)] bg-[var(--gaia-surface-soft)] p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-[var(--gaia-text-strong)]">
            Daily Gate · Ritual not finished
          </h2>
          <p className="mt-2 text-sm text-[var(--gaia-text-muted)]">
            Finish your Life, Work, and Distraction slots in &quot;Today&apos;s Focus&quot; above to unlock the rest of GAIA for today.
          </p>
        </section>
      </div>
    );
  }

  return <DashboardClient completedToday={completedToday ?? false} ready={ready} />;
}
