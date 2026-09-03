import { Module } from "@nestjs/common";
import { CellsModule } from "../cells/cells.module";
import { PeopleModule } from "../people/people.module";
import { UsersModule } from "../users/users.module";
import { IdentityModule } from "../identity/identity.module";
import { BULK_IMPORT_AUDIT } from "./application/bulk-import-audit.port";
import { BulkImportCommands } from "./application/bulk-import.commands";
import { PrismaBulkImportAuditRepository } from "./infrastructure/prisma-bulk-import-audit.repository";
import { BulkImportController } from "./presentation/bulk-import.controller";

@Module({
  imports: [IdentityModule, PeopleModule, CellsModule, UsersModule],
  controllers: [BulkImportController],
  providers: [
    BulkImportCommands,
    { provide: BULK_IMPORT_AUDIT, useClass: PrismaBulkImportAuditRepository }
  ]
})
export class BulkImportModule {}
