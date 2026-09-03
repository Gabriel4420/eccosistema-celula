import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import type { ParsedFile } from "./file-parser.types";

function toCellValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export async function parseXlsx(buffer: Buffer, fileName: string): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from(buffer));
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Workbook has no worksheets");

  const rows = sheet.getRows(1, sheet.rowCount) ?? [];
  const headerRow = rows[0];
  if (!headerRow) return { format: "xlsx", fileName, rows: [] };

  const headers = headerRow.values as unknown[];
  const headerKeys = headers.slice(1).map((value) => String(value ?? "").trim());

  const data: Array<Record<string, unknown>> = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row) continue;
    const values = row.values as unknown[];
    const record: Record<string, unknown> = {};
    let hasValue = false;
    for (let column = 0; column < headerKeys.length; column += 1) {
      const header = headerKeys[column];
      if (!header) continue;
      const raw = values[column + 1];
      const value = toCellValue(raw);
      if (value !== undefined) {
        record[header] = value;
        hasValue = true;
      }
    }
    if (hasValue) data.push(record);
  }

  return { format: "xlsx", fileName, rows: data };
}