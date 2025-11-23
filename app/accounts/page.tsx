"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type CsvRow = Record<string, string>;

/**
 * Very small CSV parser for the call center exports.
 * Assumes:
 * - Comma as separator
 * - No quoted commas inside fields
 */
function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim());

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function extractFirstDateFromDetails(detailRows: CsvRow[]): string | null {
  for (const row of detailRows) {
    const value = row["Answered"];
    if (typeof value === "string") {
      const match = value.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) return match[1];
    }
  }
  return null;
}

function buildSummarySheet(summaryRows: CsvRow[], detailRows: CsvRow[]) {
  // Try to get a date label from details, if available
  const dateLabel = extractFirstDateFromDetails(detailRows);
  const title =
    dateLabel != null ? `Call Center-Report-${dateLabel}` : "Call Center-Report";

  // Filter out empty & "Total" rows
  const branches = summaryRows.filter((row) => {
    const q = row["Queue"];
    if (!q) return false;
    const trimmed = q.trim().toLowerCase();
    return trimmed.length > 0 && trimmed !== "total";
  });

  const totalRow = summaryRows.find((row) => {
    const q = row["Queue"];
    if (!q) return false;
    return q.trim().toLowerCase() === "total";
  });

  // Header row (Excel row 1)
  const aoa: (string | number)[][] = [];
  aoa.push([
    title,
    "Branch",
    "Total Calls",
    "Answered",
    "Missed & Abandoned",
    "AVG Handle Time",
    "AVG Waiting Time (Answered Calls)",
    "AVG Waiting Time (All Calls)",
    "Max Waiting Time (All Calls)",
    "Average Talking Time",
    "Abandon Rate",
    "Sales Rate",
  ]);

  // Column headers (Excel row 2)
  aoa.push([
    "Sl No",
    "Branch",
    "Total Calls",
    "Answered",
    "Missed & Abandoned",
    "AVG Handle Time",
    "AVG Waiting Time (Answered Calls)",
    "AVG Waiting Time (All Calls)",
    "Max Waiting Time (All Calls)",
    "Average Talking Time",
    "Abandon Rate",
    "Sales Rate",
  ]);

  let index = 1;
  let totalCalls = 0;

  for (const row of branches) {
    const totalCallsNum = Number(row["Total Calls"] ?? 0) || 0;
    const answeredNum = Number(row["Answered"] ?? 0) || 0;
    const missedNum = Number(row["Missed"] ?? 0) || 0;
    const abandonedNum = Number(row["Abandoned"] ?? 0) || 0;
    const missedAndAbandoned = missedNum + abandonedNum;

    const abandonRateRaw = row["Abandon Rate"] ?? "";
    let abandonRate: number | string = "";
    const match =
      typeof abandonRateRaw === "string"
        ? abandonRateRaw.match(/([\d.]+)%/)
        : null;
    if (match) {
      abandonRate = parseFloat(match[1]) / 100;
    }

    aoa.push([
      index,
      row["Queue"] ?? "",
      totalCallsNum,
      answeredNum,
      missedAndAbandoned,
      row["AVG Handle Time"] ?? "",
      row["AVG Waiting Time (Answered Calls)"] ?? "",
      row["AVG Waiting Time (All Calls)"] ?? "",
      row["Max Waiting Time (All Calls)"] ?? "",
      row["Average Talking Time"] ?? "",
      abandonRate,
      "", // Sales Rate left for manual input for now
    ]);

    totalCalls += totalCallsNum;
    index++;
  }

  // Total row
  aoa.push([
    "",
    "Total",
    totalRow?.["Total Calls"] ?? totalCalls,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Call Center Report");
  return wb;
}

function buildDetailsSheet(detailRows: CsvRow[]) {
  const aoa: (string | number)[][] = [];

  // Headers
  aoa.push([
    "Queue",
    "Answered",
    "Missed",
    "Abandoned",
    "AVG Handle Time",
    "AVG Waiting Time (Answered Calls)",
    "AVG Waiting Time (All Calls)",
  ]);

  let currentQueueName: string | null = null;

  for (const row of detailRows) {
    const queueCell = row["Queue"];
    const totalCalls = row["Total Calls"];
    const answered = row["Answered"];
    const missed = row["Missed"];
    const abandoned = row["Abandoned"];
    const handle = row["AVG Handle Time"];
    const waitAnswered = row["AVG Waiting Time (Answered Calls)"];
    const waitAll = row["AVG Waiting Time (All Calls)"];

    // When Queue has a value and Total Calls looks numeric, it's a summary line (per branch)
    if (queueCell && queueCell.trim().length > 0) {
      currentQueueName = queueCell.trim();
      continue;
    }

    // Skip header-like rows inside the detailed export
    if (totalCalls === "ID" || answered === "Time" || missed === "Call From") {
      continue;
    }

    // We only care about rows that look like actual calls
    if (!answered || !missed || !abandoned) {
      continue;
    }

    // Derive branch name from the "Abandoned" column if possible, e.g. "Qurtuba 1<776>"
    let queueFromAbandoned: string | null = null;
    if (typeof abandoned === "string") {
      const match = abandoned.match(/^(.+?)</);
      if (match) {
        queueFromAbandoned = match[1].trim();
      } else if (abandoned.toUpperCase() === "NONE" && currentQueueName) {
        queueFromAbandoned = currentQueueName;
      }
    }

    const queueName = queueFromAbandoned ?? currentQueueName ?? "";

    aoa.push([
      queueName,
      answered,
      missed,
      abandoned,
      handle ?? "",
      waitAnswered ?? "",
      waitAll ?? "",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Call Center Details");
  return wb;
}

function downloadWorkbook(wb: XLSX.WorkBook, fileName: string) {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("File reading aborted"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

export default function AccountsPage() {
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [detailsFile, setDetailsFile] = useState<File | null>(null);
  const [monthLabel, setMonthLabel] = useState<string>("Nov'2025");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
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

      const summaryRows = parseCsv(summaryText);
      const detailRows = parseCsv(detailsText);

      if (summaryRows.length === 0 || detailRows.length === 0) {
        setError("One of the CSV files appears to be empty.");
        return;
      }

      const summaryWb = buildSummarySheet(summaryRows, detailRows);
      const detailsWb = buildDetailsSheet(detailRows);

      const label = monthLabel.trim() || "MonthYear";

      downloadWorkbook(summaryWb, `Call Center Report-${label}.xlsx`);
      downloadWorkbook(detailsWb, `Call Center Report-Details-${label}.xlsx`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Something went wrong while generating reports.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Accounts · Call Center Mirror Bot
          </h1>
          <p className="text-sm text-neutral-500">
            Upload the two raw call center CSV exports and generate the
            formatted{" "}
            <span className="font-medium">Call Center Report</span> and{" "}
            <span className="font-medium">Call Center Report Details</span>{" "}
            workbooks automatically.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4 sm:p-6 shadow-lg shadow-black/40">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-200">
                Summary CSV (per-branch totals)
              </label>
              <p className="text-xs text-neutral-500">
                This is the file that only has one row per Queue (branch),
                usually the first download you get in the morning.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) =>
                  setSummaryFile(e.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full cursor-pointer text-sm text-neutral-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-500"
              />
              {summaryFile && (
                <p className="mt-1 text-xs text-emerald-400">
                  Selected: {summaryFile.name}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-200">
                Detailed CSV (branch details + calls)
              </label>
              <p className="text-xs text-neutral-500">
                This is the file that contains the same queues on top, followed
                by many rows with individual calls (ID, time, call from, etc.).
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) =>
                  setDetailsFile(e.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full cursor-pointer text-sm text-neutral-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-500"
              />
              {detailsFile && (
                <p className="mt-1 text-xs text-emerald-400">
                  Selected: {detailsFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr,auto] sm:items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-200">
                Month label for file names
              </label>
              <p className="text-xs text-neutral-500">
                Used only for the downloaded file names, e.g.{" "}
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-[11px]">
                  Call Center Report-Nov&apos;2025.xlsx
                </code>
                .
              </p>
              <input
                type="text"
                value={monthLabel}
                onChange={(e) => setMonthLabel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-sm text-neutral-100 outline-none ring-emerald-500/60 focus:border-emerald-500 focus:ring-2"
                placeholder="Nov'2025"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing || !summaryFile || !detailsFile}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500/60 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {isProcessing ? "Generating…" : "Generate Reports"}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-neutral-200">
            How this works (current version)
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-500">
            <li>
              The summary CSV is used to build the{" "}
              <span className="font-medium text-neutral-300">
                Call Center Report
              </span>{" "}
              sheet with Sl No, branch, totals, and abandon rate (converted from
              the percentage column).
            </li>
            <li>
              The detailed CSV is cleaned into the{" "}
              <span className="font-medium text-neutral-300">
                Call Center Report Details
              </span>{" "}
              sheet by extracting the branch name, call time, caller number, and
              waiting times from each call row.
            </li>
            <li>
              Sales Rate is left empty for now so you can continue filling it
              from your sales data the same way you do today.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
