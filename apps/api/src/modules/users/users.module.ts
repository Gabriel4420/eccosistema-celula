import { Module } from "@nestjs/common";
import { PASSWORD_HASHER, type PasswordHasher } from "../identity/application/ports";
import { IdentityModule } from "../identity/identity.module";
import {
  USER_MANAGEMENT_REPOSITORY,
  USER_MANAGEMENT_UNIT_OF_WORK
} from "./application/user-management.port";
import { UserManagementAuthorization } from "./application/user-management.authorization";
import { UserManagementCommands } from "./application/user-management.commands";
import { UserManagementQueries } from "./application/user-management.queries";
import { ManageUserPolicy } from "./domain/user-management.policy";
import { PrismaUserManagementRepository } from "./infrastructure/prisma-user-management.repository";
import { UsersController } from "./presentation/users.controller";
import type { UserManagementRepository } from "./application/user-management.port";
import type { UserManagementUnitOfWork } from "./application/user-management.port";

@Module({
  imports: [IdentityModule],
  controllers: [UsersController],
  providers: [
    PrismaUserManagementRepository,
    {
      provide: USER_MANAGEMENT_REPOSITORY,
      useExisting: PrismaUserManagementRepository
    },
    {
      provide: USER_MANAGEMENT_UNIT_OF_WORK,
      useExisting: PrismaUserManagementRepository
    },
    {
      provide: UserManagementAuthorization,
      inject: [USER_MANAGEMENT_REPOSITORY],
      useFactory: (users: UserManagementRepository) =>
        new UserManagementAuthorization(users, new ManageUserPolicy())
    },
    {
      provide: UserManagementQueries,
      inject: [USER_MANAGEMENT_REPOSITORY, UserManagementAuthorization],
      useFactory: (
        users: UserManagementRepository,
        authorization: UserManagementAuthorization
      ) => new UserManagementQueries(users, authorization)
    },
    {
      provide: UserManagementCommands,
      inject: [
        USER_MANAGEMENT_UNIT_OF_WORK,
        PASSWORD_HASHER,
        UserManagementAuthorization
      ],
      useFactory: (
        unitOfWork: UserManagementUnitOfWork,
        passwords: PasswordHasher,
        authorization: UserManagementAuthorization
      ) => new UserManagementCommands(unitOfWork, passwords, authorization)
    }
  ]
})
export class UsersModule {}
