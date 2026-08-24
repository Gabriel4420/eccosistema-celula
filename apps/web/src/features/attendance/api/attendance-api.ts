import { attendanceEnvelopeSchema, createMeetingVisitorRequestSchema, saveAttendanceRequestSchema } from "@mission-atos/contracts";
import type { AttendanceSnapshot, CreateMeetingVisitorRequest, SaveAttendanceRequest } from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

const path = (cellId: string, meetingId: string) => `/cells/${cellId}/meetings/${meetingId}/attendance`;
export async function getAttendance(api: ApiClient, cellId: string, meetingId: string): Promise<AttendanceSnapshot> {
  return (await api.request({ method: "GET", path: path(cellId, meetingId), bearer: true, allowRetry: true, schema: attendanceEnvelopeSchema })).data;
}
export async function saveAttendance(api: ApiClient, cellId: string, meetingId: string, input: SaveAttendanceRequest): Promise<AttendanceSnapshot> {
  const body = saveAttendanceRequestSchema.parse(input);
  return (await api.request({ method: "PUT", path: path(cellId, meetingId), body, bearer: true, schema: attendanceEnvelopeSchema })).data;
}
export async function addAttendanceVisitor(api: ApiClient, cellId: string, meetingId: string, input: CreateMeetingVisitorRequest): Promise<AttendanceSnapshot> {
  const body = createMeetingVisitorRequestSchema.parse(input);
  return (await api.request({ method: "POST", path: `${path(cellId, meetingId)}/visitors`, body, headers: { "idempotency-key": crypto.randomUUID() }, bearer: true, schema: attendanceEnvelopeSchema })).data;
}
export async function removeAttendanceVisitor(api: ApiClient, cellId: string, meetingId: string, personId: string): Promise<void> {
  await api.request({ method: "DELETE", path: `${path(cellId, meetingId)}/visitors/${personId}`, bearer: true });
}
