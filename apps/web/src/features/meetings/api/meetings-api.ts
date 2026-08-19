import {
  createMeetingRequestSchema,
  listMeetingsQuerySchema,
  meetingItemEnvelopeSchema,
  meetingsPageEnvelopeSchema,
  meetingReportEnvelopeSchema,
  meetingReportDraftRequestSchema,
  updateMeetingRequestSchema,
  updateMeetingStatusRequestSchema
} from "@mission-atos/contracts";
import type {
  CreateMeetingRequest,
  MeetingResponse,
  MeetingsPageEnvelope,
  MeetingReportEnvelope,
  MeetingReportDraftRequest,
  UpdateMeetingRequest,
  UpdateMeetingStatusRequest
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";

export interface MeetingListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly from?: string;
  readonly to?: string;
  readonly status?: MeetingStatus;
  readonly sortOrder?: "asc" | "desc";
}

export async function listMeetings(
  api: ApiClient,
  cellId: string,
  params: MeetingListParams
): Promise<MeetingsPageEnvelope> {
  const query = listMeetingsQuerySchema.parse(params);
  return api.request({
    method: "GET",
    path: `/cells/${cellId}/meetings`,
    query: {
      page: query.page,
      pageSize: query.pageSize,
      from: query.from ?? "",
      to: query.to ?? "",
      status: query.status ?? "",
      sortOrder: query.sortOrder
    },
    bearer: true,
    allowRetry: true,
    schema: meetingsPageEnvelopeSchema
  });
}

export async function getMeeting(
  api: ApiClient,
  cellId: string,
  meetingId: string
): Promise<MeetingResponse> {
  const envelope = await api.request({
    method: "GET",
    path: `/cells/${cellId}/meetings/${meetingId}`,
    bearer: true,
    allowRetry: true,
    schema: meetingItemEnvelopeSchema
  });
  return envelope.data;
}

export async function createMeeting(
  api: ApiClient,
  cellId: string,
  input: CreateMeetingRequest,
  idempotencyKey: string
): Promise<MeetingResponse> {
  const payload = createMeetingRequestSchema.parse(input);
  const envelope = await api.request({
    method: "POST",
    path: `/cells/${cellId}/meetings`,
    body: payload,
    headers: { "idempotency-key": idempotencyKey },
    bearer: true,
    schema: meetingItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateMeeting(
  api: ApiClient,
  cellId: string,
  meetingId: string,
  input: UpdateMeetingRequest
): Promise<MeetingResponse> {
  const payload = updateMeetingRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: `/cells/${cellId}/meetings/${meetingId}`,
    body: payload,
    bearer: true,
    schema: meetingItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateMeetingStatus(
  api: ApiClient,
  cellId: string,
  meetingId: string,
  input: UpdateMeetingStatusRequest
): Promise<MeetingResponse> {
  const payload = updateMeetingStatusRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: `/cells/${cellId}/meetings/${meetingId}/status`,
    body: payload,
    bearer: true,
    schema: meetingItemEnvelopeSchema
  });
  return envelope.data;
}

export async function getMeetingReport(
  api: ApiClient,
  cellId: string,
  meetingId: string
): Promise<MeetingReportEnvelope> {
  return api.request({
    method: "GET",
    path: `/cells/${cellId}/meetings/${meetingId}/report`,
    bearer: true,
    allowRetry: true,
    schema: meetingReportEnvelopeSchema
  });
}

export async function upsertMeetingReport(
  api: ApiClient,
  cellId: string,
  meetingId: string,
  input: MeetingReportDraftRequest
): Promise<MeetingReportEnvelope> {
  const payload = meetingReportDraftRequestSchema.parse(input);
  return api.request({
    method: "PUT",
    path: `/cells/${cellId}/meetings/${meetingId}/report`,
    body: payload,
    bearer: true,
    schema: meetingReportEnvelopeSchema
  });
}
