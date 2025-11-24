'use client';

import React from 'react';

interface FilterBarProps {
  availableTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  availableTags,
  activeTags,
  onToggleTag,
}) => {
  return (
    <section className="space-y-3 rounded-3xl border border-base-300 bg-base-100 p-4 text-xs text-base-content shadow-inner shadow-base-200/70">
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
