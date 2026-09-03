import { parse } from "csv-parse/sync";
import type { ParsedFile } from "./file-parser.types";

export function parseCsv(buffer: Buffer, fileName: string): ParsedFile {
  const records = parse(buffer, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    // Disable empty cells; keys with no value become undefined.
    cast: (value) => {
      const trimmed = String(value).trim();
      return trimmed === "" ? undefined : trimmed;
    }
  }) as Array<Record<string, unknown>>;

  return { format: "csv", fileName, rows: records };
}