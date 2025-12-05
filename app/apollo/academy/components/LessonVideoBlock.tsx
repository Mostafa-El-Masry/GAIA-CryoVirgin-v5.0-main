"use client";

import React, { useMemo, useState } from "react";

type LessonVideoBlockProps = {
  title: string;
  youtubeId: string;
  durationLabel?: string;
};

export const LessonVideoBlock: React.FC<LessonVideoBlockProps> = ({
  title,
  youtubeId,
  durationLabel,
}) => {
  if (!youtubeId) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const embedUrl = useMemo(
    () =>
      `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`,
    [youtubeId]
  );
  const [blocked, setBlocked] = useState(false);

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4 space-y-3">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] gaia-muted">
            Lesson video
          </p>
          <h3 className="text-sm sm:text-base font-semibold gaia-strong">
            {title}
          </h3>
          {durationLabel && (
            <p className="text-[11px] sm:text-xs gaia-muted">
              Approx. duration:{" "}
              <span className="font-semibold">{durationLabel}</span>
            </p>
          )}
        </div>
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] sm:text-xs font-medium gaia-muted hover:bg-white/10"
        >
          Open on YouTube ↗
        </a>
      </header>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/40 bg-black">
        {!blocked ? (
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setBlocked(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 text-center text-sm text-slate-200 px-4">
            <p className="font-semibold">This video is blocking embeds.</p>
            <p className="text-xs text-slate-400">
              Some YouTube uploads disable playback inside other sites. Open it
              in a new tab to watch.
            </p>
            <a
              href={watchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Open on YouTube
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
