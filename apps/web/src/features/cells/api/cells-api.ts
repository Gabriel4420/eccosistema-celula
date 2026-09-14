import {
  cellAssignmentOptionsEnvelopeSchema,
  cellItemEnvelopeSchema,
  cellMemberItemEnvelopeSchema,
  cellMembersPageEnvelopeSchema,
  cellsPageEnvelopeSchema,
  createCellMemberRequestSchema,
  createCellRequestSchema,
  listCellAssignmentOptionsQuerySchema,
  listCellMembersQuerySchema,
  listCellsQuerySchema,
  removeCellMemberRequestSchema,
  updateCellLeaderRequestSchema,
  updateCellRequestSchema,
  updateCellStatusRequestSchema,
  updateCellTraineeLeaderRequestSchema
} from "@mission-atos/contracts";
import type {
  CellAssignmentOption,
  CellMemberResponse,
  CellMembersPageEnvelope,
  CellResponse,
  CellsPageEnvelope,
  CreateCellRequest,
  UpdateCellLeaderRequest,
  UpdateCellRequest,
  UpdateCellTraineeLeaderRequest
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export type CellStatus = "FORMING" | "ACTIVE" | "SUSPENDED" | "CLOSED";
export type CellMeetingDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";
export type CellAssignmentKind = "SUPERVISOR" | "LEADER" | "TRAINEE";
export type CellMemberStatus = "ACTIVE" | "INACTIVE" | "TRANSFERRED";

export interface CellListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: CellStatus;
  readonly leaderId?: string;
  readonly meetingDay?: CellMeetingDay;
  readonly sortBy?: "name" | "code" | "meetingDay" | "createdAt";
  readonly sortOrder?: "asc" | "desc";
}

export async function listCells(
  api: ApiClient,
  params: CellListParams
): Promise<CellsPageEnvelope> {
  const query = listCellsQuerySchema.parse(params);
  return api.request({
    method: "GET",
    path: "/cells",
    query: {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search ?? "",
      status: query.status ?? "",
      leaderId: query.leaderId ?? "",
      meetingDay: query.meetingDay ?? "",
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    },
    bearer: true,
    allowRetry: true,
    schema: cellsPageEnvelopeSchema
  });
}

export async function getCell(api: ApiClient, id: string): Promise<CellResponse> {
  const envelope = await api.request({
    method: "GET",
    path: `/cells/${id}`,
    bearer: true,
    allowRetry: true,
    schema: cellItemEnvelopeSchema
  });
  return envelope.data;
}

export async function createCell(
  api: ApiClient,
  input: CreateCellRequest,
  idempotencyKey: string
): Promise<CellResponse> {
  const payload = createCellRequestSchema.parse(input);
  const envelope = await api.request({
    method: "POST",
    path: "/cells",
    body: payload,
    headers: { "idempotency-key": idempotencyKey },
    bearer: true,
    schema: cellItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateCell(
  api: ApiClient,
  id: string,
  input: UpdateCellRequest
): Promise<CellResponse> {
  const payload = updateCellRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: `/cells/${id}`,
    body: payload,
    bearer: true,
    schema: cellItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateCellStatus(
  api: ApiClient,
  id: string,
  status: "ACTIVE" | "SUSPENDED"
): Promise<CellResponse> {
  const payload = updateCellStatusRequestSchema.parse({ status });
  const envelope = await api.request({
    method: "PATCH",
    path: `/cells/${id}/status`,
    body: payload,
    bearer: true,
    schema: cellItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateCellLeader(
  api: ApiClient,
  id: string,
  input: UpdateCellLeaderRequest
): Promise<CellResponse> {
  const payload = updateCellLeaderRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: `/cells/${id}/leader`,
    body: payload,
    bearer: true,
    schema: cellItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateCellTraineeLeader(
  api: ApiClient,
  id: string,
  traineeLeaderId: string | null
): Promise<CellResponse> {
  const payload: UpdateCellTraineeLeaderRequest =
    updateCellTraineeLeaderRequestSchema.parse({ traineeLeaderId });
  const envelope = await api.request({
    method: "PATCH",
    path: `/cells/${id}/trainee-leader`,
    body: payload,
    bearer: true,
    schema: cellItemEnvelopeSchema
  });
  return envelope.data;
}

export interface CellAssignmentOptionsParams {
  readonly kind: CellAssignmentKind;
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function listCellAssignmentOptions(
  api: ApiClient,
  params: CellAssignmentOptionsParams
): Promise<readonly CellAssignmentOption[]> {
  const query = listCellAssignmentOptionsQuerySchema.parse(params);
  const envelope = await api.request({
    method: "GET",
    path: "/users/cell-assignment-options",
    query: {
      kind: query.kind,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search ?? ""
    },
    bearer: true,
    allowRetry: true,
    schema: cellAssignmentOptionsEnvelopeSchema
  });
  return envelope.data;
}

export interface CellMemberListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: CellMemberStatus;
}

export async function listCellMembers(
  api: ApiClient,
  cellId: string,
  params: CellMemberListParams
): Promise<CellMembersPageEnvelope> {
  const query = listCellMembersQuerySchema.parse(params);
  return api.request({
    method: "GET",
    path: `/cells/${cellId}/members`,
    query: {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search ?? "",
      status: query.status ?? "ACTIVE"
    },
    bearer: true,
    allowRetry: true,
    schema: cellMembersPageEnvelopeSchema
  });
}

export async function addCellMember(
  api: ApiClient,
  cellId: string,
  personId: string,
  reason?: string
): Promise<CellMemberResponse> {
  const payload = createCellMemberRequestSchema.parse({
    personId,
    ...(reason ? { reason } : {})
  });
  const envelope = await api.request({
    method: "POST",
    path: `/cells/${cellId}/members`,
    body: payload,
    bearer: true,
    schema: cellMemberItemEnvelopeSchema
  });
  return envelope.data;
}

export async function removeCellMember(
  api: ApiClient,
  cellId: string,
  personId: string,
  reason?: string
): Promise<void> {
  const payload = removeCellMemberRequestSchema.parse({
    ...(reason ? { reason } : {})
  });
  await api.request({
    method: "DELETE",
    path: `/cells/${cellId}/members/${personId}`,
    body: payload,
    bearer: true
  });
}
