import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { CellsManagementAuthorization } from "./application/cells-management.authorization";
import { CellsManagementCommands } from "./application/cells-management.commands";
import {
  CELLS_MANAGEMENT_REPOSITORY,
  CELLS_MANAGEMENT_UNIT_OF_WORK,
  type CellsManagementRepository,
  type CellsManagementUnitOfWork
} from "./application/cells-management.port";
import { CellsManagementQueries } from "./application/cells-management.queries";
import { CellEditPolicy, CellListScopePolicy, CellViewPolicy } from "./domain/cells-management.policy";
import { PrismaCellsManagementRepository } from "./infrastructure/prisma-cells-management.repository";
import { CellsController } from "./presentation/cells.controller";

@Module({
  imports: [IdentityModule],
  controllers: [CellsController],
  providers: [
    PrismaCellsManagementRepository,
    {
      provide: CELLS_MANAGEMENT_REPOSITORY,
      useExisting: PrismaCellsManagementRepository
    },
    {
      provide: CELLS_MANAGEMENT_UNIT_OF_WORK,
      useExisting: PrismaCellsManagementRepository
    },
    {
      provide: CellsManagementAuthorization,
      useFactory: () =>
        new CellsManagementAuthorization(
          new CellListScopePolicy(),
          new CellViewPolicy(),
          new CellEditPolicy()
        )
    },
    {
      provide: CellsManagementQueries,
      inject: [CELLS_MANAGEMENT_REPOSITORY, CellsManagementAuthorization],
      useFactory: (
        repository: CellsManagementRepository,
        authorization: CellsManagementAuthorization
      ) => new CellsManagementQueries(repository, authorization)
    },
    {
      provide: CellsManagementCommands,
      inject: [CELLS_MANAGEMENT_UNIT_OF_WORK, CellsManagementAuthorization],
      useFactory: (
        unitOfWork: CellsManagementUnitOfWork,
        authorization: CellsManagementAuthorization
      ) => new CellsManagementCommands(unitOfWork, authorization)
    }
  ],
  exports: [CellsManagementCommands, CELLS_MANAGEMENT_UNIT_OF_WORK]
})
export class CellsModule {}
