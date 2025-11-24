import { NextResponse } from "next/server";
import { Pool } from "pg";

const REQUIRED_TABLES: Record<string, string[]> = {
  companies: ["id", "name", "slug"],
  branches: ["company_id"],
  staff: ["company_id"],
  sales: ["company_id"],
  sale_items: ["company_id"],
  payments: ["company_id"],
  import_jobs: ["company_id", "target"],
};

type TableReport = {
  exists: boolean;
  missingColumns: string[];
};

export const runtime = "nodejs";

export async function GET() {
  const connectionString =
    process.env.ACCOUNTS_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json(
      {
        ok: false,
        error: "ACCOUNTS_DATABASE_URL or DATABASE_URL is not set.",
      },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 2,
  });

  const tablesReport: Record<string, TableReport> = {};
  let dbInfo: { db: string; user: string } | null = null;

  try {
    // Ensure import_jobs table exists so wiring check can pass once created here.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id                BIGSERIAL PRIMARY KEY,
        company_id        BIGINT NOT NULL,
        target            TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        status            TEXT NOT NULL DEFAULT 'UPLOADED',
        rows_imported     INTEGER,
        error_message     TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at       TIMESTAMPTZ
      );
    `);

    const meta = await pool.query<{
      db: string;
      usr: string;
    }>(`select current_database() as db, current_user as usr`);
    dbInfo = { db: meta.rows[0].db, user: meta.rows[0].usr };

    const tableNames = Object.keys(REQUIRED_TABLES);
    const existingTables = await pool.query<{ table_name: string }>(
      `select table_name
         from information_schema.tables
        where table_schema = 'public'
          and table_name = any($1::text[])`,
      [tableNames]
    );
    const existingSet = new Set(existingTables.rows.map((r) => r.table_name));

    for (const table of tableNames) {
      const columnsNeeded = REQUIRED_TABLES[table];
      const report: TableReport = { exists: existingSet.has(table), missingColumns: [] };

      if (report.exists) {
        const cols = await pool.query<{ column_name: string }>(
          `select column_name
             from information_schema.columns
            where table_schema = 'public'
              and table_name = $1`,
          [table]
        );
        const colSet = new Set(cols.rows.map((c) => c.column_name));
        report.missingColumns = columnsNeeded.filter((c) => !colSet.has(c));
      } else {
        report.missingColumns = [...columnsNeeded];
      }

      tablesReport[table] = report;
    }

    const anyMissing =
      Object.values(tablesReport).some(
        (r) => !r.exists || r.missingColumns.length > 0
      ) === true;

    return NextResponse.json({
      ok: !anyMissing,
      db: dbInfo,
      tables: tablesReport,
      message: anyMissing
        ? "Some required tables or columns are missing."
        : "Accounts wiring looks good.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ??
          "Failed to connect to Accounts database. Check credentials and SSL settings.",
      },
      { status: 500 }
    );
  } finally {
    await pool.end().catch(() => {});
  }
}
