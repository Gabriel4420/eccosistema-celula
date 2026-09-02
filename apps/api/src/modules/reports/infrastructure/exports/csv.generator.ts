import type { ExportRow } from "../../application/reports.types";

const DANGEROUS_PREFIX = /^[=+\-@\t\r]/;

function csvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (DANGEROUS_PREFIX.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(rows: ExportRow[], columns: string[]): string {
  if (!rows.length) return columns.join(",") + "\n";
  const lines = [columns.join(",")];
  for (const row of rows) {
    const values = columns.map((col) => csvValue(row[col]));
    lines.push(values.join(","));
  }
  return lines.join("\n") + "\n";
}

export function csvBuffer(rows: ExportRow[], columns: string[]): Buffer {
  const csv = generateCsv(rows, columns);
  const BOM = "\uFEFF";
  return Buffer.from(BOM + csv, "utf-8");
}
