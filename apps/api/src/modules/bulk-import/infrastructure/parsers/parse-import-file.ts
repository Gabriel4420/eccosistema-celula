import type { ImportFormat } from "@mission-atos/contracts";
import { parseCsv } from "./csv.parser";
import { parseJson } from "./json.parser";
import { parseXlsx } from "./xlsx.parser";
import { BulkImportError, type ParsedFile } from "./file-parser.types";

const supportedMimeTypes: Readonly<Record<string, ImportFormat>> = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xlsx",
  "text/csv": "csv",
  "application/csv": "csv",
  "application/json": "json",
  "text/plain": "csv"
};

function formatFromExtension(fileName: string): ImportFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "xlsx") return "xlsx";
  if (extension === "csv") return "csv";
  if (extension === "json") return "json";
  return null;
}

export function detectFormat(mimeType: string, fileName: string): ImportFormat {
  const fromMime = supportedMimeTypes[mimeType];
  if (fromMime) return fromMime;
  const fromExtension = formatFromExtension(fileName);
  if (fromExtension) return fromExtension;
  throw new BulkImportError("BULK_INVALID_FILE_TYPE", "Unsupported file type");
}

export async function parseImportFile(buffer: Buffer, mimeType: string, fileName: string): Promise<ParsedFile> {
  const format = detectFormat(mimeType, fileName);
  try {
    if (format === "json") return parseJson(buffer, fileName);
    if (format === "csv") return parseCsv(buffer, fileName);
    return await parseXlsx(buffer, fileName);
  } catch (error) {
    if (error instanceof BulkImportError) throw error;
    throw new BulkImportError("BULK_INVALID_FORMAT", "Failed to parse the uploaded file", {
      reason: error instanceof Error ? error.message : "unknown"
    });
  }
}