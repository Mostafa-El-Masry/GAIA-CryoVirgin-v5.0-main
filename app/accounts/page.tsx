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

  let headerLine = lines[0];
  // Strip UTF-8 BOM if present
  headerLine = headerLine.replace(/^\uFEFF/, "");

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

/**
 * Some rows are technically "Abandoned" in the raw export but later
 * handled by Call Center 887/888. In those rows:
 *
 * - Abandoned column = "NONE"
 * - Status column (AVG Handle Time) looks like
 *   "Abandoned(Handled/Call Center(887)/22/11/2025 01:52:03 PM)"
 *
 * For GAIA we want to credit these to the Call Center, so we
 * rewrite the Abandoned column to "Call Center<887>" or "Call Center<888>"
 * BEFORE we do any counting / sheet building.
 */
function normalizeDetailRows(detailRows: CsvRow[]): CsvRow[] {
  return detailRows.map((row) => {
    const next = { ...row };
    const abandoned = (next["Abandoned"] ?? "").trim().toUpperCase();
    const status = (next["AVG Handle Time"] ?? "").trim();

    const handled887 = /Handled\s*\/\s*Call Center\(887\)/i.test(status);
    const handled888 = /Handled\s*\/\s*Call Center\(888\)/i.test(status);

    if (abandoned === "NONE" && handled887) {
      next["Abandoned"] = "Call Center<887>";
    } else if (abandoned === "NONE" && handled888) {
      next["Abandoned"] = "Call Center<888>";
    }

    return next;
  });
}

/**
 * From the detailed CSV, count how many calls should be credited to
 * Call Center <887-Sara> and <888-Sansa>.
 *
 * In the CSV layout:
 * - "Abandoned" column actually holds the Agent for detailed rows
 * - "AVG Handle Time" holds the Status ("Answered", "Abandoned(...)", etc.)
 *
 * We count as Call Center work when:
 * - Agent is Call Center<887>/<888>
 * - AND status is either "Answered" OR a handled callback like
 *   "Abandoned(Handled/Call Center(887)/...)".
 */
function computeCallCenterCounts(detailRows: CsvRow[]) {
  let sarah = 0;
  let steffi = 0;

  for (const row of detailRows) {
    const agent = (row["Abandoned"] ?? "").trim();
    const status = (row["AVG Handle Time"] ?? "").trim();

    const isCallCenter887 =
      agent === "Call Center<887>" || /Call Center\(887\)/.test(status);
    const isCallCenter888 =
      agent === "Call Center<888>" || /Call Center\(888\)/.test(status);

    const isAnswered =
      status === "Answered" ||
      /Abandoned\(Handled\s*\/\s*Call Center\(887\)/.test(status) ||
      /Abandoned\(Handled\s*\/\s*Call Center\(888\)/.test(status);

    if (!isAnswered) continue;

    if (isCallCenter887) {
      sarah++;
    } else if (isCallCenter888) {
      steffi++;
    }
  }

  return { sarah, steffi };
}

async function loadTemplateWorkbook(path: string): Promise<XLSX.WorkBook> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load template: ${path}`);
  }
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return wb;
}

function setCellValue(
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string | number | null
) {
  const ref = XLSX.utils.encode_cell({ r, c });
  const existing: any = (ws as any)[ref] || {};
  const cell: any = existing;

  if (value === null || value === undefined) {
    cell.v = null;
    cell.t = "z";
  } else if (typeof value === "number") {
    cell.v = value;
    cell.t = "n";
  } else {
    cell.v = value;
    cell.t = "s";
  }
  (ws as any)[ref] = cell;
}

function ensureCenterAlignmentForRow(
  ws: XLSX.WorkSheet,
  r: number,
  startCol: number,
  endCol: number,
  wrap: boolean = false
) {
  for (let c = startCol; c <= endCol; c++) {
    const ref = XLSX.utils.encode_cell({ r, c });
    const cell: any = (ws as any)[ref];
    if (!cell) continue;
    if (!cell.s) cell.s = {};
    if (!cell.s.alignment) cell.s.alignment = {};
    cell.s.alignment.horizontal = "center";
    cell.s.alignment.vertical = "center";
    if (wrap) {
      cell.s.alignment.wrapText = true;
    }
  }
}

function copyRowStyle(
  ws: XLSX.WorkSheet,
  srcRow: number,
  dstRow: number,
  startCol: number,
  endCol: number
) {
  for (let c = startCol; c <= endCol; c++) {
    const srcRef = XLSX.utils.encode_cell({ r: srcRow, c });
    const dstRef = XLSX.utils.encode_cell({ r: dstRow, c });
    const srcCell: any = (ws as any)[srcRef];
    if (!srcCell || !srcCell.s) continue;
    const dstCell: any = (ws as any)[dstRef] || {};
    dstCell.s = JSON.parse(JSON.stringify(srcCell.s));
    (ws as any)[dstRef] = dstCell;
  }
}

/**
 * Fills an existing formatted summary template workbook.
 * The template should already contain:
 * - Title row (merged, styled)
 * - Header row (background, borders, wrap)
 * - Some preformatted data rows + Total row + chart
 *
 * NOTE: The open-source XLSX library GAIA uses can read styles
 * but cannot reliably write them back. That means complex
 * formatting (theme fills, chart styling, etc.) may not be
 * 100% preserved on save, even though we start from your template.
 * The numbers and layout will match; very fine styling might differ.
 */
function fillSummaryTemplateWorkbook(
  wb: XLSX.WorkBook,
  summaryRows: CsvRow[],
  detailRows: CsvRow[],
  monthLabel: string
) {
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName] as XLSX.WorkSheet;

  // Title
  const dateLabel = extractFirstDateFromDetails(detailRows);
  const title =
    dateLabel != null
      ? `Call Center-Report-${dateLabel}`
      : `Call Center-Report-${monthLabel}`;

  setCellValue(ws, 0, 0, title);
  ensureCenterAlignmentForRow(ws, 0, 0, 12, false);

  // Rows from summary
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

  const { sarah, steffi } = computeCallCenterCounts(detailRows);

  let rowIndex = 2; // 0-based -> Excel row 3
  let sl = 1;
  let totalCallsFromBranches = 0;

  for (const row of branches) {
    const totalCallsNum = Number(row["Total Calls"] ?? 0) || 0;
    const answeredNum = Number(row["Answered"] ?? 0) || 0;
    const missedNum = Number(row["Missed"] ?? 0) || 0;
    const abandonedNum = Number(row["Abandoned"] ?? 0) || 0;
    const missedAndAbandoned = missedNum + abandonedNum;

    const answeredRateRaw = row["Answered Rate"] ?? "";
    const abandonRateRaw = row["Abandon Rate"] ?? "";

    setCellValue(ws, rowIndex, 0, sl);
    setCellValue(ws, rowIndex, 1, row["Queue"] ?? "");
    setCellValue(ws, rowIndex, 2, totalCallsNum);
    setCellValue(ws, rowIndex, 3, answeredNum);
    setCellValue(ws, rowIndex, 4, missedAndAbandoned);
    setCellValue(ws, rowIndex, 5, row["AVG Handle Time"] ?? "");
    setCellValue(
      ws,
      rowIndex,
      6,
      row["AVG Waiting Time (Answered Calls)"] ?? ""
    );
    setCellValue(ws, rowIndex, 7, row["AVG Waiting Time (All Calls)"] ?? "");
    setCellValue(ws, rowIndex, 8, row["Max Waiting Time (All Calls)"] ?? "");
    setCellValue(ws, rowIndex, 9, row["Average Talking Time"] ?? "");
    setCellValue(ws, rowIndex, 10, answeredRateRaw || null);
    setCellValue(ws, rowIndex, 11, abandonRateRaw || null);
    setCellValue(ws, rowIndex, 12, null);

    totalCallsFromBranches += totalCallsNum;
    rowIndex++;
    sl++;
  }

  const lastBranchRowIndex = rowIndex - 1;

  // Call Center <887-Sara>
  const sarahRowIndex = rowIndex;
  setCellValue(ws, sarahRowIndex, 0, sl);
  setCellValue(ws, sarahRowIndex, 1, "Call Center <887-Sara>");
  setCellValue(ws, sarahRowIndex, 2, sarah);
  for (let c = 3; c <= 12; c++) setCellValue(ws, sarahRowIndex, c, null);
  if (lastBranchRowIndex >= 2) {
    copyRowStyle(ws, lastBranchRowIndex, sarahRowIndex, 0, 12);
  }
  ensureCenterAlignmentForRow(ws, sarahRowIndex, 0, 12, false);
  rowIndex++;
  sl++;

  // Call Center <888-Sansa>
  const sansaRowIndex = rowIndex;
  setCellValue(ws, sansaRowIndex, 0, sl);
  setCellValue(ws, sansaRowIndex, 1, "Call Center <888-Sansa>");
  setCellValue(ws, sansaRowIndex, 2, steffi);
  for (let c = 3; c <= 12; c++) setCellValue(ws, sansaRowIndex, c, null);
  if (lastBranchRowIndex >= 2) {
    copyRowStyle(ws, lastBranchRowIndex, sansaRowIndex, 0, 12);
  }
  ensureCenterAlignmentForRow(ws, sansaRowIndex, 0, 12, false);
  rowIndex++;

  // Total row (assume it's the next formatted row in the template)
  const totalCalls =
    totalRow?.["Total Calls"] != null
      ? Number(totalRow["Total Calls"]) || 0
      : totalCallsFromBranches;
  const totalAnswered =
    totalRow?.["Answered"] != null
      ? Number(totalRow["Answered"]) || 0
      : null;
  const totalMissed =
    totalRow?.["Missed"] != null ? Number(totalRow["Missed"]) || 0 : null;
  const totalAbandoned =
    totalRow?.["Abandoned"] != null
      ? Number(totalRow["Abandoned"]) || 0
      : null;

  const totalMissedAndAbandoned =
    totalMissed != null && totalAbandoned != null
      ? totalMissed + totalAbandoned
      : null;

  setCellValue(ws, rowIndex, 0, null);
  setCellValue(ws, rowIndex, 1, "Total");
  setCellValue(ws, rowIndex, 2, totalCalls);
  setCellValue(ws, rowIndex, 3, totalAnswered);
  setCellValue(ws, rowIndex, 4, totalMissedAndAbandoned);
  for (let c = 5; c <= 12; c++) setCellValue(ws, rowIndex, c, null);

  return wb;
}

function buildDetailsSheet(detailRows: CsvRow[]) {
  // We build a clean details sheet – column order matches your
  // November details workbook, with queue + call data.
  const aoa: (string | number | null)[][] = [];

  aoa.push([
    "Queue",
    "Answered",
    "Missed",
    "Abandoned / Agent",
    "Status",
    "Ring Duration",
    "Talk Duration",
    "Hold Duration",
    "Reason"
  ]);

  let currentQueueName: string | null = null;

  for (const row of detailRows) {
    const queueCell = row["Queue"];
    const totalCalls = row["Total Calls"];
    const answered = row["Answered"];
    const missed = row["Missed"];
    const abandoned = row["Abandoned"];
    const status = row["AVG Handle Time"];
    const ring = row["AVG Waiting Time (Answered Calls)"];
    const talk = row["Average Talking Time"];
    const reason = row["AVG Hold Time"] ?? "";

    // Summary lines (per branch)
    if (queueCell && queueCell.trim().length > 0) {
      currentQueueName = queueCell.trim();
      continue;
    }

    // Skip the internal header row inside each queue block
    if (totalCalls === "ID" || answered === "Time" || missed === "Call From") {
      continue;
    }

    // We only care about rows that look like actual calls
    if (!answered) {
      continue;
    }

    const queueName = currentQueueName ?? "";

    aoa.push([
      queueName,
      answered,
      missed ?? null,
      abandoned ?? null,
      status ?? null,
      ring ?? null,
      row["AVG Waiting Time (All Calls)"] ?? null,
      talk ?? null,
      reason || null
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Make columns a bit wider so the sheet is not "squished"
  ws["!cols"] = [
    { wch: 18 }, // Queue
    { wch: 22 }, // Answered (date+time)
    { wch: 14 }, // Missed (number)
    { wch: 24 }, // Agent
    { wch: 30 }, // Status
    { wch: 14 }, // Ring duration
    { wch: 14 }, // Talk duration
    { wch: 14 }, // Hold duration
    { wch: 40 }  // Reason
  ];

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
      const rawDetailRows = parseCsv(detailsText);
      const detailRows = normalizeDetailRows(rawDetailRows);

      if (summaryRows.length === 0 || detailRows.length === 0) {
        setError("One of the CSV files appears to be empty.");
        return;
      }

      // Load formatted template from /public/templates
      const summaryTemplateWb = await loadTemplateWorkbook(
        "/templates/CallCenterReportTemplate.xlsx"
      );

      const summaryWb = fillSummaryTemplateWorkbook(
        summaryTemplateWb,
        summaryRows,
        detailRows,
        monthLabel.trim() || "MonthYear"
      );

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
                className="mt-2 block w-full cursor-pointer text-sm text-neutral-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm text-white hover:file:bg-emerald-500"
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
                className="mt-2 block w-full cursor-pointer text-sm text-neutral-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm text-white hover:file:bg-emerald-500"
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
            How this works (template mode)
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-500">
            <li>
              The summary workbook is based on your own Excel template in{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-[11px]">
                public/templates/CallCenterReportTemplate.xlsx
              </code>
              . Layout, merged cells, borders and chart all start from that file.
            </li>
            <li>
              GAIA only rewrites the values in the branch rows, Call Center
              rows, and Total row. Answered Rate and Abandon Rate are kept as
              percentage text (e.g. 67.14%).
            </li>
            <li>
              Call Center callbacks where the raw export shows
              <code className="mx-1 rounded bg-neutral-900 px-1 py-0.5 text-[11px]">
                NONE
              </code>
              but status
              <code className="mx-1 rounded bg-neutral-900 px-1 py-0.5 text-[11px]">
                Abandoned(Handled/Call Center(887)...
              </code>
              are credited to Call Center &lt;887&gt; in both the summary and
              details sheets.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
