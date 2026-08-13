import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CellsManagementAuthorization } from "./cells-management.authorization";
import { CellsManagementError } from "./cells-management.error";
import type { ManagedCell } from "./cells-management.types";
import {
  CellEditPolicy,
  CellListScopePolicy,
  CellViewPolicy
} from "../domain/cells-management.policy";

function principal(roles: readonly string[]): AuthenticatedPrincipal {
  return { userId: "user-1", churchId: "church-1", sessionId: "session-1", roles };
}

function cell(overrides: Partial<ManagedCell> = {}): ManagedCell {
  return {
    id: "cell-1",
    churchId: "church-1",
    code: "CEL-001",
    name: "Célula Esperança",
    status: "ACTIVE",
    leader: { id: "leader-1", name: "Líder" },
    supervisor: { id: "supervisor-1", name: "Supervisor" },
    traineeLeader: null,
    meetingDay: "WEDNESDAY",
    meetingTime: new Date("1970-01-01T19:30:00.000Z"),
    address: "Rua das Flores, 10",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  };
}

describe("cell list scope policy", () => {
  it("grants the whole church scope to ADMIN and PASTOR", () => {
    expect(new CellListScopePolicy().evaluate(principal(["ADMIN"]))).toEqual({ kind: "church" });
    expect(new CellListScopePolicy().evaluate(principal(["PASTOR"]))).toEqual({ kind: "church" });
  });

  it("scopes SUPERVISOR to supervised leaders and LEADER to own cells", () => {
    expect(new CellListScopePolicy().evaluate(principal(["SUPERVISOR"]))).toEqual({
      kind: "supervisor",
      userId: "user-1"
    });
    expect(new CellListScopePolicy().evaluate(principal(["LEADER"]))).toEqual({
      kind: "leader",
      userId: "user-1"
    });
  });

  it("fails closed for actors without an approved role", () => {
    expect(new CellListScopePolicy().evaluate(principal([]))).toBeNull();
    expect(new CellListScopePolicy().evaluate(principal(["AUXILIAR"]))).toBeNull();
  });
});

describe("cell view policy", () => {
  it("lets ADMIN and PASTOR view any cell of the tenant", () => {
    expect(new CellViewPolicy().evaluate(principal(["ADMIN"]), cell())).toBe(true);
    expect(new CellViewPolicy().evaluate(principal(["PASTOR"]), cell())).toBe(true);
  });

  it("lets a SUPERVISOR view only subordinate cells and a LEADER only own cells", () => {
    const supervised = cell({ supervisor: { id: "user-1", name: "Supervisor" } });
    const otherSupervised = cell({ supervisor: { id: "supervisor-2", name: "Outro" } });
    expect(new CellViewPolicy().evaluate(principal(["SUPERVISOR"]), supervised)).toBe(true);
    expect(new CellViewPolicy().evaluate(principal(["SUPERVISOR"]), otherSupervised)).toBe(false);

    const ownAsLeader = cell({ leader: { id: "user-1", name: "Líder" } });
    const ownAsTrainee = cell({ leader: null, traineeLeader: { id: "user-1", name: "Treinando" } });
    expect(new CellViewPolicy().evaluate(principal(["LEADER"]), ownAsLeader)).toBe(true);
    expect(new CellViewPolicy().evaluate(principal(["LEADER"]), ownAsTrainee)).toBe(true);
  });

  it("denies view to a LEADER of an unowned cell and to unapproved roles", () => {
    expect(new CellViewPolicy().evaluate(principal(["LEADER"]), cell())).toBe(false);
    expect(new CellViewPolicy().evaluate(principal([]), cell())).toBe(false);
  });
});

describe("cell edit policy", () => {
  it("gives ADMIN and PASTOR full edit level", () => {
    expect(new CellEditPolicy().evaluate(principal(["ADMIN"]), cell())).toBe("all");
    expect(new CellEditPolicy().evaluate(principal(["PASTOR"]), cell())).toBe("all");
  });

  it("gives SUPERVISOR and LEADER meeting-level edits only on their cells", () => {
    const supervised = cell({ supervisor: { id: "user-1", name: "Supervisor" } });
    const own = cell({ leader: { id: "user-1", name: "Líder" } });
    expect(new CellEditPolicy().evaluate(principal(["SUPERVISOR"]), supervised)).toBe("meeting");
    expect(new CellEditPolicy().evaluate(principal(["SUPERVISOR"]), cell())).toBe("none");
    expect(new CellEditPolicy().evaluate(principal(["LEADER"]), own)).toBe("meeting");
    expect(new CellEditPolicy().evaluate(principal(["LEADER"]), cell())).toBe("none");
  });

  it("fails closed for cells without a linked supervisor or leader", () => {
    const orphan = cell({ leader: null, supervisor: null });
    expect(new CellEditPolicy().evaluate(principal(["SUPERVISOR"]), orphan)).toBe("none");
    expect(new CellEditPolicy().evaluate(principal(["LEADER"]), orphan)).toBe("none");
  });
});

describe("cells management authorization", () => {
  const authorization = () =>
    new CellsManagementAuthorization(new CellListScopePolicy(), new CellViewPolicy(), new CellEditPolicy());

  it("resolves a list scope or fails closed", () => {
    expect(authorization().resolveListScope(principal(["SUPERVISOR"]))).toEqual({
      kind: "supervisor",
      userId: "user-1"
    });
    expect(() => authorization().resolveListScope(principal([]))).toThrowError(
      new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed")
    );
  });

  it("asserts view and edit within the approved scope", () => {
    const own = cell({ leader: { id: "user-1", name: "Líder" } });
    expect(() => authorization().assertView(principal(["LEADER"]), own)).not.toThrow();
    expect(() => authorization().assertView(principal(["LEADER"]), cell())).toThrow(
      new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed")
    );
    expect(authorization().assertCanEdit(principal(["ADMIN"]), cell())).toBe("all");
    expect(() => authorization().assertCanEdit(principal(["LEADER"]), cell())).toThrow();
  });

  it("asserts manage only for active ADMIN or PASTOR roles", () => {
    expect(() => authorization().assertManage(principal(["ADMIN"]), true)).not.toThrow();
    expect(() => authorization().assertManage(principal(["PASTOR"]), true)).not.toThrow();
    expect(() => authorization().assertManage(principal(["LEADER"]), true)).toThrow();
    expect(() => authorization().assertManage(principal(["ADMIN"]), false)).toThrow();
  });
});
