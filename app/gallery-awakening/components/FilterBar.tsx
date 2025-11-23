'use client';

import React from 'react';

export type SortMode = 'recent' | 'most_viewed' | 'most_loved';

interface FilterBarProps {
  availableTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  sortMode: SortMode;
  onChangeSort: (mode: SortMode) => void;
  sourceLabel: string;
  lastUpdated: string | null;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  availableTags,
  activeTags,
  onToggleTag,
  sortMode,
  onChangeSort,
  sourceLabel,
  lastUpdated,
  isLoading
}) => {
  const sorts: { id: SortMode; label: string }[] = [
    { id: 'recent',       label: 'Recently added' },
    { id: 'most_viewed',  label: 'Most viewed' },
    { id: 'most_loved',   label: 'Most loved' }
  ];

  const lastUpdatedLabel =
    lastUpdated != null ? new Date(lastUpdated).toLocaleString() : 'not yet synced';

  return (
    <section className="space-y-3 rounded-3xl border border-base-300 bg-base-100 p-4 text-xs text-base-content shadow-inner shadow-base-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-base-content/60">Sort</span>
          <div className="inline-flex overflow-hidden rounded-full border border-base-300 bg-base-200">
            {sorts.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeSort(s.id)}
                className={`px-3 py-1 text-[11px] font-medium transition ${
                  sortMode === s.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-base-content hover:bg-base-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-base-content/70">
          <span className="rounded-full border border-base-300 bg-base-200 px-2 py-0.5">
            Source: <span className="font-medium text-base-content">{sourceLabel}</span>
          </span>
          <span className="rounded-full border border-base-300 bg-base-200 px-2 py-0.5">
            Last updated: <span className="font-medium text-base-content">{lastUpdatedLabel}</span>
          </span>
          {isLoading && (
            <span className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              Loading...
            </span>
          )}
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-base-content/60">
            <span>Tags</span>
            {activeTags.length > 0 && (
              <span className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                {activeTags.length} selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-full px-2 py-0.5 text-[11px] transition ${
                    active
                      ? 'border border-primary/70 bg-primary/15 text-primary shadow-sm shadow-primary/20'
                      : 'border border-base-300 bg-base-200 text-base-content hover:bg-base-300'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
