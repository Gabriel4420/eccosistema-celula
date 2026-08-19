import type { ManagedMeeting, MeetingPage, ManagedMeetingReport } from "../application/meetings-management.types";
import type {
  MeetingItemEnvelope,
  MeetingResponse,
  MeetingsPageEnvelope,
  MeetingReportEnvelope,
  MeetingReportDraftResponse
} from "@mission-atos/contracts";

export function presentMeeting(meeting: ManagedMeeting): MeetingResponse {
  return {
    id: meeting.id,
    cell: meeting.cell,
    meetingDate: meeting.meetingDate,
    status: meeting.status,
    cancellationReason: meeting.cancellationReason,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString()
  };
}

export function presentMeetingItem(meeting: ManagedMeeting): MeetingItemEnvelope {
  return { data: presentMeeting(meeting), meta: {} };
}

export function presentMeetingPage(
  page: MeetingPage,
  pageNumber: number,
  pageSize: number
): MeetingsPageEnvelope {
  return {
    data: page.items.map(presentMeeting),
    meta: {
      page: pageNumber,
      pageSize,
      totalItems: page.totalItems,
      totalPages: Math.ceil(page.totalItems / pageSize)
    }
  };
}

export function presentReport(report: ManagedMeetingReport | null): MeetingReportEnvelope {
  if (!report) {
    return { data: null, meta: {} };
  }
  const response: MeetingReportDraftResponse = {
    id: report.id,
    meetingId: report.meetingId,
    observations: report.observations,
    status: report.status,
    submittedBy: report.submittedBy,
    submittedAt: report.submittedAt,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString()
  };
  return { data: response, meta: {} };
}
