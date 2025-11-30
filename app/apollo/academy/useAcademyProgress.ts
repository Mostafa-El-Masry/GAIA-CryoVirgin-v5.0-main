"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readJSON,
  writeJSON,
  subscribe,
  waitForUserStorage,
} from "@/lib/user-storage";
import type { TrackId } from "./lessonsMap";

type TrackProgress = {
  completedLessonIds: string[];
  startedOn?: string; // YYYY-MM-DD
  lastStudyDate?: string; // YYYY-MM-DD
};

export type AcademyProgressState = {
  byTrack: Record<TrackId, TrackProgress>;
};

const STORAGE_KEY = "gaia_academy_progress_v1";

const EMPTY_STATE: AcademyProgressState = {
  byTrack: {
    programming: { completedLessonIds: [] },
    accounting: { completedLessonIds: [] },
    "self-repair": { completedLessonIds: [] },
  },
};

function safeParseState(raw: unknown): AcademyProgressState {
  if (!raw || typeof raw !== "object") return EMPTY_STATE;
  try {
    const parsed = raw as AcademyProgressState;
    if (!parsed.byTrack) return EMPTY_STATE;
    return {
      byTrack: {
        programming: {
          completedLessonIds:
            parsed.byTrack.programming?.completedLessonIds ?? [],
          startedOn: parsed.byTrack.programming?.startedOn,
          lastStudyDate: parsed.byTrack.programming?.lastStudyDate,
        },
        accounting: {
          completedLessonIds:
            parsed.byTrack.accounting?.completedLessonIds ?? [],
          startedOn: parsed.byTrack.accounting?.startedOn,
          lastStudyDate: parsed.byTrack.accounting?.lastStudyDate,
        },
        "self-repair": {
          completedLessonIds:
            parsed.byTrack["self-repair"]?.completedLessonIds ?? [],
          startedOn: parsed.byTrack["self-repair"]?.startedOn,
          lastStudyDate: parsed.byTrack["self-repair"]?.lastStudyDate,
        },
      },
    };
  } catch {
    return EMPTY_STATE;
  }
}

function todayIsoDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function useAcademyProgress() {
  const [state, setState] = useState<AcademyProgressState>(() => {
    const cached =
      readJSON<AcademyProgressState | null>(STORAGE_KEY, null);
    return cached ? safeParseState(cached) : EMPTY_STATE;
  });

  // Hydrate from user-storage (local + Supabase) on first client render
  useEffect(() => {
    let cancelled = false;

    async function hydrateFromUserStorage() {
      await waitForUserStorage();
      if (cancelled) return;
      const stored =
        readJSON<AcademyProgressState | null>(STORAGE_KEY, null);
      if (!stored) {
        setState(EMPTY_STATE);
        return;
      }
      setState(safeParseState(stored));
    }

    void hydrateFromUserStorage();

    const unsubscribe = subscribe(({ key }) => {
      if (!key || key !== STORAGE_KEY) return;
      const stored =
        readJSON<AcademyProgressState | null>(STORAGE_KEY, null);
      if (!stored) {
        setState(EMPTY_STATE);
        return;
      }
      setState(safeParseState(stored));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const updateState = useCallback(
    (updater: (prev: AcademyProgressState) => AcademyProgressState) => {
      setState((prev) => {
        const next = updater(prev);
        // Persist into user-storage (local + Supabase)
        writeJSON(STORAGE_KEY, next);
        return next;
      });
    },
    []
  );

  const toggleLessonCompleted = useCallback(
    (trackId: TrackId, lessonId: string) => {
      updateState((prev) => {
        const today = todayIsoDate();
        const track = prev.byTrack[trackId] ?? {
          completedLessonIds: [],
        };
        const already = track.completedLessonIds.includes(lessonId);
        const nextCompleted = already
          ? track.completedLessonIds.filter((id) => id !== lessonId)
          : [...track.completedLessonIds, lessonId];

        return {
          byTrack: {
            ...prev.byTrack,
            [trackId]: {
              completedLessonIds: nextCompleted,
              startedOn: track.startedOn ?? today,
              lastStudyDate: today,
            },
          },
        };
      });
    },
    [updateState]
  );

  const markStudyVisit = useCallback(
    (trackId: TrackId) => {
      updateState((prev) => {
        const today = todayIsoDate();
        const track = prev.byTrack[trackId] ?? {
          completedLessonIds: [],
        };

        return {
          byTrack: {
            ...prev.byTrack,
            [trackId]: {
              ...track,
              startedOn: track.startedOn ?? today,
              lastStudyDate: today,
            },
          },
        };
      });
    },
    [updateState]
  );

  const isLessonCompleted = useCallback(
    (trackId: TrackId, lessonId: string) => {
      const track = state.byTrack[trackId];
      return track?.completedLessonIds.includes(lessonId) ?? false;
    },
    [state.byTrack]
  );

  return {
    state,
    isLessonCompleted,
    toggleLessonCompleted,
    markStudyVisit,
  };
}
