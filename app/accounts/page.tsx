"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type CsvRow = Record<string, string>;

/**
 * Small CSV parser for the call center exports.
 * Assumes:
 * - Comma as separator
 * - No quoted commas inside fields
 * - First row is the header row
 * Also strips a UTF-8 BOM if it exists on the first header cell.
 */
function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, "");
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

function parsePercentToFraction(raw: unknown): number | string {
  if (typeof raw !== "string") return "";
  const match = raw.match(/([\d.]+)%/);
  if (!match) return "";
  const num = parseFloat(match[1]);
  if (Number.isNaN(num)) return "";
  return num / 100;
}
function computeCallCenterCounts(detailRows: CsvRow[]) {
  let sarah = 0;
  let steffi = 0;

  for (const row of detailRows) {
    // Summary lines have a Queue value; detail lines have empty Queue
    const queue = (row["Queue"] ?? "").trim();
    if (queue !== "") continue;

    // In the detailed section, because of the second header,
    // "Abandoned" actually holds the Agent, and
    // "AVG Handle Time" holds the Status ("Answered", "Abandoned(UnHandled//)", etc.)
    const agent = (row["Abandoned"] ?? "").trim();
    const status = (row["AVG Handle Time"] ?? "").trim();

    if (status !== "Answered") continue;

    if (agent === "Call Center<887>") {
      sarah++;
    } else if (agent === "Call Center<888>") {
      steffi++;
    }
  }

  return { sarah, steffi };
}

function buildSummarySheet(summaryRows: CsvRow[], detailRows: CsvRow[]) {
  // Try to get a date label from details, if available
  const dateLabel = extractFirstDateFromDetails(detailRows);
  const title =
    dateLabel != null
      ? `Call Center-Report-${dateLabel}`
      : "Call Center-Report";

  // Filter out empty & "Total" rows: these are your branches/queues
  const branches = summaryRows.filter((row) => {
    const q = row["Queue"];
    if (!q) return false;
    const trimmed = q.trim().toLowerCase();
    return trimmed.length > 0 && trimmed !== "total";
  });

  // Find the total row if present
  const totalRow = summaryRows.find((row) => {
    const q = row["Queue"];
    if (!q) return false;
    return q.trim().toLowerCase() === "total";
  });

  // Count Call Center answered calls from the detail CSV
  const { sarah, steffi } = computeCallCenterCounts(detailRows);

  // Header row (Excel row 1)
  const aoa: (string | number | null)[][] = [];
  aoa.push([
    title,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  // Column headers (Excel row 2) – match your template exactly
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
    "Answered Rate",
    "Abandon Rate",
    "Sales Rate",
  ]);

  let index = 1;
  let totalCallsFromBranches = 0;

  // Branch rows (Sabah Al Salam, Qurtuba 1, etc.)
  for (const row of branches) {
    const totalCallsNum = Number(row["Total Calls"] ?? 0) || 0;
    const answeredNum = Number(row["Answered"] ?? 0) || 0;
    const missedNum = Number(row["Missed"] ?? 0) || 0;
    const abandonedNum = Number(row["Abandoned"] ?? 0) || 0;
    const missedAndAbandoned = missedNum + abandonedNum;

    const answeredRateRaw = row["Answered Rate"] ?? "";
    const abandonRateRaw = row["Abandon Rate"] ?? "";

    let answeredRate: number | string = "";
    let abandonRate: number | string = "";

    if (typeof answeredRateRaw === "string") {
      const m = answeredRateRaw.match(/([\d.]+)%/);
      if (m) answeredRate = parseFloat(m[1]) / 100;
    }

    if (typeof abandonRateRaw === "string") {
      const m = abandonRateRaw.match(/([\d.]+)%/);
      if (m) abandonRate = parseFloat(m[1]) / 100;
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
      answeredRate,
      abandonRate,
      "", // Sales Rate left for manual input
    ]);

    totalCallsFromBranches += totalCallsNum;
    index++;
  }

  // Extra rows: Call Center <887-Sarah> and Call Center <888-Steffi>
  // These appear as rows 9 and 10 in your sheet for that day
  aoa.push([
    index,
    "Call Center <887-Sarah>",
    sarah,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  index++;

  aoa.push([
    index,
    "Call Center <888-Steffi>",
    steffi,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  // Total row – exactly as in your file, only branches included
  const totalCalls =
    totalRow?.["Total Calls"] != null
      ? Number(totalRow["Total Calls"]) || 0
      : totalCallsFromBranches;
  const totalAnswered =
    totalRow?.["Answered"] != null ? Number(totalRow["Answered"]) || 0 : null;
  const totalMissed =
    totalRow?.["Missed"] != null ? Number(totalRow["Missed"]) || 0 : null;
  const totalAbandoned =
    totalRow?.["Abandoned"] != null ? Number(totalRow["Abandoned"]) || 0 : null;

  const totalMissedAndAbandoned =
    totalMissed != null && totalAbandoned != null
      ? totalMissed + totalAbandoned
      : null;

  aoa.push([
    null,
    "Total",
    totalCalls,
    totalAnswered,
    totalMissedAndAbandoned,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  // Build sheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // --- Row heights to match your report ---
  // Row indices here are 0-based for '!rows'
  const rowsMeta: any[] = [];
  for (let r = 0; r < aoa.length; r++) {
    if (r === 0) {
      // title row (row 1 in Excel)
      rowsMeta[r] = { hpt: 20.4 };
    } else if (r === 1) {
      // header row (row 2 in Excel)
      rowsMeta[r] = { hpt: 72.0 };
    } else if (r === aoa.length - 1) {
      // total row
      rowsMeta[r] = { hpt: 21.0 };
    } else {
      // normal data rows
      rowsMeta[r] = { hpt: 16.5 };
    }
  }
  (ws as any)["!rows"] = rowsMeta;

  // --- Basic header styling (background color + bold, center, wrap) ---
  const headerRowIndex = 1; // row 2 in Excel, 0-based index 1
  for (let c = 0; c < 13; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    const cell = ws[cellRef];
    if (!cell) continue;
    if (!cell.s) (cell as any).s = {};
    (cell as any).s.fill = {
      patternType: "solid",
      fgColor: { rgb: "FFD9D9D9" }, // neutral light grey
      bgColor: { rgb: "FFD9D9D9" },
    };
    (cell as any).s.font = {
      bold: true,
    };
    (cell as any).s.alignment = {
      vertical: "center",
      horizontal: "center",
      wrapText: true,
    };
  }

  // --- Total row background + bold ---
  const totalRowIndex = aoa.length - 1;
  for (let c = 0; c < 13; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c });
    const cell = ws[cellRef];
    if (!cell) continue;
    if (!cell.s) (cell as any).s = {};
    (cell as any).s.fill = {
      patternType: "solid",
      fgColor: { rgb: "FFEFEFEF" },
      bgColor: { rgb: "FFEFEFEF" },
    };
    (cell as any).s.font = {
      bold: true,
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Call Center Report");
  return wb;
}

function buildDetailsSheet(detailRows: CsvRow[]) {
  const aoa: (string | number | null)[][] = [];

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

    // Summary line (one per queue at the top) - sets current branch and is skipped
    if (queueCell && queueCell.trim().length > 0) {
      currentQueueName = queueCell.trim();
      continue;
    }

    // Header-like line inside each queue block ("ID / Time / Call From / ...") - skip
    if (totalCalls === "ID" || answered === "Time" || missed === "Call From") {
      continue;
    }

    const queueName = currentQueueName ?? "";

    aoa.push([
      queueName,
      answered || null,
      missed || null,
      abandoned || null,
      handle || null,
      waitAnswered || null,
      waitAll || null,
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
    <main className="min-h-screen w-full gaia-surface-soft px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight gaia-strong">
            Accounts - Call Center Mirror Bot
          </h1>
          <p className="text-sm gaia-muted">
            Upload the two raw call center CSV exports and generate the
            formatted
            <span className="font-medium text-[inherit]">
              {" "}
              Call Center Report
            </span>{" "}
            and
            <span className="font-medium text-[inherit]">
              {" "}
              Call Center Report Details
            </span>{" "}
            workbooks automatically.
          </p>
        </header>

        <section className="rounded-2xl border gaia-border gaia-panel-soft p-4 sm:p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold gaia-strong">
                Summary CSV (per-branch totals)
              </label>
              <p className="text-xs gaia-muted">
                This is the file that only has one row per Queue (branch),
                usually the first download you get in the morning.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSummaryFile(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full cursor-pointer rounded-xl border gaia-border gaia-input text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--gaia-contrast-bg)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--gaia-contrast-text)] hover:file:opacity-90"
              />
              {summaryFile && (
                <p className="mt-1 text-xs gaia-strong">
                  Selected: {summaryFile.name}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold gaia-strong">
                Detailed CSV (branch details + calls)
              </label>
              <p className="text-xs gaia-muted">
                This is the file that contains the same queues on top, followed
                by many rows with individual calls (ID, time, call from, etc.).
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setDetailsFile(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full cursor-pointer rounded-xl border gaia-border gaia-input text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--gaia-contrast-bg)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--gaia-contrast-text)] hover:file:opacity-90"
              />
              {detailsFile && (
                <p className="mt-1 text-xs gaia-strong">
                  Selected: {detailsFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr,auto] sm:items-end">
            <div className="space-y-1">
              <label className="text-sm font-semibold gaia-strong">
                Month label for file names
              </label>
              <p className="text-xs gaia-muted">
                Used only for the downloaded file names, e.g.
                <code className="ml-1 rounded bg-[color-mix(in_srgb,var(--gaia-surface)_92%,transparent)] px-1.5 py-0.5 text-[11px] gaia-strong">
                  Call Center Report-Nov&apos;2025.xlsx
                </code>
                .
              </p>
              <input
                type="text"
                value={monthLabel}
                onChange={(e) => setMonthLabel(e.target.value)}
                className="mt-1 w-full rounded-xl border gaia-border gaia-input px-3 py-1.5 text-sm gaia-strong focus:outline-none gaia-focus"
                placeholder="Nov'2025"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing || !summaryFile || !detailsFile}
              className="inline-flex items-center justify-center rounded-xl gaia-contrast px-4 py-2 text-sm font-semibold shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? "Generating..." : "Generate reports"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm gaia-negative">{error}</p>}
        </section>

        <section className="rounded-2xl border gaia-border gaia-panel-soft p-4 sm:p-5 shadow-sm">
          <h2 className="text-sm font-semibold gaia-strong">
            How this works (current version)
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs gaia-muted">
            <li>
              The summary CSV is used to build the
              <span className="font-medium text-[inherit]">
                {" "}
                Call Center Report
              </span>{" "}
              sheet with the same title row, column order and additional
              Answered / Abandon rates as your sample.
            </li>
            <li>
              The detailed CSV is cleaned into the
              <span className="font-medium text-[inherit]">
                {" "}
                Call Center Report Details
              </span>{" "}
              sheet, with one row per call and the same column order as your
              sample workbook.
            </li>
            <li>
              Sales Rate is left empty for now so you can continue filling it
              from your sales data the same way you do today.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
