import { normalizeCellCode as domainNormalizeCellCode } from "../../domain/src/cells";
import {
  cellAssignmentOptionsEnvelopeSchema,
  cellItemEnvelopeSchema,
  cellsPageEnvelopeSchema,
  createCellRequestSchema,
  listCellAssignmentOptionsQuerySchema,
  listCellsQuerySchema,
  normalizeCellCode,
  updateCellLeaderRequestSchema,
  updateCellRequestSchema,
  updateCellStatusRequestSchema,
  updateCellTraineeLeaderRequestSchema
} from "./cells";

const uuid = () => crypto.randomUUID();
const iso = () => new Date().toISOString();

describe("cells contracts", () => {
  it("normalizes code and text on create", () => {
    expect(createCellRequestSchema.parse({
      code: "  célula   esperança ",
      name: "  Célula   Esperança  ",
      meetingDay: "WEDNESDAY",
      meetingTime: "19:30",
      address: "  Rua   das Flores, 10 "
    })).toMatchObject({
      code: "CELULA-ESPERANCA",
      name: "Célula Esperança",
      status: "FORMING",
      address: "Rua das Flores, 10"
    });
  });

  it("applies pagination and sort defaults", () => {
    expect(listCellsQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: "name",
      sortOrder: "asc"
    });
  });

  it("requires leaderId and supervisorId when status is ACTIVE", () => {
    expect(() => createCellRequestSchema.parse({
      code: "CEL-01",
      name: "Célula",
      status: "ACTIVE",
      meetingDay: "MONDAY",
      meetingTime: "20:00",
      address: "Rua A"
    })).toThrow();
    expect(() => createCellRequestSchema.parse({
      code: "CEL-01",
      name: "Célula",
      status: "ACTIVE",
      supervisorId: uuid(),
      meetingDay: "MONDAY",
      meetingTime: "20:00",
      address: "Rua A"
    })).toThrow();
    expect(createCellRequestSchema.parse({
      code: "CEL-01",
      name: "Célula",
      status: "ACTIVE",
      leaderId: uuid(),
      supervisorId: uuid(),
      meetingDay: "MONDAY",
      meetingTime: "20:00",
      address: "Rua A"
    }).status).toBe("ACTIVE");
  });

  it("rejects invalid statuses for create, status and leader payloads", () => {
    expect(() => createCellRequestSchema.parse({
      code: "CEL-01", name: "Célula", status: "CLOSED",
      meetingDay: "MONDAY", meetingTime: "20:00", address: "Rua A"
    })).toThrow();
    expect(() => updateCellStatusRequestSchema.parse({ status: "CLOSED" })).toThrow();
    expect(() => updateCellStatusRequestSchema.parse({ status: "FORMING" })).toThrow();
  });

  it("rejects empty patches and unknown fields", () => {
    expect(() => updateCellRequestSchema.parse({})).toThrow();
    expect(() => createCellRequestSchema.parse({
      code: "CEL-01", name: "Célula", churchId: uuid(),
      meetingDay: "MONDAY", meetingTime: "20:00", address: "Rua A"
    })).toThrow();
    expect(() => listCellsQuerySchema.parse({ churchId: uuid() })).toThrow();
  });

  it("rejects invalid meeting times", () => {
    expect(() => createCellRequestSchema.parse({
      code: "CEL-01", name: "Célula",
      meetingDay: "MONDAY", meetingTime: "25:00", address: "Rua A"
    })).toThrow();
    expect(() => createCellRequestSchema.parse({
      code: "CEL-01", name: "Célula",
      meetingDay: "MONDAY", meetingTime: "9:30", address: "Rua A"
    })).toThrow();
  });

  it("enforces query bounds and strict fields", () => {
    expect(() => listCellsQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => listCellsQuerySchema.parse({ pageSize: 101 })).toThrow();
    expect(() => listCellsQuerySchema.parse({ sortBy: "churchId" })).toThrow();
    expect(listCellsQuerySchema.parse({ status: "CLOSED" })).toEqual(
      expect.objectContaining({ status: "CLOSED" })
    );
  });

  it("rejects leader equals supervisor", () => {
    const id = uuid();
    expect(() => updateCellLeaderRequestSchema.parse({ leaderId: id, supervisorId: id })).toThrow();
    expect(updateCellLeaderRequestSchema.parse({ leaderId: uuid(), supervisorId: uuid() })).toBeDefined();
  });

  it("allows nullable trainee assignment", () => {
    expect(updateCellTraineeLeaderRequestSchema.parse({ traineeLeaderId: null })).toEqual({
      traineeLeaderId: null
    });
    expect(updateCellTraineeLeaderRequestSchema.parse({ traineeLeaderId: uuid() })).toBeDefined();
  });

  it("validates public item and collection envelopes", () => {
    const data = {
      id: uuid(),
      code: "CEL-001",
      name: "Célula Esperança",
      status: "ACTIVE",
      leader: { id: uuid(), name: "Líder" },
      supervisor: null,
      traineeLeader: null,
      meetingDay: "WEDNESDAY",
      meetingTime: "19:30",
      address: "Rua das Flores, 10",
      createdAt: iso(),
      updatedAt: iso()
    };
    expect(cellItemEnvelopeSchema.parse({ data, meta: {} }).data).toEqual(data);
    expect(cellsPageEnvelopeSchema.parse({
      data: [data],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    }).data).toHaveLength(1);
    expect(() => cellItemEnvelopeSchema.parse({
      data: { ...data, churchId: uuid() },
      meta: {}
    })).toThrow();
  });

  it("validates assignment options query and envelope", () => {
    expect(listCellAssignmentOptionsQuerySchema.parse({ kind: "LEADER" })).toEqual({
      page: 1,
      pageSize: 20,
      kind: "LEADER"
    });
    expect(() => listCellAssignmentOptionsQuerySchema.parse({ kind: "PASTOR" })).toThrow();
    expect(cellAssignmentOptionsEnvelopeSchema.parse({
      data: [{ id: uuid(), name: "Nome" }],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    }).data).toHaveLength(1);
  });

  it("keeps code normalization in parity with the domain package", () => {
    const samples = [
      "  célula   Esperança ",
      "açúcar & café",
      "código_1.5",
      "--- CÉLULA-02 ---",
      "GRUPO 07 - Rua A"
    ];
    for (const sample of samples) {
      expect(normalizeCellCode(sample)).toBe(domainNormalizeCellCode(sample));
    }
  });
});
