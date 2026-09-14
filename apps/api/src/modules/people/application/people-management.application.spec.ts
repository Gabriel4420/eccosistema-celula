import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { PeopleManagementAuthorization } from "./people-management.authorization";
import { PeopleManagementCommands } from "./people-management.commands";
import { PeopleManagementQueries } from "./people-management.queries";
import type { PeopleManagementRepository } from "./people-management.port";
import type { PeopleManagementTransaction, PeopleManagementUnitOfWork } from "./people-management.port";
import { ManagePersonPolicy, ManagePersonStatusPolicy, ViewInactivePeoplePolicy, ViewPersonObservationsPolicy, ViewPersonPolicy } from "../domain/people-management.policy";

const principal: AuthenticatedPrincipal = { userId: "admin", churchId: "church", sessionId: "session", roles: ["ADMIN"] };
const person = { id: "person", churchId: "church", fullName: "Pessoa", phone: null, email: null, birthDate: null, gender: null, observations: null, currentCell: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };

describe("people commands", () => {
  it("creates person and audit in the unit of work", async () => {
    const transaction = transactionMock();
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());
    await expect(commands.create(principal, { fullName: "Pessoa", phone: null, email: null, birthDate: null, gender: null, observations: null })).resolves.toEqual(person);
    expect(transaction.createPerson).toHaveBeenCalled();
    expect(transaction.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "PERSON_CREATED", entityId: "person" }));
  });

  it("rejects duplicates before persistence", async () => {
    const transaction = transactionMock();
    transaction.findDuplicates.mockResolvedValue({ phone: false, email: true, nameAndBirthDate: false });
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());
    await expect(commands.create(principal, { fullName: "Pessoa", phone: null, email: "x@example.test", birthDate: null, gender: null, observations: null })).rejects.toMatchObject({ code: "PERSON_DUPLICATE" });
    expect(transaction.createPerson).not.toHaveBeenCalled();
  });

  it("creates the optional cell membership in the same unit of work", async () => {
    const transaction = transactionMock();
    transaction.findCellByCode.mockResolvedValue({ id: "cell" });
    const linkedPerson = { ...person, currentCell: { id: "cell", code: "CEL-001", name: "Célula Esperança" } };
    transaction.findPerson.mockResolvedValue(linkedPerson);
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());

    const result = await commands.create(
      principal,
      { fullName: "Pessoa", phone: null, email: null, birthDate: null, gender: null, observations: null },
      "CEL-001"
    );

    expect(transaction.createCellMembership).toHaveBeenCalledWith({ personId: "person", cellId: "cell" });
    expect(transaction.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "PERSON_CELL_MEMBERSHIP_CREATED",
      entityId: "person"
    }));
    expect(transaction.findPerson).toHaveBeenCalledWith("person");
    expect(result).toEqual(linkedPerson);
  });

  it("rejects an unknown cell before creating the person", async () => {
    const transaction = transactionMock();
    transaction.findCellByCode.mockResolvedValue(null);
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());

    await expect(commands.create(
      principal,
      { fullName: "Pessoa", phone: null, email: null, birthDate: null, gender: null, observations: null },
      "INEXISTENTE"
    )).rejects.toMatchObject({ code: "PERSON_CELL_NOT_FOUND" });
    expect(transaction.createPerson).not.toHaveBeenCalled();
  });

  it("preserves no-op updates without persistence or audit", async () => {
    const transaction = transactionMock();
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());
    await expect(commands.update(principal, person.id, { fullName: person.fullName })).resolves.toEqual(person);
    expect(transaction.updatePerson).not.toHaveBeenCalled();
    expect(transaction.recordAudit).not.toHaveBeenCalled();
  });

  it("updates nullable fields and records only changed field names", async () => {
    const transaction = transactionMock();
    const updated = { ...person, email: null, updatedAt: new Date() };
    transaction.findPerson.mockResolvedValue({ ...person, email: "old@example.test" });
    transaction.updatePerson.mockResolvedValue(updated);
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());
    await expect(commands.update(principal, person.id, { email: null })).resolves.toEqual(updated);
    expect(transaction.findDuplicates).toHaveBeenCalledWith(expect.objectContaining({ email: null }), person.id);
    expect(transaction.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "PERSON_UPDATED", before: { changedFields: ["email"] }, after: { changedFields: ["email"] }
    }));
  });

  it("requires the current database role and keeps status changes idempotent", async () => {
    const transaction = transactionMock();
    transaction.hasActiveRole.mockResolvedValue(false);
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());
    await expect(commands.updateStatus(principal, person.id, "INACTIVE")).rejects.toMatchObject({ code: "AUTH_FORBIDDEN" });
    expect(transaction.setDeletedAt).not.toHaveBeenCalled();

    transaction.hasActiveRole.mockResolvedValue(true);
    transaction.findPerson.mockResolvedValue({ ...person, deletedAt: new Date() });
    await expect(commands.updateStatus(principal, person.id, "INACTIVE")).resolves.toMatchObject({ id: person.id });
    expect(transaction.recordAudit).not.toHaveBeenCalled();
  });

  it("propagates audit failure from the unit of work", async () => {
    const transaction = transactionMock();
    transaction.recordAudit.mockRejectedValue(new Error("audit unavailable"));
    const commands = new PeopleManagementCommands(unitOfWork(transaction), authorization());
    await expect(commands.create(principal, { fullName: "Pessoa", phone: null, email: null, birthDate: null, gender: null, observations: null })).rejects.toThrow("audit unavailable");
  });
});

describe("people queries", () => {
  const repository: jest.Mocked<PeopleManagementRepository> = {
    list: jest.fn().mockResolvedValue({ items: [person], totalItems: 1 }),
    find: jest.fn().mockResolvedValue(person)
  };

  beforeEach(() => jest.clearAllMocks());

  it("derives tenant from the principal and returns active people", async () => {
    const queries = new PeopleManagementQueries(repository, authorization());
    await queries.list(principal, { page: 1, pageSize: 20, status: "ACTIVE" });
    expect(repository.list).toHaveBeenCalledWith("church", expect.objectContaining({ status: "ACTIVE" }));
  });

  it("denies inactive listing to non-admin and makes foreign resources opaque", async () => {
    const queries = new PeopleManagementQueries(repository, authorization());
    expect(() => queries.list({ ...principal, roles: ["LEADER"] }, { page: 1, pageSize: 20, status: "INACTIVE" })).toThrow("Access is not allowed");
    repository.find.mockResolvedValueOnce(null);
    await expect(queries.get(principal, "foreign")).rejects.toMatchObject({ code: "PERSON_NOT_FOUND" });
  });
});

function authorization() { return new PeopleManagementAuthorization(new ViewPersonPolicy(), new ManagePersonPolicy(), new ManagePersonStatusPolicy(), new ViewInactivePeoplePolicy(), new ViewPersonObservationsPolicy()); }
function unitOfWork(transaction: jest.Mocked<PeopleManagementTransaction>): PeopleManagementUnitOfWork { return { execute: async (_churchId, work) => work(transaction) }; }
function transactionMock(): jest.Mocked<PeopleManagementTransaction> {
  return {
    hasActiveRole: jest.fn().mockResolvedValue(true), findPerson: jest.fn().mockResolvedValue(person),
    findDuplicates: jest.fn().mockResolvedValue({ phone: false, email: false, nameAndBirthDate: false }),
    findCellByCode: jest.fn().mockResolvedValue(null), createCellMembership: jest.fn().mockResolvedValue(undefined),
    createPerson: jest.fn().mockResolvedValue(person), updatePerson: jest.fn().mockResolvedValue(person),
    setDeletedAt: jest.fn().mockResolvedValue(person), recordAudit: jest.fn().mockResolvedValue(undefined)
  };
}
