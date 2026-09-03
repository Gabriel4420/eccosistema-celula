import type { ImportFormat } from "@mission-atos/contracts";

export interface ParsedFile {
  readonly format: ImportFormat;
  readonly fileName: string;
  readonly rows: ReadonlyArray<Record<string, unknown>>;
}

export class BulkImportError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "BulkImportError";
  }
}