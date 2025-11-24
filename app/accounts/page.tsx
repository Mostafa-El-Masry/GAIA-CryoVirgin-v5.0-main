"use client";

import { useState } from "react";

type Company = {
  id: string;
  name: string;
  slug: string;
  isNew?: boolean;
};

/**
 * Helper to read a File as UTF-8 text.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("File reading aborted"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

/**
 * This is the original Call Center + Python UI you already have,
 * now wrapped in its own component so we can reuse it for each company.
 * The internal logic is unchanged – it still calls:
 *   /api/accounts/call-center-python
 * and downloads a ZIP of the two Excel reports.
 */
function CallCenterPythonPanel({ companyName }: { companyName: string }) {
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [detailsFile, setDetailsFile] = useState<File | null>(null);
  const [monthLabel, setMonthLabel] = useState<string>("Nov'2025");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGeneratePython() {
    try {
      setError(null);
      if (!summaryFile || !detailsFile) {
        setError("Please select both CSV files first.");
        return;
      }

      setIsProcessing(true);

      const [summaryText, detailsText] = await Promise.all([
        readFileAsText(summaryFile),
        readFileAsText(detailsFile),
      ]);

      const label = monthLabel.trim() || "MonthYear";

      const res = await fetch("/api/accounts/call-center-python", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summaryCsv: summaryText,
          detailsCsv: detailsText,
          monthLabel: label,
        }),
      });

      if (!res.ok) {
        let message = "Server error while generating reports.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CallCenterReports-${label}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Something went wrong while generating reports.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100/80 p-4 sm:p-6 shadow-lg">
      <header className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Call Center · Mirror Bot (Python)
        </h2>
        <p className="text-xs text-base-content/70">
          Company: <span className="font-medium">{companyName}</span>
        </p>
        <p className="text-xs text-base-content/70">
          Upload the two raw call center CSV exports and let GAIA call the
          Python engine to generate the fully formatted{" "}
          <span className="font-medium">Call Center Report</span> and{" "}
          <span className="font-medium">Call Center Report Details</span> as an
          Excel ZIP.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Summary CSV (per-branch totals)
          </label>
          <p className="text-xs text-base-content/70">
            This is the file that only has one row per Queue (branch), usually
            the first download you get in the morning.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setSummaryFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-content hover:file:bg-primary-focus"
          />
          {summaryFile && (
            <p className="mt-1 text-xs text-success">
              Selected: {summaryFile.name}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Detailed CSV (branch details + calls)
          </label>
          <p className="text-xs text-base-content/70">
            This is the file that contains the same queues on top, followed by
            many rows with individual calls (ID, time, call from, etc.).
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setDetailsFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-content hover:file:bg-primary-focus"
          />
          {detailsFile && (
            <p className="mt-1 text-xs text-success">
              Selected: {detailsFile.name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr,auto] sm:items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Month label for file names
          </label>
          <p className="text-xs text-base-content/70">
            Used in the downloaded file names, e.g.{" "}
            <code className="rounded bg-base-200 px-1.5 py-0.5 text-[11px]">
              Call Center Report-Nov&apos;2025.xlsx
            </code>
            .
          </p>
          <input
            type="text"
            value={monthLabel}
            onChange={(e) => setMonthLabel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-base-300 bg-base-100 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/60"
            placeholder="Nov'2025"
          />
        </div>

        <button
          type="button"
          onClick={handleGeneratePython}
          disabled={isProcessing || !summaryFile || !detailsFile}
          className="inline-flex items-center justify-center rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-content shadow-md transition hover:bg-primary-focus disabled:cursor-not-allowed disabled:border-base-300 disabled:bg-base-200 disabled:text-base-content/60"
        >
          {isProcessing ? "Generating with Python…" : "Generate Reports (Python)"}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-base-300 bg-base-200/70 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
          Notes about the Python engine
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-base-content/80">
          <li>
            This button calls a local Python script{" "}
            <code className="rounded bg-base-100 px-1 py-0.5 text-[11px]">
              scripts/call_center_report.py
            </code>{" "}
            on your machine.
          </li>
          <li>
            Python 3 and{" "}
            <code className="rounded bg-base-100 px-1 py-0.5 text-[11px]">
              openpyxl
            </code>{" "}
            must be installed.
          </li>
          <li>
            The script loads your formatted Excel template from{" "}
            <code className="rounded bg-base-100 px-1 py-0.5 text-[11px]">
              public/templates/CallCenterReportTemplate.xlsx
            </code>{" "}
            so colours, borders, merged cells and charts follow that file.
          </li>
          <li>
            GAIA only passes the raw CSV data and month label; all formatting
            logic happens in Python using your own template.
          </li>
        </ul>
      </div>
    </section>
  );
}

export default function AccountsPage() {
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "mikoshi",
      name: "Mikoshi",
      slug: "mikoshi",
    },
  ]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("mikoshi");
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const selectedCompany =
    companies.find((c) => c.id === selectedCompanyId) ?? companies[0];

  function handleAddCompany() {
    setIsAdding(true);
    setNewCompanyName("");
  }

  function handleSaveNewCompany() {
    const trimmed = newCompanyName.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `${slug || "company"}-${Date.now()}`;
    const nextCompany: Company = {
      id,
      name: trimmed,
      slug: slug || "company",
      isNew: true,
    };
    setCompanies((prev) => [...prev, nextCompany]);
    setSelectedCompanyId(id);
    setIsAdding(false);
  }

  function handleCancelNewCompany() {
    setIsAdding(false);
    setNewCompanyName("");
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        {/* Left rail: company selector */}
        <aside className="w-full max-w-xs rounded-2xl border border-base-300 bg-base-100/80 p-4 lg:w-72">
          <header className="mb-3 space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">
              Accounts · Companies
            </h1>
            <p className="text-xs text-base-content/70">
              v5.1 · Multi-company shell · Week 1
              <br />
              <span className="text-[11px]">
                Mon Feb 1, 2027 → Sun Feb 7, 2027
              </span>
            </p>
          </header>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              Select company
            </p>
            <div className="space-y-1">
              {companies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    company.id === selectedCompanyId
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content hover:bg-base-300"
                  }`}
                >
                  <span>{company.name}</span>
                  {company.isNew && (
                    <span className="rounded-full bg-base-100/30 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      New
                    </span>
                  )}
                </button>
              ))}
            </div>

            {!isAdding ? (
              <button
                type="button"
                onClick={handleAddCompany}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100 px-3 py-2 text-xs font-medium text-base-content/80 hover:bg-base-200"
              >
                + Add new company
              </button>
            ) : (
              <div className="mt-3 space-y-2 rounded-xl border border-base-300 bg-base-100 p-3">
                <p className="text-xs font-semibold text-base-content/80">
                  New company
                </p>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Company name"
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-2 py-1.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNewCompany}
                    className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-content hover:bg-primary-focus"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelNewCompany}
                    className="flex-1 rounded-lg bg-base-200 px-2 py-1.5 text-xs font-medium text-base-content/80 hover:bg-base-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-base-300 bg-base-100/80 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
              Wiring checklist (per new company)
            </h2>
            <ul className="mt-2 list-decimal space-y-1 pl-5 text-xs text-base-content/80">
              <li>Provision the company in the database (future Supabase).</li>
              <li>
                Ensure all Accounts tables include a{" "}
                <code className="rounded bg-base-200 px-1 py-0.5 text-[10px]">
                  company_id
                </code>{" "}
                column.
              </li>
              <li>
                Configure any module-specific settings (Call Center, BRS,
                Commissions, etc.).
              </li>
              <li>
                Run a quick health check to confirm the company can load all
                modules without errors.
              </li>
            </ul>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-base-300 bg-base-200 px-2 py-1.5 text-xs font-medium text-base-content/80 hover:bg-base-300"
            >
              Run wiring check (placeholder)
            </button>
            <p className="mt-1 text-[11px] text-base-content/60">
              This button will later verify DB + modules and hide these notes
              once everything is wired correctly.
            </p>
          </div>
        </aside>

        {/* Main content: modules for selected company */}
        <main className="flex-1 space-y-5">
          <header className="rounded-2xl border border-base-300 bg-base-100/80 p-4 sm:p-5">
            <h2 className="text-base font-semibold">
              {selectedCompany ? selectedCompany.name : "Company"} · Modules
            </h2>
            <p className="mt-1 text-xs text-base-content/70">
              This company will eventually share the same Accounts logic: Call
              Center, BRS, Sales, Commissions, and more. For now, Call Center
              (Python) is fully wired; other modules are placeholders.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                Call Center · Active
              </span>
              <span className="rounded-full bg-base-200 px-2 py-0.5 text-base-content/70">
                BRS · Coming soon
              </span>
              <span className="rounded-full bg-base-200 px-2 py-0.5 text-base-content/70">
                Sales / Assets · Coming soon
              </span>
              <span className="rounded-full bg-base-200 px-2 py-0.5 text-base-content/70">
                Commissions · Coming soon
              </span>
            </div>
          </header>

          <CallCenterPythonPanel companyName={selectedCompany?.name ?? "Mikoshi"} />
        </main>
      </div>
    </div>
  );
}
