import type {
  AttendanceEnvelope,
  SaveAttendanceRequest
} from "@mission-atos/contracts";
import { API_URL } from "../config";
import { apiRequest } from "./client";

export async function getAttendance(
  cellId: string,
  meetingId: string
): Promise<AttendanceEnvelope> {
  return apiRequest<AttendanceEnvelope>(
    `${API_URL}/cells/${cellId}/meetings/${meetingId}/attendance`
  );
}

export async function saveAttendance(
  cellId: string,
  meetingId: string,
  body: SaveAttendanceRequest
): Promise<AttendanceEnvelope> {
  return apiRequest<AttendanceEnvelope>(
    `${API_URL}/cells/${cellId}/meetings/${meetingId}/attendance`,
    { method: "PUT", body }
  );
}