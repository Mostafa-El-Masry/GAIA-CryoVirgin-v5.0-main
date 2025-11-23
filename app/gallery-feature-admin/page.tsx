'use client';

import { useEffect, useState } from 'react';
import type { MediaItem } from '@/app/gallery-awakening/mediaTypes';
import { MediaCard } from '@/app/gallery-awakening/components/MediaCard';

type GalleryFeatureSource = 'auto' | 'manual';

interface GalleryApiResponse {
  items: MediaItem[];
}

interface FeaturePostResponse {
  ok: boolean;
  date?: string | null;
  source?: GalleryFeatureSource;
  error?: string;
}

interface FeatureHistoryRow {
  id: string;
  feature_date: string;
  source: GalleryFeatureSource;
  payload_json: any;
  created_at: string;
}

interface FeatureHistoryResponse {
  ok: boolean;
  history: FeatureHistoryRow[];
  error?: string;
}

// GAIA · Gallery 4.1 – Week 3
//
// Internal admin surface for Gallery features.
// Route: /gallery-feature-admin
//
// This page lets YOU (the creator) browse Gallery items and manually
// pin one as "today's feature", using POST /api/gallery/feature with
// source = 'manual'.
//
// It also shows a small history list from gallery_daily_features.
//
// Notes:
//   - This does NOT alter the main Gallery UI.
//   - It is safe to delete this page without breaking anything else.
//   - The Dashboard card simply reads whatever is stored for today.

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GalleryFeatureAdminPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [filterQuery, setFilterQuery] = useState('');

  const [featureDate, setFeatureDate] = useState<string>(todayIso());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [history, setHistory] = useState<FeatureHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilter(filterQuery);
  }, [items, filterQuery]);

  const loadItems = async () => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) {
        throw new Error(`Gallery API error: ${res.status}`);
      }
      const data = (await res.json()) as GalleryApiResponse;
      const list = (data.items ?? []) as MediaItem[];
      setItems(list);
    } catch (err: any) {
      setItemsError(err?.message ?? 'Failed to load gallery items.');
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch('/api/gallery/feature/history?limit=60');
      const data = (await res.json()) as FeatureHistoryResponse;
      if (!data.ok) {
        throw new Error(data.error || 'Failed to load feature history.');
      }
      setHistory(data.history ?? []);
    } catch (err: any) {
      setHistoryError(err?.message ?? 'Failed to load feature history.');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const applyFilter = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFilteredItems(items);
      return;
    }
    const filtered = items.filter((item: any) => {
      const candidates = [
        item.title,
        item.name,
        item.filename,
        item.alt,
        item.category,
        item.id,
      ]
        .filter(Boolean)
        .map((v: any) => String(v).toLowerCase());

      return candidates.some((field) => field.includes(q));
    });
    setFilteredItems(filtered);
  };

  const niceLabelForMedia = (item: any): string => {
    return (
      item.title ||
      item.name ||
      item.filename ||
      item.alt ||
      item.category ||
      item.id ||
      '(untitled)'
    );
  };

  const handleFilterChange = (value: string) => {
    setFilterQuery(value);
  };

  const setAsFeature = async (item: MediaItem) => {
    const key = (item as any).id ?? niceLabelForMedia(item);
    setSavingId(key);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const body = {
        feature: item,
        source: 'manual' as GalleryFeatureSource,
        date: featureDate || undefined,
      };
      const res = await fetch('/api/gallery/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as FeaturePostResponse;
      if (!data.ok) {
        throw new Error(data.error || 'Failed to save feature.');
      }
      setSaveMessage(
        `Set feature for ${data.date || featureDate} (source: ${data.source || 'manual'}).`
      );
      // Refresh history so we can see it in the list
      loadHistory();
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save feature.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 flex flex-col items-center">
      <section className="w-full max-w-6xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Gallery Feature Admin
          </h1>
          <p className="text-sm opacity-70">
            Internal tools for GAIA Gallery 4.1. Use this page to pick any Gallery item
            (image or video) and set it as the daily feature for a specific date. The
            Dashboard card will read this and surface it as Today&apos;s highlight.
          </p>
        </header>

        {/* Date + status */}
        <section className="rounded-md border bg-black/5 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide opacity-60">
                Feature date
              </p>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={featureDate}
                  onChange={(e) => setFeatureDate(e.target.value)}
                  className="rounded-md border bg-black/10 px-2 py-1"
                />
                <button
                  type="button"
                  onClick={() => setFeatureDate(todayIso())}
                  className="inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-black/10"
                >
                  Today
                </button>
              </div>
            </div>
            <div className="space-y-1 text-[11px] text-right">
              {saveMessage && (
                <p className="text-emerald-400">{saveMessage}</p>
              )}
              {saveError && (
                <p className="text-red-500">{saveError}</p>
              )}
            </div>
          </div>
          <p className="text-[11px] opacity-70">
            When you click &quot;Set as feature&quot; on any item below, GAIA will store a
            snapshot of that item for the chosen date in <code>gallery_daily_features</code>.
            The Dashboard highlight will show that saved feature (if the date is today).
          </p>
        </section>

        {/* Filter + items list */}
        <section className="rounded-md border bg-black/5 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">
                Pick a Gallery item
              </h2>
              <p className="text-xs opacity-70">
                This list comes directly from <code>/api/gallery</code>, so it includes
                both local and R2-based media.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="search"
                placeholder="Filter by title / filename / category…"
                value={filterQuery}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-56 rounded-md border bg-black/10 px-2 py-1"
              />
            </div>
          </div>

          {loadingItems && (
            <p className="text-[11px] opacity-70">Loading gallery items…</p>
          )}
          {itemsError && (
            <p className="text-[11px] text-red-500">
              {itemsError}
            </p>
          )}

          {!loadingItems && !itemsError && filteredItems.length === 0 && (
            <p className="text-[11px] opacity-70">
              No items match this filter. Try clearing the search box or add more media to
              your Gallery.
            </p>
          )}

          {!loadingItems && !itemsError && filteredItems.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item: any) => {
                const key = item.id || niceLabelForMedia(item);
                return (
                  <article
                    key={key}
                    className="flex flex-col rounded-lg border bg-black/10 p-2 gap-2"
                  >
                    <div className="rounded-md overflow-hidden border border-white/5 bg-black/60">
                      <MediaCard item={item} />
                    </div>
                    <div className="flex flex-col gap-1 text-[11px]">
                      <p className="font-medium truncate">
                        {niceLabelForMedia(item)}
                      </p>
                      {item.category && (
                        <p className="opacity-70">
                          Category: <span className="font-mono">{item.category}</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAsFeature(item)}
                        disabled={savingId === (item.id || niceLabelForMedia(item))}
                        className="inline-flex items-center justify-center rounded-md border px-2.5 py-1 font-medium hover:bg-black/20 disabled:opacity-60"
                      >
                        {savingId === (item.id || niceLabelForMedia(item)) ? 'Saving…' : 'Set as feature'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* History */}
        <section className="rounded-md border bg-black/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">
                Feature history
              </h2>
              <p className="text-xs opacity-70">
                Recent rows from <code>gallery_daily_features</code>. This is useful to
                confirm that GAIA is storing the feature you expect.
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-black/10 disabled:opacity-60"
            >
              {loadingHistory ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {historyError && (
            <p className="text-[11px] text-red-500">
              {historyError}
            </p>
          )}

          {!loadingHistory && !historyError && history.length === 0 && (
            <p className="text-[11px] opacity-70">
              No feature history yet. Once you start saving features (auto or manual),
              the latest entries will appear here.
            </p>
          )}

          {!loadingHistory && !historyError && history.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-md border border-white/5 bg-black/10">
              <table className="w-full text-[11px]">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">Date</th>
                    <th className="px-2 py-1 text-left font-medium">Source</th>
                    <th className="px-2 py-1 text-left font-medium">Label</th>
                    <th className="px-2 py-1 text-left font-medium">Stored at</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const label = niceLabelForMedia(row.payload_json || {});
                    return (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-2 py-1 whitespace-nowrap">
                          {row.feature_date}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          {row.source}
                        </td>
                        <td className="px-2 py-1">
                          {label}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap opacity-70">
                          {row.created_at}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
