'use client';

import React from 'react';

interface DashboardVersionBadgeProps {
  className?: string;
  levelLabel?: string;
  versionLabel?: string;
  codename?: string;
}

// GAIA Level 3 – Dashboard Pulse
// Version 4.2 · Week 6
//
// DashboardVersionBadge
// ---------------------
// Small pill that shows which GAIA Level + Version the current
// Dashboard core belongs to. This is mainly for you when recording
// videos or screenshots so you can always see "Level 3 · 4.2".
//
// No data, no Supabase, just static text with optional overrides.

const DashboardVersionBadge: React.FC<DashboardVersionBadgeProps> = ({
  className = '',
  levelLabel = 'GAIA Level 3',
  versionLabel = '4.2 · Dashboard Pulse',
  codename = 'Guardian Core · Dashboard',
}) => {
  return (
    <div
      className={`inline-flex flex-col items-end gap-1 rounded-xl border border-zinc-800/70 bg-black/60 px-3 py-2 text-[10px] text-zinc-300 ${className}`}
    >
      <div className="inline-flex items-center gap-2">
        <span className="rounded-full bg-emerald-500/15 px-2 py-[2px] text-[10px] font-semibold text-emerald-200">
          {levelLabel}
        </span>
        <span className="rounded-full bg-zinc-800/80 px-2 py-[2px] text-[10px] text-zinc-200">
          v{versionLabel}
        </span>
      </div>
      <span className="text-[10px] text-zinc-500">{codename}</span>
    </div>
  );
};

export default DashboardVersionBadge;
