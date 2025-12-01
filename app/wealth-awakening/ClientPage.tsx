"use client";

import { useEffect, useState } from "react";
import type {
  WealthOverview,
  WealthState,
  WealthLevelsSnapshot,
  WealthLevelDefinition,
} from "./lib/types";
import {
  loadWealthState,
  loadWealthStateWithRemote,
} from "./lib/wealthStore";
import { buildWealthOverview, getTodayInKuwait } from "./lib/summary";
import { buildLevelsSnapshot } from "./lib/levels";
import { hasSupabaseConfig } from "./lib/remoteWealth";
import { getExchangeRate } from "./lib/exchangeRate";
import WealthSnapshot from "./components/WealthSnapshot";
import WealthMap from "./components/WealthMap";
import QuickLinks from "./components/QuickLinks";
import WealthAlerts from "./components/WealthAlerts";
import BlendsStrip from "./components/BlendsStrip";

type FxInfo = {
  rate: number;
  timestamp: number;
  isCached: boolean;
};

function getLevelDefinitions(snapshot: WealthLevelsSnapshot | null) {
  if (!snapshot) {
    return {
      current: null as WealthLevelDefinition | null,
      next: null as WealthLevelDefinition | null,
    };
  }
  const current =
    snapshot.currentLevelId != null
      ? snapshot.levels.find((l) => l.id === snapshot.currentLevelId) ?? null
      : null;
  const next =
    snapshot.nextLevelId != null
      ? snapshot.levels.find((l) => l.id === snapshot.nextLevelId) ?? null
      : null;
  return { current, next };
}

function buildLevelHeadline(snapshot: WealthLevelsSnapshot | null): string {
  if (!snapshot) {
    return "GAIA needs at least one month of expenses to place you on the ladder.";
  }
  const { current } = getLevelDefinitions(snapshot);
  if (!current) {
    return "You are at the starting line. Once expenses and interest are logged for at least one month, GAIA will place you on the ladder.";
  }

  const order = current.order ?? 0;
  if (order <= 2) {
    return "You are in the early buffer zone. This is still a 'poor' level, but it is a starting point, not a verdict.";
  }
  if (order <= 4) {
    return "You are in the stability-building zone. You are no longer at the very bottom; the focus now is deepening your runway.";
  }
  return "You are in a strong stability / wealth zone. The main work from here is maintenance and gentle optimisation, not stress.";
}

function buildPlanHeadline(
  snapshot: WealthLevelsSnapshot | null,
  overview: WealthOverview | null,
): string {
  if (!snapshot || !overview) {
    return "Log grouped expenses and any interest events for at least one month so GAIA can suggest a concrete next step.";
  }

  const { next } = getLevelDefinitions(snapshot);
  const monthsSaved = snapshot.monthsOfExpensesSaved;
  const expenses = snapshot.estimatedMonthlyExpenses;
  const currency = overview.primaryCurrency;

  if (
    !next ||
    monthsSaved == null ||
    !Number.isFinite(monthsSaved) ||
    !expenses ||
    !Number.isFinite(expenses)
  ) {
    return "Keep logging income, deposits, expenses, and interest. GAIA will refine your next step as the picture becomes clearer.";
  }

  const targetMonths = next.minMonthsOfExpenses ?? monthsSaved;
  if (!Number.isFinite(targetMonths) || targetMonths <= monthsSaved) {
    return "You are very close to the next level. A few more consistent months of saving will push you over the line.";
  }

  const deltaMonths = targetMonths - monthsSaved;
  const additionalNeeded = deltaMonths * expenses;

  const formattedNeeded = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(additionalNeeded);

  const levelName = next.name || "your next level";

  return `If you can add roughly ${formattedNeeded} into your buffers / certificates over time, you will cross into ${levelName}. Small, repeatable moves are enough.`;
}

export default function WealthAwakeningClientPage() {
  const [overview, setOverview] = useState<WealthOverview | null>(null);
  const [levelsSnapshot, setLevelsSnapshot] =
    useState<WealthLevelsSnapshot | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "syncing" | "synced" | "local-only" | "no-supabase"
  >("syncing");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [fxInfo, setFxInfo] = useState<FxInfo | null>(null);

  // Detect whether Supabase is configured on the client
  useEffect(() => {
    setSupabaseEnabled(hasSupabaseConfig());
  }, []);

  // Load Wealth state (local + Supabase) and build overview + levels
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setSyncStatus(supabaseEnabled ? "syncing" : "no-supabase");
      let state: WealthState;
      try {
        state = await loadWealthStateWithRemote();
        if (!supabaseEnabled) {
          setSyncStatus("no-supabase");
        } else {
          setSyncStatus("synced");
        }
      } catch (error) {
        console.warn("Wealth Awakening: falling back to local state only:", error);
        state = loadWealthState();
        setSyncStatus(supabaseEnabled ? "local-only" : "no-supabase");
      }

      if (cancelled) return;

      const today = getTodayInKuwait();
      const ov = buildWealthOverview(state, today);
      setOverview(ov);
      const snapshot = buildLevelsSnapshot(ov);
      setLevelsSnapshot(snapshot);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

  // Load FX rate (KWD → EGP) with 24h cache
  useEffect(() => {
    let cancelled = false;

    async function hydrateFx() {
      const info = await getExchangeRate();
      if (!cancelled) {
        setFxInfo(info);
      }
    }

    hydrateFx();

    return () => {
      cancelled = true;
    };
  }, []);

  const syncLabel =
    syncStatus === "syncing"
      ? "Syncing with Supabase..."
      : syncStatus === "synced"
      ? "Synced with Supabase"
      : syncStatus === "local-only"
      ? "Local mode (Supabase unreachable)"
      : "Local cache only";

  const syncTone =
    syncStatus === "synced"
      ? "bg-success/10 text-success border-success/40"
      : syncStatus === "syncing"
      ? "bg-warning/10 text-warning border-warning/40"
      : "bg-base-200 text-base-content/70 border-base-300";

  const levelHeadline = buildLevelHeadline(levelsSnapshot);
  const planHeadline = buildPlanHeadline(levelsSnapshot, overview);

  const fxText =
    fxInfo && fxInfo.rate > 0
      ? `1 KWD ≈ ${fxInfo.rate.toFixed(2)} EGP · ${
          fxInfo.isCached ? "cached in last 24h" : "fresh"
        }`
      : null;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <main className="mx-auto max-w-6xl lg:max-w-7xl px-4 py-8 space-y-6">
        <section className="rounded-2xl bg-white border border-slate-200 shadow-md p-6">
          {!overview ? (
            <div className="text-sm text-slate-500">Loading your Wealth data…</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Wealth Awakening
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {overview.primaryCurrency} Net Worth
                    </h1>
                    <p className="text-sm text-slate-500">
                      Live snapshot of your buffers, certificates, and flows.
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${syncTone}`}
                    >
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
                      {syncLabel}
                    </span>
                    {fxText && (
                      <span className="text-[11px] text-slate-500">{fxText}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-red-50 to-white h-64 flex items-center justify-center text-slate-400">
                  {/* Placeholder chart-style area */}
                  <div className="w-full h-full flex flex-col justify-between p-4">
                    <div className="h-[1px] bg-slate-200" />
                    <div className="h-[1px] bg-slate-200" />
                    <div className="h-[1px] bg-slate-200" />
                    <div className="h-20 rounded-lg bg-gradient-to-r from-red-200/60 via-red-100/40 to-red-200/60" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    Demo trend for layout preview.
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    Your numbers update as you log flows.
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Converter
                  </p>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Cash to buffer
                  </h3>
                  <p className="text-sm text-slate-500">
                    Move your monthly surplus into your base currency quickly.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600">From</label>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between">
                    <input
                      className="bg-transparent outline-none text-sm font-semibold text-slate-900 w-full"
                      defaultValue="1000"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {overview.primaryCurrency}
                    </span>
                  </div>

                  <label className="text-xs font-semibold text-slate-600">To</label>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between">
                    <input
                      className="bg-transparent outline-none text-sm font-semibold text-slate-900 w-full"
                      defaultValue="1000"
                    />
                    <span className="text-sm font-semibold text-slate-700">USD</span>
                  </div>
                </div>

                <button className="w-full rounded-full bg-emerald-500 text-white font-semibold py-3 shadow-sm hover:bg-emerald-600 transition">
                  Calculate contribution
                </button>

                <div className="text-xs text-slate-500">
                  FX uses your Wealth settings. Adjust them in the Plans section.
                </div>
              </div>
            </div>
          )}
        </section>

        {!overview ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-md">
            Loading your Wealth map and snapshot...
          </section>
        ) : (
          <>
            <section>
              <WealthSnapshot overview={overview} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current level
                </h2>
                <p className="mt-2 text-sm text-slate-700">{levelHeadline}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current plan
                </h2>
                <p className="mt-2 text-sm text-slate-700">{planHeadline}</p>
              </article>
            </section>

            <div>
              <BlendsStrip snapshot={levelsSnapshot} />
            </div>

            <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <WealthMap overview={overview} />
              <QuickLinks />
            </section>

            <section>
              <WealthAlerts overview={overview} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
