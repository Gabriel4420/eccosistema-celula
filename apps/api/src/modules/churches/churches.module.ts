import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import {
  CHURCH_MANAGEMENT_REPOSITORY,
  CHURCH_MANAGEMENT_UNIT_OF_WORK
} from "./application/church-management.port";
import { ChurchManagementAuthorization } from "./application/church-management.authorization";
import { ChurchManagementCommands } from "./application/church-management.commands";
import { ChurchManagementQueries } from "./application/church-management.queries";
import {
  ManageChurchPolicy,
  ViewChurchPolicy
} from "./domain/church-management.policy";
import { PrismaChurchManagementRepository } from "./infrastructure/prisma-church-management.repository";
import { ChurchController } from "./presentation/church.controller";
import type {
  ChurchManagementRepository,
  ChurchManagementUnitOfWork
} from "./application/church-management.port";

@Module({
  imports: [IdentityModule],
  controllers: [ChurchController],
  providers: [
    PrismaChurchManagementRepository,
    {
      provide: CHURCH_MANAGEMENT_REPOSITORY,
      useExisting: PrismaChurchManagementRepository
    },
    {
      provide: CHURCH_MANAGEMENT_UNIT_OF_WORK,
      useExisting: PrismaChurchManagementRepository
    },
    {
      provide: ChurchManagementAuthorization,
      useFactory: () =>
        new ChurchManagementAuthorization(
          new ViewChurchPolicy(),
          new ManageChurchPolicy()
        )
    },
    {
      provide: ChurchManagementQueries,
      inject: [CHURCH_MANAGEMENT_REPOSITORY, ChurchManagementAuthorization],
      useFactory: (
        churches: ChurchManagementRepository,
        authorization: ChurchManagementAuthorization
      ) => new ChurchManagementQueries(churches, authorization)
    },
    {
      provide: ChurchManagementCommands,
      inject: [CHURCH_MANAGEMENT_UNIT_OF_WORK, ChurchManagementAuthorization],
      useFactory: (
        unitOfWork: ChurchManagementUnitOfWork,
        authorization: ChurchManagementAuthorization
      ) => new ChurchManagementCommands(unitOfWork, authorization)
    }
  ]
})
export class ChurchesModule {}

