import type { ExportRow } from "../../application/reports.types";
import type { ExportColumn } from "./export.i18n";

const DANGEROUS_PREFIX = /^[=+\-@\t\r]/;

function csvValue(value: string): string {
  if (DANGEROUS_PREFIX.test(value)) {
    value = `'${value}`;
  }
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCsv(rows: ExportRow[], columns: ExportColumn[]): string {
  const header = columns.map((column) => csvValue(column.caption)).join(",");
  if (!rows.length) return header + "\n";
  const lines = [header];
  for (const row of rows) {
    const values = columns.map((column) => csvValue(column.render(row)));
    lines.push(values.join(","));
  }
  return lines.join("\n") + "\n";
}

export function csvBuffer(rows: ExportRow[], columns: ExportColumn[]): Buffer {
  const csv = generateCsv(rows, columns);
  const BOM = "\uFEFF";
  return Buffer.from(BOM + csv, "utf-8");
}
