import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import {
  USER_PREFERENCES_REPOSITORY,
  USER_PREFERENCES_UNIT_OF_WORK
} from "./application/user-preferences.port";
import { UserPreferencesCommands } from "./application/user-preferences.commands";
import { UserPreferencesQueries } from "./application/user-preferences.queries";
import { PrismaUserPreferencesRepository } from "./infrastructure/prisma-user-preferences.repository";
import { UserPreferencesController } from "./presentation/user-preferences.controller";
import type { UserPreferencesRepository } from "./application/user-preferences.port";
import type { UserPreferencesUnitOfWork } from "./application/user-preferences.port";

@Module({
  imports: [IdentityModule],
  controllers: [UserPreferencesController],
  providers: [
    PrismaUserPreferencesRepository,
    {
      provide: USER_PREFERENCES_REPOSITORY,
      useExisting: PrismaUserPreferencesRepository
    },
    {
      provide: USER_PREFERENCES_UNIT_OF_WORK,
      useExisting: PrismaUserPreferencesRepository
    },
    {
      provide: UserPreferencesQueries,
      inject: [USER_PREFERENCES_REPOSITORY],
      useFactory: (preferences: UserPreferencesRepository) =>
        new UserPreferencesQueries(preferences)
    },
    {
      provide: UserPreferencesCommands,
      inject: [USER_PREFERENCES_UNIT_OF_WORK],
      useFactory: (unitOfWork: UserPreferencesUnitOfWork) =>
        new UserPreferencesCommands(unitOfWork)
    }
  ]
})
export class UserPreferencesModule {}