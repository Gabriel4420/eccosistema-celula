import type { ImportDomain, ImportFormat } from "@mission-atos/contracts";

export const BULK_IMPORT_AUDIT = Symbol("BULK_IMPORT_AUDIT");

export interface BulkImportAudit {
  record(input: {
    churchId: string;
    userId: string;
    importId: string;
    domain: ImportDomain;
    format: ImportFormat;
    processed: number;
    created: number;
    failed: number;
  }): Promise<void>;
}
