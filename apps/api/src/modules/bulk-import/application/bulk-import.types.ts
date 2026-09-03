import type { ImportFormat } from "@mission-atos/contracts";

export interface BulkRowOutcome {
  row: number;
  status: "created" | "error";
  code?: string;
  message?: string;
  errors?: string[];
}

export interface BulkImportResult {
  domain: "people" | "cells" | "users";
  fileName: string;
  format: ImportFormat;
  processed: number;
  created: number;
  failed: number;
  resultsPerRow: BulkRowOutcome[];
}
