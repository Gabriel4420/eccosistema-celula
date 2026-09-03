import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { BulkImportCommands } from "./bulk-import.commands";
import type { PeopleManagementCommands } from "../../people/application/people-management.commands";
import { PeopleManagementError } from "../../people/application/people-management.error";
import type { CellsManagementCommands } from "../../cells/application/cells-management.commands";
import { CellsManagementError } from "../../cells/application/cells-management.error";
import type { UserManagementCommands } from "../../users/application/user-management.commands";
import type { UserManagementRepository } from "../../users/application/user-management.port";
import type { BulkImportAudit } from "./bulk-import-audit.port";

const principal: AuthenticatedPrincipal = {
  userId: "admin-1",
  churchId: "church-1",
  sessionId: "session-1",
  roles: ["ADMIN"]
};

function buildCommands(overrides: {
  people?: Partial<PeopleManagementCommands>;
  cells?: Partial<CellsManagementCommands>;
  users?: Partial<UserManagementCommands>;
  userRepository?: Partial<UserManagementRepository>;
  audit?: Partial<BulkImportAudit>;
}) {
  const people = {
    create: jest.fn(async () => ({ id: "person-1", status: "ACTIVE" as const }))
  } as unknown as PeopleManagementCommands;
  const cells = {
    create: jest.fn(async () => ({ id: "cell-1", status: "ACTIVE" as const }))
  } as unknown as CellsManagementCommands;
  const users = {
    create: jest.fn(async () => ({ id: "user-1" }))
  } as unknown as UserManagementCommands;

  const userRepository = {
    managedRoles: jest.fn(async () => [{ id: "role-admin", name: "ADMIN" }])
  } as unknown as UserManagementRepository;
  const audit = {
    record: jest.fn().mockResolvedValue(undefined)
  } as unknown as BulkImportAudit;

  Object.assign(people, overrides.people ?? {});
  Object.assign(cells, overrides.cells ?? {});
  Object.assign(users, overrides.users ?? {});
  Object.assign(userRepository, overrides.userRepository ?? {});
  Object.assign(audit, overrides.audit ?? {});

  return {
    commands: new BulkImportCommands(people, cells, users, userRepository, audit),
    people,
    cells,
    users,
    userRepository,
    audit
  };
}

describe("BulkImportCommands", () => {
  describe("importPeople", () => {
    it("creates a person per valid row", async () => {
      const { commands, people } = buildCommands({});
      const result = await commands.importPeople(principal, [
        { fullName: "João Silva", phone: "+5511999998888" },
        { fullName: "Maria Souza" }
      ], "csv", "pessoas.csv");

      expect(people.create).toHaveBeenCalledTimes(2);
      expect(result.created).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.resultsPerRow.every((r) => r.status === "created")).toBe(true);
    });

    it("reports invalid rows without creating them", async () => {
      const { commands, people } = buildCommands({});
      const result = await commands.importPeople(principal, [
        { fullName: "Válido" },
        { name: "sem fullName" }
      ], "csv", "pessoas.csv");

      expect(people.create).toHaveBeenCalledTimes(1);
      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.resultsPerRow[1]?.status).toBe("error");
    });

    it("captures a domain error per row as failed", async () => {
      const duplicate = new PeopleManagementError("PERSON_DUPLICATE", "Duplicate person");
      const { commands } = buildCommands({
        people: {
          create: jest
            .fn()
            .mockRejectedValueOnce(duplicate)
            .mockResolvedValueOnce({ id: "person-2", status: "ACTIVE" as const })
        }
      });
      const result = await commands.importPeople(principal, [
        { fullName: "Igual" },
        { fullName: "Outro" }
      ], "csv", "pessoas.csv");

      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.resultsPerRow[0]).toMatchObject({
        code: "PERSON_DUPLICATE",
        message: "Duplicate person"
      });
    });

    it("links person to cell when cellCode is present", async () => {
      const { commands, people } = buildCommands({});
      await commands.importPeople(principal, [
        { fullName: "Ligado", cellCode: "CEL-1" }
      ], "json", "pessoas.json");

      expect(people.create).toHaveBeenCalledWith(
        principal,
        expect.any(Object),
        "CEL-1"
      );
    });

    it("does not link membership when cellCode is absent", async () => {
      const { commands, people } = buildCommands({});
      await commands.importPeople(principal, [
        { fullName: "Sem célula" }
      ], "json", "pessoas.json");

      expect(people.create).toHaveBeenCalledWith(
        principal,
        expect.any(Object),
        undefined
      );
    });

    it("fails the row when the cell code is not found", async () => {
      const { commands, people } = buildCommands({
        people: {
          create: jest.fn().mockRejectedValue(
            new PeopleManagementError("PERSON_CELL_NOT_FOUND", "Cell not found")
          )
        }
      });
      const result = await commands.importPeople(principal, [
        { fullName: "Sem célula existente", cellCode: "NAO-EXISTE" }
      ], "json", "pessoas.json");

      expect(result.created).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.resultsPerRow[0]?.message).toBe("Cell not found");
      expect(people.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("importCells", () => {
    const validCell = {
      code: "CEL-1",
      name: "Célula Central",
      meetingDay: "MONDAY",
      meetingTime: "19:00",
      address: "Rua A"
    };

    it("creates a cell per valid row", async () => {
      const { commands, cells } = buildCommands({});
      const result = await commands.importCells(principal, [
        validCell,
        { ...validCell, code: "CEL-2", name: "Célula Norte" }
      ], "csv", "celulas.csv");

      expect(cells.create).toHaveBeenCalledTimes(2);
      expect(result.created).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("reports duplicate code conflict per row", async () => {
      const conflict = new CellsManagementError("CELL_CODE_CONFLICT", "Cell code already exists");
      const { commands } = buildCommands({
        cells: {
          create: jest.fn().mockRejectedValue(conflict)
        }
      });
      const result = await commands.importCells(principal, [
        validCell
      ], "csv", "celulas.csv");

      expect(result.created).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.resultsPerRow[0]).toMatchObject({
        code: "CELL_CODE_CONFLICT",
        message: "Cell code already exists"
      });
    });

    it("generates a valid idempotency key unique to each import", async () => {
      const { commands, cells } = buildCommands({});
      await commands.importCells(principal, [
        validCell
      ], "csv", "celulas.csv");
      await commands.importCells(principal, [
        validCell
      ], "csv", "celulas.csv");

      const key = jest.mocked(cells.create).mock.calls[0]?.[1];
      const nextKey = jest.mocked(cells.create).mock.calls[1]?.[1];
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(nextKey).not.toBe(key);
    });
  });

  describe("importUsers", () => {
    it("resolves role names to role ids and creates the user", async () => {
      const { commands, users, userRepository } = buildCommands({});
      const result = await commands.importUsers(principal, [
        { firstName: "Ana", lastName: "Paula", email: "ana@email.com", initialPassword: "SenhaForte#1", roles: ["ADMIN"] }
      ], "csv", "usuarios.csv");

      expect(userRepository.managedRoles).toHaveBeenCalledTimes(1);
      expect(users.create).toHaveBeenCalledTimes(1);
      expect(jest.mocked(users.create).mock.calls[0]?.[1].roleIds).toEqual(["role-admin"]);
      expect(result.created).toBe(1);
    });

    it("accepts delimited role names from csv and xlsx rows", async () => {
      const { commands, users } = buildCommands({
        userRepository: {
          managedRoles: jest.fn(async () => [
            { id: "role-admin", name: "ADMIN" },
            { id: "role-pastor", name: "PASTOR" }
          ])
        }
      });

      await commands.importUsers(principal, [
        {
          firstName: "Ana",
          lastName: "Paula",
          email: "ana@email.com",
          initialPassword: "SenhaForte#1",
          roles: "admin|pastor"
        }
      ], "csv", "usuarios.csv");

      expect(users.create).toHaveBeenCalledWith(
        principal,
        expect.objectContaining({ roleIds: ["role-admin", "role-pastor"] })
      );
    });

    it("records one aggregate audit without file contents", async () => {
      const { commands, audit } = buildCommands({});
      await commands.importUsers(principal, [
        { firstName: "Ana", lastName: "Paula", email: "ana@email.com", initialPassword: "SenhaForte#1", roles: ["ADMIN"] }
      ], "json", "usuarios.json");

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({
        churchId: principal.churchId,
        userId: principal.userId,
        domain: "users",
        processed: 1,
        created: 1,
        failed: 0
      }));
      expect(jest.mocked(audit.record).mock.calls[0]?.[0]).not.toHaveProperty("fileName");
    });

    it("fails the row when a role name does not exist", async () => {
      const { commands, users } = buildCommands({});
      await commands.importUsers(principal, [
        { firstName: "Ana", lastName: "Paula", email: "ana@email.com", initialPassword: "SenhaForte#1", roles: ["INEXISTENTE"] }
      ], "csv", "usuarios.csv");

      expect(users.create).toHaveBeenCalledTimes(0);
    });

    it("fails the row on invalid input (bad email)", async () => {
      const { commands, users } = buildCommands({});
      const result = await commands.importUsers(principal, [
        { firstName: "Ana", lastName: "Paula", email: "email-invalido", initialPassword: "SenhaForte#1", roles: ["ADMIN"] }
      ], "csv", "usuarios.csv");

      expect(users.create).toHaveBeenCalledTimes(0);
      expect(result.resultsPerRow[0]?.status).toBe("error");
    });
  });
});
