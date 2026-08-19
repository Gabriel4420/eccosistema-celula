import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { MeetingsManagementAuthorization } from "./meetings-management.authorization";
import { MeetingsManagementError } from "./meetings-management.error";
import type { MeetingsManagementRepository, MeetingsManagementTransaction } from "./meetings-management.port";
import type {
  ListMeetingsInput,
  ManagedMeeting,
  MeetingPage,
  ManagedMeetingReport
} from "./meetings-management.types";

export class MeetingsManagementQueries {
  constructor(
    private readonly meetings: MeetingsManagementRepository,
    private readonly authorization: MeetingsManagementAuthorization,
    private readonly unitOfWork?: { execute<T>(churchId: string, work: (t: MeetingsManagementTransaction) => Promise<T>): Promise<T> }
  ) {}

  async list(principal: AuthenticatedPrincipal, cellId: string, input: ListMeetingsInput): Promise<MeetingPage> {
    this.authorization.resolveListScope(principal);
    await this.assertListScope(principal, cellId);
    return this.meetings.list(principal.churchId, cellId, input);
  }

  async get(principal: AuthenticatedPrincipal, cellId: string, meetingId: string): Promise<ManagedMeeting> {
    const meeting = await this.meetings.find(principal.churchId, meetingId);
    if (!meeting) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    if (meeting.cellId !== cellId) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    this.authorization.assertView(principal);
    await this.assertViewScope(principal, cellId);
    return meeting;
  }

  async getReport(
    principal: AuthenticatedPrincipal,
    cellId: string,
    meetingId: string
  ): Promise<ManagedMeetingReport | null> {
    const meeting = await this.meetings.find(principal.churchId, meetingId);
    if (!meeting) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    if (meeting.cellId !== cellId) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    this.authorization.assertView(principal);
    await this.assertViewScope(principal, cellId);
    return this.meetings.findReport(principal.churchId, meetingId);
  }

  private async assertViewScope(
    principal: AuthenticatedPrincipal,
    cellId: string
  ): Promise<void> {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return;
    }
    if (!this.unitOfWork) return;
    await this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const scope = await transaction.findMeetingScope(cellId);
      if (scope) {
        this.authorization.assertViewScope(principal, scope);
      }
      return undefined as never;
    });
  }

  private async assertListScope(
    principal: AuthenticatedPrincipal,
    cellId: string
  ): Promise<void> {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return;
    }
    if (!this.unitOfWork) return;
    await this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const scope = await transaction.findMeetingScope(cellId);
      if (scope) {
        this.authorization.assertViewScope(principal, scope);
      }
      return undefined as never;
    });
  }
}
