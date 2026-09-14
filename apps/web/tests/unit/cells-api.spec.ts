import type { ApiClient } from "@/src/shared/api/api-client";
import {
  addCellMember,
  createCell,
  getCell,
  listCellAssignmentOptions,
  listCellMembers,
  listCells,
  removeCellMember,
  updateCell,
  updateCellLeader,
  updateCellStatus,
  updateCellTraineeLeader
} from "@/src/features/cells/api/cells-api";

const requestMock = jest.fn();
const api = { request: requestMock } as unknown as ApiClient;

const CELL_ID = "11111111-1111-4111-8111-111111111111";
const LEADER_ID = "22222222-2222-4222-8222-222222222222";
const SUPERVISOR_ID = "33333333-3333-4333-8333-333333333333";
const TRAINEE_ID = "44444444-4444-4444-8444-444444444444";

const PAGE_META = { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };

function requestOptions() {
  return requestMock.mock.calls[0]?.[0];
}

describe("cells-api", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("lists cells with pagination, search and status filters", async () => {
    requestMock.mockResolvedValue({
      data: { data: [{ id: CELL_ID }], meta: PAGE_META },
      meta: {}
    });

    const result = await listCells(api, {
      page: 2,
      pageSize: 20,
      search: "esperança",
      status: "ACTIVE"
    });

    expect(result.data).toEqual({ data: [{ id: CELL_ID }], meta: PAGE_META });
    expect(requestOptions()).toMatchObject({
      method: "GET",
      path: "/cells",
      bearer: true,
      allowRetry: true,
      query: {
        page: 2,
        pageSize: 20,
        search: "esperança",
        status: "ACTIVE",
        leaderId: "",
        meetingDay: "",
        sortBy: "name",
        sortOrder: "asc"
      }
    });
  });

  it("gets a single cell by id", async () => {
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    const result = await getCell(api, CELL_ID);
    expect(result).toEqual({ id: CELL_ID });
    expect(requestOptions()).toMatchObject({ method: "GET", path: `/cells/${CELL_ID}` });
  });

  it("creates a cell with an idempotency-key header", async () => {
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    const result = await createCell(
      api,
      {
        code: "CEL-001",
        name: "Célula Esperança",
        status: "FORMING",
        leaderId: null,
        supervisorId: undefined,
        traineeLeaderId: null,
        meetingDay: "WEDNESDAY",
        meetingTime: "19:30",
        address: "Rua das Flores, 10"
      },
      "key-123"
    );
    expect(result).toEqual({ id: CELL_ID });
    expect(requestOptions()).toMatchObject({
      method: "POST",
      path: "/cells",
      headers: { "idempotency-key": "key-123" }
    });
  });

  it("patches a cell with only the provided fields", async () => {
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    await updateCell(api, CELL_ID, { name: "Novo nome" });
    expect(requestOptions()).toMatchObject({
      method: "PATCH",
      path: `/cells/${CELL_ID}`,
      body: { name: "Novo nome" }
    });
  });

  it("updates the cell status", async () => {
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    await updateCellStatus(api, CELL_ID, "SUSPENDED");
    expect(requestOptions()).toMatchObject({
      method: "PATCH",
      path: `/cells/${CELL_ID}/status`,
      body: { status: "SUSPENDED" }
    });
  });

  it("updates the cell leadership with leader and supervisor", async () => {
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    await updateCellLeader(api, CELL_ID, {
      leaderId: LEADER_ID,
      supervisorId: SUPERVISOR_ID
    });
    expect(requestOptions()).toMatchObject({
      method: "PATCH",
      path: `/cells/${CELL_ID}/leader`,
      body: { leaderId: LEADER_ID, supervisorId: SUPERVISOR_ID }
    });
  });

  it("updates or removes the trainee leader", async () => {
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    await updateCellTraineeLeader(api, CELL_ID, TRAINEE_ID);
    expect(requestOptions()).toMatchObject({
      method: "PATCH",
      path: `/cells/${CELL_ID}/trainee-leader`,
      body: { traineeLeaderId: TRAINEE_ID }
    });

    requestMock.mockReset();
    requestMock.mockResolvedValue({ data: { id: CELL_ID }, meta: {} });
    await updateCellTraineeLeader(api, CELL_ID, null);
    expect(requestOptions()).toMatchObject({
      body: { traineeLeaderId: null }
    });
  });

  it("lists assignment options for a kind with pagination", async () => {
    requestMock.mockResolvedValue({
      data: [{ id: LEADER_ID, name: "Líder" }],
      meta: PAGE_META
    });
    const result = await listCellAssignmentOptions(api, { kind: "LEADER", search: "lí" });
    expect(result).toEqual([{ id: LEADER_ID, name: "Líder" }]);
    expect(requestOptions()).toMatchObject({
      method: "GET",
      path: "/users/cell-assignment-options",
      query: { kind: "LEADER", page: 1, pageSize: 20, search: "lí" }
    });
  });

  it("lists cell members with pagination and status filter", async () => {
    const member = {
      personId: TRAINEE_ID,
      fullName: "Maria",
      phone: null,
      joinedAt: "2026-08-01T19:00:00.000Z",
      status: "ACTIVE"
    };
    requestMock.mockResolvedValue({
      data: { data: [member], meta: PAGE_META },
      meta: {}
    });
    const result = await listCellMembers(api, CELL_ID, {
      page: 1,
      pageSize: 10,
      status: "ACTIVE"
    });
    expect(result.data).toEqual({ data: [member], meta: PAGE_META });
    expect(requestOptions()).toMatchObject({
      method: "GET",
      path: `/cells/${CELL_ID}/members`,
      query: { page: 1, pageSize: 10, search: "", status: "ACTIVE" }
    });
  });

  it("adds a member to a cell", async () => {
    requestMock.mockResolvedValue({
      data: {
        personId: TRAINEE_ID,
        fullName: "Maria",
        phone: null,
        joinedAt: "2026-08-01T19:00:00.000Z",
        status: "ACTIVE",
        reason: null
      },
      meta: {}
    });
    const result = await addCellMember(api, CELL_ID, TRAINEE_ID);
    expect(result.personId).toBe(TRAINEE_ID);
    expect(requestOptions()).toMatchObject({
      method: "POST",
      path: `/cells/${CELL_ID}/members`,
      body: { personId: TRAINEE_ID }
    });
  });

  it("adds a member with a transfer reason", async () => {
    requestMock.mockResolvedValue({
      data: {
        personId: TRAINEE_ID,
        fullName: "Maria",
        phone: null,
        joinedAt: "2026-08-01T19:00:00.000Z",
        status: "ACTIVE",
        reason: null
      },
      meta: {}
    });
    await addCellMember(api, CELL_ID, TRAINEE_ID, "Solicitou mudança de célula");
    expect(requestOptions()).toMatchObject({
      method: "POST",
      path: `/cells/${CELL_ID}/members`,
      body: { personId: TRAINEE_ID, reason: "Solicitou mudança de célula" }
    });
  });

  it("removes a member from a cell", async () => {
    requestMock.mockResolvedValue({ data: null, meta: {} });
    await removeCellMember(api, CELL_ID, TRAINEE_ID);
    expect(requestOptions()).toMatchObject({
      method: "DELETE",
      path: `/cells/${CELL_ID}/members/${TRAINEE_ID}`,
      body: {}
    });
  });

  it("removes a member with a reason", async () => {
    requestMock.mockResolvedValue({ data: null, meta: {} });
    await removeCellMember(api, CELL_ID, TRAINEE_ID, "Mudou de igreja");
    expect(requestOptions()).toMatchObject({
      method: "DELETE",
      path: `/cells/${CELL_ID}/members/${TRAINEE_ID}`,
      body: { reason: "Mudou de igreja" }
    });
  });
});
