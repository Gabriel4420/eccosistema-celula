import type { ManagedCell } from "../application/cells-management.types";
import {
  presentCell,
  presentCellItem,
  presentCellPage
} from "./cells.presenter";

function cell(overrides: Partial<ManagedCell> = {}): ManagedCell {
  return {
    id: "cell-1",
    churchId: "church-1",
    code: "CEL-001",
    name: "Célula Esperança",
    status: "ACTIVE",
    leader: { id: "leader-1", name: "Líder" },
    supervisor: { id: "supervisor-1", name: "Supervisor" },
    traineeLeader: { id: "trainee-1", name: "Treinando" },
    meetingDay: "WEDNESDAY",
    meetingTime: new Date("1970-01-01T19:30:00.000Z"),
    address: "Rua das Flores, 10",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    deletedAt: null,
    ...overrides
  };
}

describe("cells presenter", () => {
  it("exposes the contract fields with HH:mm meeting time", () => {
    const presented = presentCell(cell());

    expect(presented).toEqual({
      id: "cell-1",
      code: "CEL-001",
      name: "Célula Esperança",
      status: "ACTIVE",
      leader: { id: "leader-1", name: "Líder" },
      supervisor: { id: "supervisor-1", name: "Supervisor" },
      traineeLeader: { id: "trainee-1", name: "Treinando" },
      meetingDay: "WEDNESDAY",
      meetingTime: "19:30",
      address: "Rua das Flores, 10",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z"
    });
  });

  it("never leaks the tenant id or soft-delete marker", () => {
    const presented = presentCell(cell());
    expect(presented).not.toHaveProperty("churchId");
    expect(presented).not.toHaveProperty("deletedAt");
  });

  it("renders null leadership as null", () => {
    const presented = presentCell(cell({ leader: null, supervisor: null, traineeLeader: null }));
    expect(presented.leader).toBeNull();
    expect(presented.supervisor).toBeNull();
    expect(presented.traineeLeader).toBeNull();
  });

  it("wraps a cell in its envelope", () => {
    expect(presentCellItem(cell())).toEqual({ data: expect.objectContaining({ id: "cell-1" }), meta: {} });
  });

  it("builds a page envelope with pagination metadata", () => {
    const page = presentCellPage(
      { items: [cell()], totalItems: 23 },
      3,
      10
    );
    expect(page).toEqual({
      data: [expect.objectContaining({ id: "cell-1" })],
      meta: { page: 3, pageSize: 10, totalItems: 23, totalPages: 3 }
    });
  });
});
