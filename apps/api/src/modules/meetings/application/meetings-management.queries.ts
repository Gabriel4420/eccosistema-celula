import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { MeetingsManagementAuthorization } from "./meetings-management.authorization";
import { MeetingsManagementError } from "./meetings-management.error";
import type { MeetingsManagementRepository } from "./meetings-management.port";
import type {
  ListMeetingsInput,
  ManagedMeeting,
  MeetingPage,
  ManagedMeetingReport
} from "./meetings-management.types";

export class MeetingsManagementQueries {
  constructor(
    private readonly meetings: MeetingsManagementRepository,
    private readonly authorization: MeetingsManagementAuthorization
  ) {}

  list(principal: AuthenticatedPrincipal, cellId: string, input: ListMeetingsInput): Promise<MeetingPage> {
    this.authorization.resolveListScope(principal);
    return this.meetings.list(principal.churchId, cellId, input);
  }

  async get(principal: AuthenticatedPrincipal, meetingId: string): Promise<ManagedMeeting> {
    const meeting = await this.meetings.find(principal.churchId, meetingId);
    if (!meeting) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    this.authorization.assertView(principal, meeting);
    return meeting;
  }

  async getReport(
    principal: AuthenticatedPrincipal,
    meetingId: string
  ): Promise<ManagedMeetingReport | null> {
    const meeting = await this.meetings.find(principal.churchId, meetingId);
    if (!meeting) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    this.authorization.assertView(principal, meeting);
    return this.meetings.findReport(principal.churchId, meetingId);
  }
}
