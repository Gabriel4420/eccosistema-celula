import type { ParsedFile } from "./file-parser.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJson(buffer: Buffer, fileName: string): ParsedFile {
  const text = buffer.toString("utf-8");
  const parsed: unknown = JSON.parse(text);

  let items: unknown;
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.items)) {
    items = parsed.items;
  } else {
    throw new Error("JSON import must be an array of items or { items: [...] }");
  }

  const rows = (items as unknown[]).map((item) => isRecord(item) ? item : {});
  return { format: "json", fileName, rows };
}
