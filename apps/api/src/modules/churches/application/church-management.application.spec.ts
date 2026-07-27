import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import {
  ManageChurchPolicy,
  ViewChurchPolicy
} from "../domain/church-management.policy";
import { ChurchManagementAuthorization } from "./church-management.authorization";
import { ChurchManagementCommands } from "./church-management.commands";
import { ChurchManagementQueries } from "./church-management.queries";
import type {
  ChurchManagementRepository,
  ChurchManagementTransaction,
  ChurchManagementUnitOfWork
} from "./church-management.port";
import type { ManagedChurch } from "./church-management.types";

const principal: AuthenticatedPrincipal = {
  userId: crypto.randomUUID(),
  churchId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  roles: ["ADMIN"]
};

function church(overrides: Partial<ManagedChurch> = {}): ManagedChurch {
  return {
    id: principal.churchId,
    name: "Igreja Exemplo",
    slug: "igreja-exemplo",
    email: null,
    phone: null,
    addressLine: null,
    addressNumber: null,
    addressComplement: null,
    neighborhood: null,
    city: null,
    state: null,
    postalCode: null,
    country: "BR",
    timezone: "America/Sao_Paulo",
    weekStartsOn: "SUNDAY",
    createdAt: new Date("2026-07-26T00:00:00.000Z"),
    updatedAt: new Date("2026-07-26T00:00:00.000Z"),
    ...overrides
  };
}

function authorization() {
  return new ChurchManagementAuthorization(
    new ViewChurchPolicy(),
    new ManageChurchPolicy()
  );
}

describe("church management application", () => {
  it("queries only the principal church and returns settings", async () => {
    const find = jest.fn(async () => church());
    const repository: ChurchManagementRepository = { find };
    const queries = new ChurchManagementQueries(repository, authorization());

    await expect(queries.getSettings(principal)).resolves.toEqual({
      timezone: "America/Sao_Paulo",
      weekStartsOn: "SUNDAY"
    });
    expect(find).toHaveBeenCalledWith(principal.churchId);
  });

  it("rejects a missing church", async () => {
    const queries = new ChurchManagementQueries(
      { find: async () => null },
      authorization()
    );
    await expect(queries.get(principal)).rejects.toMatchObject({
      code: "CHURCH_NOT_FOUND"
    });
  });

  it("updates and audits only changed institutional groups", async () => {
    const current = church();
    const transaction = transactionStub(current);
    const commands = new ChurchManagementCommands(
      unitOfWork(transaction),
      authorization()
    );

    await commands.update(principal, {
      name: "Igreja Atualizada",
      email: "contato@example.test"
    });

    expect(transaction.updateInstitutional).toHaveBeenCalledWith({
      name: "Igreja Atualizada",
      email: "contato@example.test"
    });
    expect(transaction.recordAudit).toHaveBeenCalledTimes(2);
    expect(transaction.recordAudit).toHaveBeenCalledWith({
      actorId: principal.userId,
      action: "CHURCH_IDENTITY_UPDATED",
      before: { name: "Igreja Exemplo" },
      after: { name: "Igreja Atualizada" }
    });
  });

  it("does not persist or audit an effective no-op", async () => {
    const transaction = transactionStub(church());
    const commands = new ChurchManagementCommands(
      unitOfWork(transaction),
      authorization()
    );

    await commands.update(principal, { name: "Igreja Exemplo" });

    expect(transaction.updateInstitutional).not.toHaveBeenCalled();
    expect(transaction.recordAudit).not.toHaveBeenCalled();
  });

  it("revalidates the current active administrator in the transaction", async () => {
    const transaction = transactionStub(church(), false);
    const commands = new ChurchManagementCommands(
      unitOfWork(transaction),
      authorization()
    );

    await expect(
      commands.update(principal, { name: "Não permitido" })
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN" });
    expect(transaction.updateInstitutional).not.toHaveBeenCalled();
  });

  it("updates settings with a minimal audit diff", async () => {
    const transaction = transactionStub(church());
    const commands = new ChurchManagementCommands(
      unitOfWork(transaction),
      authorization()
    );

    await commands.updateSettings(principal, { weekStartsOn: "MONDAY" });

    expect(transaction.recordAudit).toHaveBeenCalledWith({
      actorId: principal.userId,
      action: "CHURCH_SETTINGS_UPDATED",
      before: { weekStartsOn: "SUNDAY" },
      after: { weekStartsOn: "MONDAY" }
    });
  });
});

function transactionStub(
  current: ManagedChurch,
  activeAdministrator = true
): jest.Mocked<ChurchManagementTransaction> {
  return {
    isActiveAdministrator: jest
      .fn<Promise<boolean>, [string]>()
      .mockResolvedValue(activeAdministrator),
    findChurch: jest.fn(async () => current),
    updateInstitutional: jest.fn(async (input) => ({
      ...current,
      ...input,
      updatedAt: new Date("2026-07-26T01:00:00.000Z")
    })),
    updateSettings: jest.fn(async (input) => ({
      ...current,
      ...input,
      updatedAt: new Date("2026-07-26T01:00:00.000Z")
    })),
    recordAudit: jest
      .fn<
        Promise<void>,
        [Parameters<ChurchManagementTransaction["recordAudit"]>[0]]
      >()
      .mockResolvedValue()
  };
}

function unitOfWork(
  transaction: ChurchManagementTransaction
): ChurchManagementUnitOfWork {
  return {
    execute: async (_churchId, work) => work(transaction)
  };
}
