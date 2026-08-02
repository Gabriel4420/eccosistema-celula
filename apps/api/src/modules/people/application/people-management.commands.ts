import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { PeopleManagementAuthorization } from "./people-management.authorization";
import { PeopleManagementError } from "./people-management.error";
import type {
  DuplicateFields,
  PeopleManagementTransaction,
  PeopleManagementUnitOfWork
} from "./people-management.port";
import type {
  ManagedPerson,
  PersonPatchInput,
  PersonStatus,
  PersonWriteInput
} from "./people-management.types";

const writableFields = ["fullName", "phone", "email", "birthDate", "gender", "observations"] as const;

export class PeopleManagementCommands {
  constructor(
    private readonly unitOfWork: PeopleManagementUnitOfWork,
    private readonly authorization: PeopleManagementAuthorization
  ) {}

  create(principal: AuthenticatedPrincipal, input: PersonWriteInput): Promise<ManagedPerson> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertManage(transaction, principal);
      this.assertNoDuplicates(await transaction.findDuplicates(input));
      const person = await transaction.createPerson(input);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: person.id,
        action: "PERSON_CREATED",
        after: { status: "ACTIVE", changedFields: writableFields.filter((field) => input[field] !== null) }
      });
      return person;
    });
  }

  update(
    principal: AuthenticatedPrincipal,
    personId: string,
    patch: PersonPatchInput
  ): Promise<ManagedPerson> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertManage(transaction, principal);
      const current = await this.requirePerson(transaction, personId, false);
      const next = mergePerson(current, patch);
      const changedFields = writableFields.filter((field) =>
        Object.prototype.hasOwnProperty.call(patch, field) && !sameValue(current[field], next[field])
      );
      if (!changedFields.length) return current;
      if (changedFields.some((field) => field === "phone" || field === "email" || field === "fullName" || field === "birthDate")) {
        this.assertNoDuplicates(await transaction.findDuplicates(next, personId));
      }
      const person = await transaction.updatePerson(personId, patch);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: personId,
        action: "PERSON_UPDATED",
        before: { changedFields },
        after: { changedFields }
      });
      return person;
    });
  }

  updateStatus(
    principal: AuthenticatedPrincipal,
    personId: string,
    status: PersonStatus
  ): Promise<ManagedPerson> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const currentRole = await transaction.hasActiveRole(principal.userId, ["ADMIN"]);
      this.authorization.assertStatus(principal, currentRole);
      const person = await this.requirePerson(transaction, personId, true);
      const currentStatus: PersonStatus = person.deletedAt ? "INACTIVE" : "ACTIVE";
      if (currentStatus === status) return person;
      const updated = await transaction.setDeletedAt(personId, status === "INACTIVE" ? new Date() : null);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: personId,
        action: status === "INACTIVE" ? "PERSON_DEACTIVATED" : "PERSON_REACTIVATED",
        before: { status: currentStatus },
        after: { status }
      });
      return updated;
    });
  }

  private async assertManage(transaction: PeopleManagementTransaction, principal: AuthenticatedPrincipal): Promise<void> {
    const currentRole = await transaction.hasActiveRole(principal.userId, ["ADMIN", "PASTOR"]);
    this.authorization.assertManage(principal, currentRole);
  }

  private async requirePerson(
    transaction: PeopleManagementTransaction,
    id: string,
    includeInactive: boolean
  ): Promise<ManagedPerson> {
    const person = await transaction.findPerson(id, includeInactive);
    if (!person) throw new PeopleManagementError("PERSON_NOT_FOUND", "Person not found");
    return person;
  }

  private assertNoDuplicates(duplicates: DuplicateFields): void {
    if (Object.values(duplicates).some(Boolean)) {
      throw new PeopleManagementError("PERSON_DUPLICATE", "An active person with matching data already exists");
    }
  }
}

function mergePerson(current: ManagedPerson, patch: PersonPatchInput): PersonWriteInput {
  return {
    fullName: patch.fullName ?? current.fullName,
    phone: patch.phone === undefined ? current.phone : patch.phone,
    email: patch.email === undefined ? current.email : patch.email,
    birthDate: patch.birthDate === undefined ? toDateOnly(current.birthDate) : patch.birthDate,
    gender: patch.gender === undefined ? current.gender : patch.gender,
    observations: patch.observations === undefined ? current.observations : patch.observations
  };
}

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left instanceof Date && typeof right === "string") return toDateOnly(left) === right;
  return left === right;
}
