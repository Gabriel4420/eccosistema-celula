import type {
  ListPeopleInput,
  ManagedPerson,
  PersonPage,
  PersonPatchInput,
  PersonWriteInput
} from "./people-management.types";

export const PEOPLE_MANAGEMENT_REPOSITORY = Symbol("PEOPLE_MANAGEMENT_REPOSITORY");
export const PEOPLE_MANAGEMENT_UNIT_OF_WORK = Symbol("PEOPLE_MANAGEMENT_UNIT_OF_WORK");

export interface PeopleManagementRepository {
  list(churchId: string, input: ListPeopleInput): Promise<PersonPage>;
  find(churchId: string, personId: string): Promise<ManagedPerson | null>;
}

export interface DuplicateFields {
  phone: boolean;
  email: boolean;
  nameAndBirthDate: boolean;
}

export interface PeopleManagementTransaction {
  hasActiveRole(userId: string, roles: readonly string[]): Promise<boolean>;
  findPerson(personId: string, includeInactive?: boolean): Promise<ManagedPerson | null>;
  findDuplicates(input: PersonWriteInput, excludeId?: string): Promise<DuplicateFields>;
  findCellByCode(code: string): Promise<{ id: string } | null>;
  createCellMembership(input: { personId: string; cellId: string }): Promise<void>;
  createPerson(input: PersonWriteInput): Promise<ManagedPerson>;
  updatePerson(personId: string, input: PersonPatchInput): Promise<ManagedPerson>;
  setDeletedAt(personId: string, deletedAt: Date | null): Promise<ManagedPerson>;
  recordAudit(input: {
    actorId: string;
    entityId: string;
    action: string;
    before?: Record<string, string | string[] | null>;
    after?: Record<string, string | string[] | null>;
  }): Promise<void>;
}

export interface PeopleManagementUnitOfWork {
  execute<T>(
    churchId: string,
    work: (transaction: PeopleManagementTransaction) => Promise<T>
  ): Promise<T>;
}
