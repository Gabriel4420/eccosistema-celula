import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { MeetingsManagementAuthorization } from "./application/meetings-management.authorization";
import { MeetingsManagementCommands } from "./application/meetings-management.commands";
import {
  MEETINGS_MANAGEMENT_REPOSITORY,
  MEETINGS_MANAGEMENT_UNIT_OF_WORK,
  type MeetingsManagementRepository,
  type MeetingsManagementUnitOfWork
} from "./application/meetings-management.port";
import { MeetingsManagementQueries } from "./application/meetings-management.queries";
import { MeetingEditPolicy, MeetingListScopePolicy, MeetingViewPolicy } from "./domain/meetings-management.policy";
import { PrismaMeetingsManagementRepository } from "./infrastructure/prisma-meetings-management.repository";
import { MeetingsController } from "./presentation/meetings.controller";

@Module({
  imports: [IdentityModule],
  controllers: [MeetingsController],
  providers: [
    PrismaMeetingsManagementRepository,
    {
      provide: MEETINGS_MANAGEMENT_REPOSITORY,
      useExisting: PrismaMeetingsManagementRepository
    },
    {
      provide: MEETINGS_MANAGEMENT_UNIT_OF_WORK,
      useExisting: PrismaMeetingsManagementRepository
    },
    {
      provide: MeetingsManagementAuthorization,
      useFactory: () =>
        new MeetingsManagementAuthorization(
          new MeetingListScopePolicy(),
          new MeetingViewPolicy(),
          new MeetingEditPolicy()
        )
    },
    {
      provide: MeetingsManagementQueries,
      inject: [MEETINGS_MANAGEMENT_REPOSITORY, MeetingsManagementAuthorization],
      useFactory: (
        repository: MeetingsManagementRepository,
        authorization: MeetingsManagementAuthorization
      ) => new MeetingsManagementQueries(repository, authorization)
    },
    {
      provide: MeetingsManagementCommands,
      inject: [MEETINGS_MANAGEMENT_UNIT_OF_WORK, MeetingsManagementAuthorization],
      useFactory: (
        unitOfWork: MeetingsManagementUnitOfWork,
        authorization: MeetingsManagementAuthorization
      ) => new MeetingsManagementCommands(unitOfWork, authorization)
    }
  ]
})
export class MeetingsModule {}
