"use client";

const primaryButton =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold gaia-contrast shadow-sm transition hover:shadow-md gaia-focus";

export default function Toolbar({
  onNewSection,
}: {
  onNewSection: () => void;
}) {
  return (
    <div className="gaia-surface flex flex-wrap items-center gap-3 rounded-2xl border gaia-border px-4 py-3 shadow-sm">
      <button className={primaryButton} onClick={onNewSection}>
        New section (N)
      </button>
    </div>
  );
}
