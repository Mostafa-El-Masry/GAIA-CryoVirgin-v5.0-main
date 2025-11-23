'use client';

import React, { useMemo } from 'react';
import type { MediaItem, MediaType } from '../mediaTypes';
import { MediaCard } from './MediaCard';
import { Lightbox } from './MediaLightbox';

interface MediaGridProps {
  title: string;
  items: MediaItem[];
  typeFilter: MediaType;
  page?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  title,
  items,
  typeFilter,
  page,
  perPage,
  onPageChange,
}) => {
  const filtered = useMemo(
    () => items.filter((item) => item.type === typeFilter),
    [items, typeFilter]
  );

  if (filtered.length === 0) {
    return null;
  }

  const imageItems = filtered.filter((i) => i.type === 'image');

  const totalPages =
    perPage && perPage > 0 ? Math.max(1, Math.ceil(filtered.length / perPage)) : 1;
  const currentPage = perPage && perPage > 0 ? Math.min(page ?? 1, totalPages) : 1;
  const start = perPage && perPage > 0 ? (currentPage - 1) * perPage : 0;
  const end = perPage && perPage > 0 ? start + perPage : filtered.length;
  const paged = filtered.slice(start, end);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const handleOpen = (item: MediaItem) => {
    setActiveId(item.id);
  };

  const handleClose = () => setActiveId(null);

  return (
    <section className="space-y-4 rounded-3xl border border-base-300 bg-base-100 p-4 shadow-inner shadow-base-200/70">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-base-content">{title}</h2>
        <p className="text-xs text-base-content/70">
          {filtered.length} {typeFilter === 'image' ? 'images' : 'videos'}
        </p>
      </header>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {paged.map((item) => (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <MediaCard item={item} onPreview={item.type === 'image' ? handleOpen : undefined} />
          </div>
        ))}
      </div>

      {totalPages > 1 && onPageChange && perPage && (
        <div className="flex items-center justify-between gap-3 text-xs text-base-content/70">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-base-300 bg-base-200 px-3 py-1 text-[11px] transition hover:bg-base-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-base-300 bg-base-200 px-3 py-1 text-[11px] transition hover:bg-base-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {activeId && (
        <Lightbox
          items={imageItems}
          activeId={activeId}
          onClose={handleClose}
          onChange={(id) => setActiveId(id)}
        />
      )}
    </section>
  );
};
