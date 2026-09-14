import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CellsManagementAuthorization } from "./cells-management.authorization";
import { CellsManagementError } from "./cells-management.error";
import {
  CellEditPolicy,
  CellListScopePolicy,
  CellViewPolicy
} from "../domain/cells-management.policy";
import type {
  CellsManagementRepository
} from "./cells-management.port";
import { CellsManagementQueries } from "./cells-management.queries";
import type { CellPage, ManagedCell } from "./cells-management.types";

const churchPrincipal: AuthenticatedPrincipal = {
  userId: "admin-1",
  churchId: "church-1",
  sessionId: "session-1",
  roles: ["ADMIN"]
};

const leaderPrincipal: AuthenticatedPrincipal = {
  userId: "leader-1",
  churchId: "church-1",
  sessionId: "session-1",
  roles: ["LEADER"]
};

const cell: ManagedCell = {
  id: "cell-1",
  churchId: "church-1",
  code: "CEL-001",
  name: "Célula Esperança",
  status: "ACTIVE",
  leader: { id: "leader-1", name: "Líder" },
  supervisor: { id: "supervisor-1", name: "Supervisor" },
  traineeLeader: null,
  memberCount: 0,
  meetingDay: "WEDNESDAY",
  meetingTime: new Date("1970-01-01T19:30:00.000Z"),
  address: "Rua das Flores, 10",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null
};

function auth(): CellsManagementAuthorization {
  return new CellsManagementAuthorization(
    new CellListScopePolicy(),
    new CellViewPolicy(),
    new CellEditPolicy()
  );
}

describe("cells management queries", () => {
  it("lists cells within the church scope derived from the principal", async () => {
    const page: CellPage = { items: [cell], totalItems: 1 };
    const repository: CellsManagementRepository = {
      list: jest.fn(async () => page),
      find: jest.fn(),
      listMembers: jest.fn()
    };

    const result = await new CellsManagementQueries(repository, auth()).list(churchPrincipal, {
      page: 2,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc"
    });

    expect(repository.list).toHaveBeenCalledWith(
      "church-1",
      { kind: "church" },
      expect.objectContaining({ page: 2, pageSize: 10 })
    );
    expect(result).toEqual(page);
  });

  it("resolves a leader scope for listing", async () => {
    const repository: CellsManagementRepository = {
      list: jest.fn(async () => ({ items: [], totalItems: 0 })),
      find: jest.fn(),
      listMembers: jest.fn()
    };

    await new CellsManagementQueries(repository, auth()).list(leaderPrincipal, {
      page: 1,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc"
    });

    expect(repository.list).toHaveBeenCalledWith(
      "church-1",
      { kind: "leader", userId: "leader-1" },
      expect.anything()
    );
  });

  it("fails closed when the principal has no approved role", async () => {
    const repository: CellsManagementRepository = {
      list: jest.fn(),
      find: jest.fn(),
      listMembers: jest.fn()
    };

    expect(() =>
      new CellsManagementQueries(repository, auth()).list(
        { ...churchPrincipal, roles: [] },
        { page: 1, pageSize: 10, sortBy: "name", sortOrder: "asc" }
      )
    ).toThrow(new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed"));
    expect(repository.list).not.toHaveBeenCalled();
  });

  it("returns the cell for a viewable resource", async () => {
    const repository: CellsManagementRepository = {
      list: jest.fn(),
      find: jest.fn(async () => cell),
      listMembers: jest.fn()
    };

    await expect(new CellsManagementQueries(repository, auth()).get(churchPrincipal, "cell-1")).resolves.toEqual(cell);
  });

  it("throws CELL_NOT_FOUND for an unknown cell", async () => {
    const repository: CellsManagementRepository = {
      list: jest.fn(),
      find: jest.fn(async () => null),
      listMembers: jest.fn()
    };

    await expect(
      new CellsManagementQueries(repository, auth()).get(churchPrincipal, "missing")
    ).rejects.toEqual(new CellsManagementError("CELL_NOT_FOUND", "Cell not found"));
  });

  it("denies viewing a cell outside the principal scope", async () => {
    const repository: CellsManagementRepository = {
      list: jest.fn(),
      find: jest.fn(async () => cell),
      listMembers: jest.fn()
    };
    const stranger: AuthenticatedPrincipal = {
      userId: "stranger-1",
      churchId: "church-1",
      sessionId: "session-1",
      roles: ["LEADER"]
    };

    await expect(
      new CellsManagementQueries(repository, auth()).get(stranger, "cell-1")
    ).rejects.toEqual(new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed"));
  });

  it("lists members of a viewable cell", async () => {
    const membersPage = {
      items: [{ personId: "person-1", fullName: "João", phone: null, joinedAt: new Date(), status: "ACTIVE" as const, reason: null }],
      totalItems: 1
    };
    const repository: CellsManagementRepository = {
      list: jest.fn(),
      find: jest.fn(async () => cell),
      listMembers: jest.fn(async () => membersPage)
    };

    const result = await new CellsManagementQueries(repository, auth()).listMembers(churchPrincipal, "cell-1", {
      page: 1,
      pageSize: 10,
      status: "ACTIVE"
    });

    expect(repository.listMembers).toHaveBeenCalledWith(
      "church-1",
      "cell-1",
      expect.objectContaining({ page: 1, pageSize: 10, status: "ACTIVE" })
    );
    expect(result).toEqual(membersPage);
  });

  it("throws CELL_NOT_FOUND when listing members of an unknown cell", async () => {
    const repository: CellsManagementRepository = {
      list: jest.fn(),
      find: jest.fn(async () => null),
      listMembers: jest.fn()
    };

    await expect(
      new CellsManagementQueries(repository, auth()).listMembers(churchPrincipal, "missing", {
        page: 1,
        pageSize: 10,
        status: "ACTIVE"
      })
    ).rejects.toEqual(new CellsManagementError("CELL_NOT_FOUND", "Cell not found"));
    expect(repository.listMembers).not.toHaveBeenCalled();
  });
});
