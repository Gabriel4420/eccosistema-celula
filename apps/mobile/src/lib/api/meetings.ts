import type {
  MeetingsPageEnvelope,
  MeetingItemEnvelope,
  CreateMeetingRequest,
  MeetingReportDraftRequest,
  UpdateMeetingStatusRequest
} from "@mission-atos/contracts";
import { API_URL } from "../config";
import { apiRequest } from "./client";

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
  return `?${qs}`;
}

export async function listMeetings(
  cellId: string,
  params: { page?: number; pageSize?: number; status?: string } = {}
): Promise<MeetingsPageEnvelope> {
  return apiRequest<MeetingsPageEnvelope>(
    `${API_URL}/cells/${cellId}/meetings${buildQuery(params as unknown as Record<string, string>)}`
  );
}

export async function getMeeting(
  cellId: string,
  meetingId: string
): Promise<MeetingItemEnvelope> {
  return apiRequest<MeetingItemEnvelope>(
    `${API_URL}/cells/${cellId}/meetings/${meetingId}`
  );
}

export async function createMeeting(
  cellId: string,
  body: CreateMeetingRequest,
  idempotencyKey: string
): Promise<MeetingItemEnvelope> {
  return apiRequest<MeetingItemEnvelope>(
    `${API_URL}/cells/${cellId}/meetings`,
    { method: "POST", body, idempotencyKey }
  );
}

export async function updateMeetingReport(
  cellId: string,
  meetingId: string,
  body: MeetingReportDraftRequest
): Promise<void> {
  await apiRequest(`${API_URL}/cells/${cellId}/meetings/${meetingId}/report`, {
    method: "PUT",
    body
  });
}

export async function updateMeetingStatus(
  cellId: string,
  meetingId: string,
  body: UpdateMeetingStatusRequest
): Promise<void> {
  await apiRequest(
    `${API_URL}/cells/${cellId}/meetings/${meetingId}/status`,
    { method: "PATCH", body }
  );
}