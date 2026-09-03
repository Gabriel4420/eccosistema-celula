import { Inject, Injectable } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import type { BulkImportAudit } from "../application/bulk-import-audit.port";

@Injectable()
export class PrismaBulkImportAuditRepository implements BulkImportAudit {
  constructor(@Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient) {}

  async record(input: Parameters<BulkImportAudit["record"]>[0]): Promise<void> {
    await this.database.auditLog.create({
      data: {
        churchId: input.churchId,
        userId: input.userId,
        entity: "BulkImport",
        entityId: input.importId,
        action: `${input.domain.toUpperCase()}_BULK_IMPORT`,
        after: {
          format: input.format,
          processed: input.processed,
          created: input.created,
          failed: input.failed
        }
      }
    });
  }
}
