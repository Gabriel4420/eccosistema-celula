import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { PeopleManagementAuthorization } from "./application/people-management.authorization";
import { PeopleManagementCommands } from "./application/people-management.commands";
import { PEOPLE_MANAGEMENT_REPOSITORY, PEOPLE_MANAGEMENT_UNIT_OF_WORK, type PeopleManagementRepository, type PeopleManagementUnitOfWork } from "./application/people-management.port";
import { PeopleManagementQueries } from "./application/people-management.queries";
import { ManagePersonPolicy, ManagePersonStatusPolicy, ViewInactivePeoplePolicy, ViewPersonObservationsPolicy, ViewPersonPolicy } from "./domain/people-management.policy";
import { PrismaPeopleManagementRepository } from "./infrastructure/prisma-people-management.repository";
import { PeopleController } from "./presentation/people.controller";

@Module({ imports: [IdentityModule], controllers: [PeopleController], providers: [
  PrismaPeopleManagementRepository,
  { provide: PEOPLE_MANAGEMENT_REPOSITORY, useExisting: PrismaPeopleManagementRepository },
  { provide: PEOPLE_MANAGEMENT_UNIT_OF_WORK, useExisting: PrismaPeopleManagementRepository },
  { provide: PeopleManagementAuthorization, useFactory: () => new PeopleManagementAuthorization(new ViewPersonPolicy(), new ManagePersonPolicy(), new ManagePersonStatusPolicy(), new ViewInactivePeoplePolicy(), new ViewPersonObservationsPolicy()) },
  { provide: PeopleManagementQueries, inject: [PEOPLE_MANAGEMENT_REPOSITORY, PeopleManagementAuthorization], useFactory: (repository: PeopleManagementRepository, authorization: PeopleManagementAuthorization) => new PeopleManagementQueries(repository, authorization) },
  { provide: PeopleManagementCommands, inject: [PEOPLE_MANAGEMENT_UNIT_OF_WORK, PeopleManagementAuthorization], useFactory: (unitOfWork: PeopleManagementUnitOfWork, authorization: PeopleManagementAuthorization) => new PeopleManagementCommands(unitOfWork, authorization) }
], exports: [PeopleManagementCommands, PEOPLE_MANAGEMENT_UNIT_OF_WORK] })
export class PeopleModule {}
