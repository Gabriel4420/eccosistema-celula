import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { civilDayBounds } from "../../dashboard-analytics/application/dashboard-analytics.time";
import type {
  AttendanceDetailRow,
  AttendanceSummaryRow,
  ExportRow,
  HealthScopeInput,
  MeetingsReportRow,
  PaginatedResult,
  PendingReportRowInput,
  ReportsScope,
  VisitorMetrics,
  VisitorReportRow
} from "../application/reports.types";
import type { ReportsRepository } from "../application/reports.port";
import { ReportsError } from "../application/reports.error";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_REPORT_DEADLINE_HOURS = 48;

interface MembershipRow {
  cellId: string;
  personId: string;
  joinedAt: Date;
  leftAt: Date | null;
  deletedAt: Date | null;
}

interface EligibilityData {
  memberships: MembershipRow[];
  personDeletedBy: Map<string, Date | null>;
}

const EMPTY_ELIGIBILITY: EligibilityData = { memberships: [], personDeletedBy: new Map() };

@Injectable()
export class PrismaReportsRepository implements ReportsRepository {
  private readonly logger = new Logger(PrismaReportsRepository.name);

  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient
  ) {}

  async getChurchTimezone(churchId: string): Promise<string> {
    const church = await this.database.church.findFirst({
      where: { id: churchId },
      select: { timezone: true }
    });
    return church?.timezone ?? DEFAULT_TIMEZONE;
  }

  async getChurchDeadlineSettings(churchId: string): Promise<{ timezone: string; reportDeadlineHours: number }> {
    const church = await this.database.church.findFirst({
      where: { id: churchId },
      select: {
        timezone: true,
        churchSettings: { select: { reportDeadlineHours: true } }
      }
    });
    return {
      timezone: church?.timezone ?? DEFAULT_TIMEZONE,
      reportDeadlineHours: church?.churchSettings?.reportDeadlineHours ?? DEFAULT_REPORT_DEADLINE_HOURS
    };
  }

  async getChurchName(churchId: string): Promise<string> {
    const church = await this.database.church.findFirst({
      where: { id: churchId },
      select: { name: true }
    });
    return church?.name ?? "";
  }

  async findPendingReports(
    churchId: string,
    scope: ReportsScope,
    input: { from: string; to: string; status?: string; cellId?: string },
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<PendingReportRowInput>> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.pendingReports", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return { items: [], totalItems: 0 };
      }
      const filteredCellIds = input.cellId
        ? cellIds.filter((id) => id === input.cellId)
        : cellIds;
      if (!filteredCellIds.length) {
        return { items: [], totalItems: 0 };
      }
      const from = civilDayBounds(input.from, DEFAULT_TIMEZONE).start;
      const to = civilDayBounds(input.to, DEFAULT_TIMEZONE).end;
      const meetings = await transaction.meeting.findMany({
        where: {
          churchId,
          cellId: { in: filteredCellIds },
          deletedAt: null,
          meetingDate: { gte: from, lte: to }
        },
        select: {
          id: true,
          cellId: true,
          meetingDate: true,
          status: true,
          report: {
            select: { status: true, submittedAt: true, updatedAt: true }
          }
        }
      });
      const pending = meetings.filter((meeting) => {
        if (meeting.status !== "COMPLETED") return false;
        const reportStatus = meeting.report?.status;
        if (!reportStatus || reportStatus === "NOT_STARTED" || reportStatus === "DRAFT" || reportStatus === "RETURNED") return true;
        return false;
      });
      const filtered = input.status
        ? pending.filter((meeting) => {
            if (input.status === "NO_REPORT") return !meeting.report;
            return meeting.report?.status === input.status;
          })
        : pending;
      const totalItems = filtered.length;
      const cellIdsFromMeetings = [...new Set(filtered.map((m) => m.cellId))];
      const cells = cellIdsFromMeetings.length
        ? await transaction.cell.findMany({
            where: { churchId, deletedAt: null, id: { in: cellIdsFromMeetings } },
            select: { id: true, code: true, name: true, leaderId: true }
          })
        : [];
      const cellMap = new Map(cells.map((cell) => [cell.id, cell]));
      const leaderIds = cells.map((cell) => cell.leaderId).filter((id): id is string => id !== null);
      const leaders = leaderIds.length
        ? await transaction.user.findMany({
            where: { id: { in: leaderIds }, churchId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true }
          })
        : [];
      const leaderMap = new Map(leaders.map((leader) => [leader.id, leader]));
      const now = new Date();
      const items: PendingReportRowInput[] = filtered.map((meeting) => {
        const cell = cellMap.get(meeting.cellId);
        const leader = cell?.leaderId ? leaderMap.get(cell.leaderId) ?? null : null;
        const meetingCivil = meeting.meetingDate.toISOString().slice(0, 10);
        const daysSince = Math.floor((now.getTime() - meeting.meetingDate.getTime()) / 86_400_000);
        return {
          cell: cell ? { id: cell.id, code: cell.code, name: cell.name } : { id: meeting.cellId, code: "", name: "" },
          leader: leader ? { firstName: leader.firstName, lastName: leader.lastName } : null,
          meetingDate: meetingCivil,
          daysSinceMeeting: daysSince,
          reportStatus: normalizeReportStatus(meeting.report?.status),
          lastReturnedAt: meeting.report?.status === "RETURNED" && meeting.report.submittedAt ? meeting.report.submittedAt.toISOString() : null
        };
      });
      items.sort((a, b) => b.daysSinceMeeting - a.daysSinceMeeting);
      const paged = items.slice((page - 1) * pageSize, page * pageSize);
      this.logger.log(JSON.stringify({ operation: "reports.pendingReports", result: "success", durationMs: Date.now() - startedAt, itemCount: paged.length }));
      return { items: paged, totalItems };
    }, { isolationLevel: "RepeatableRead" });
  }

  async findAttendanceSummary(
    churchId: string,
    scope: ReportsScope,
    input: { from: string; to: string } & HealthScopeInput,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<AttendanceSummaryRow>> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.attendanceSummary", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return { items: [], totalItems: 0 };
      }
      const filteredCellIds = input.cellId
        ? cellIds.filter((id) => id === input.cellId)
        : cellIds;
      if (!filteredCellIds.length) {
        return { items: [], totalItems: 0 };
      }
      const from = civilDayBounds(input.from, DEFAULT_TIMEZONE).start;
      const to = civilDayBounds(input.to, DEFAULT_TIMEZONE).end;
      const meetings = await transaction.meeting.findMany({
        where: {
          churchId,
          cellId: { in: filteredCellIds },
          deletedAt: null,
          status: "COMPLETED",
          meetingDate: { gte: from, lte: to }
        },
        select: { id: true, cellId: true, meetingDate: true }
      });
      const meetingsByCell = new Map<string, { id: string; meetingDate: Date }[]>();
      for (const meeting of meetings) {
        const list = meetingsByCell.get(meeting.cellId) ?? [];
        list.push({ id: meeting.id, meetingDate: meeting.meetingDate });
        meetingsByCell.set(meeting.cellId, list);
      }
      const meetingIds = meetings.map((m) => m.id);
      const eligibilityData = await this.loadMembershipData(transaction, churchId, filteredCellIds);
      const presentMarks = meetingIds.length
        ? await transaction.meetingAttendance.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null, attendanceStatus: "PRESENT" },
            select: { meetingId: true, personId: true }
          })
        : [];
      const visitors = meetingIds.length
        ? await transaction.meetingVisitor.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true }
          })
        : [];
      const visitorSet = new Set(visitors.map((v) => `${v.meetingId}:${v.personId}`));
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: filteredCellIds }, ...(input.status ? { status: input.status } : {}) },
        select: { id: true, code: true, name: true, leaderId: true }
      });
      const cellMap = new Map(cells.map((cell) => [cell.id, cell]));
      const summaryCellIds = cells.map((cell) => cell.id);
      const leaderIds = cells.map((c) => c.leaderId).filter((id): id is string => id !== null);
      const leaders = leaderIds.length
        ? await transaction.user.findMany({
            where: { id: { in: leaderIds }, churchId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true }
          })
        : [];
      const leaderMap = new Map(leaders.map((l) => [l.id, l]));
      const summaries: AttendanceSummaryRow[] = [];
      for (const cellId of summaryCellIds) {
        const cellMeetings = meetingsByCell.get(cellId) ?? [];
        const cell = cellMap.get(cellId);
        const leader = cell?.leaderId ? leaderMap.get(cell.leaderId) ?? null : null;
        let totalPresent = 0;
        let totalEligible = 0;
        let totalVisitors = 0;
        for (const meeting of cellMeetings) {
          const eligible = this.computeEligible(meeting.meetingDate, cellId, eligibilityData);
          totalEligible += eligible.size;
          for (const mark of presentMarks) {
            if (mark.meetingId === meeting.id && eligible.has(mark.personId) && !visitorSet.has(`${mark.meetingId}:${mark.personId}`)) {
              totalPresent += 1;
            }
          }
          totalVisitors += visitors.filter((v) => v.meetingId === meeting.id).length;
        }
        const attendanceRate = totalEligible > 0 ? roundPercentage(totalPresent / totalEligible) : null;
        const healthBand = computeHealthBand(attendanceRate);
        summaries.push({
          cell: cell ? { id: cell.id, code: cell.code, name: cell.name } : { id: cellId, code: "", name: "" },
          leader: leader ? { firstName: leader.firstName, lastName: leader.lastName } : null,
          totalMeetings: cellMeetings.length,
          attendanceRate,
          averagePresent: cellMeetings.length > 0 ? Math.round(((totalPresent + totalVisitors) / cellMeetings.length) * 100) / 100 : 0,
          totalVisitors,
          healthBand
        });
      }
      const filteredByHealth = input.health
        ? summaries.filter((s) => s.healthBand === input.health)
        : summaries;
      filteredByHealth.sort((a, b) => {
        if (a.attendanceRate === null && b.attendanceRate === null) return 0;
        if (a.attendanceRate === null) return 1;
        if (b.attendanceRate === null) return -1;
        return a.attendanceRate - b.attendanceRate;
      });
      const totalItems = filteredByHealth.length;
      const paged = filteredByHealth.slice((page - 1) * pageSize, page * pageSize);
      this.logger.log(JSON.stringify({ operation: "reports.attendanceSummary", result: "success", durationMs: Date.now() - startedAt, itemCount: paged.length }));
      return { items: paged, totalItems };
    }, { isolationLevel: "RepeatableRead" });
  }

  async findAttendanceDetail(
    churchId: string,
    scope: ReportsScope,
    input: { cellId: string; from?: string; to?: string },
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<AttendanceDetailRow>> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.includes(input.cellId)) {
        this.logger.log(JSON.stringify({ operation: "reports.attendanceDetail", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return { items: [], totalItems: 0 };
      }
      const meetingWhere: Record<string, unknown> = {
        churchId,
        cellId: input.cellId,
        deletedAt: null,
        status: "COMPLETED"
      };
      if (input.from) {
        const { start } = civilDayBounds(input.from, DEFAULT_TIMEZONE);
        meetingWhere.meetingDate = { ...((meetingWhere.meetingDate as Record<string, unknown>) ?? {}), gte: start };
      }
      if (input.to) {
        const { end } = civilDayBounds(input.to, DEFAULT_TIMEZONE);
        meetingWhere.meetingDate = { ...((meetingWhere.meetingDate as Record<string, unknown>) ?? {}), lte: end };
      }
      const meetings = await transaction.meeting.findMany({
        where: meetingWhere,
        select: { id: true, meetingDate: true },
        orderBy: { meetingDate: "asc" }
      });
      if (!meetings.length) {
        return { items: [], totalItems: 0 };
      }
      const meetingIds = meetings.map((m) => m.id);
      const eligibilityData = await this.loadMembershipData(transaction, churchId, [input.cellId]);
      const allAttendance = await transaction.meetingAttendance.findMany({
        where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
        select: { meetingId: true, personId: true, attendanceStatus: true }
      });
      const personIds = [...new Set(allAttendance.map((a) => a.personId))];
      const people = personIds.length
        ? await transaction.person.findMany({
            where: { id: { in: personIds }, churchId, deletedAt: null },
            select: { id: true, fullName: true }
          })
        : [];
      const personMap = new Map(people.map((p) => [p.id, p.fullName]));
      const attendanceByPerson = new Map<string, Map<string, "PRESENT" | "ABSENT" | "EXCUSED">>();
      for (const mark of allAttendance) {
        let byMeeting = attendanceByPerson.get(mark.personId);
        if (!byMeeting) {
          byMeeting = new Map();
          attendanceByPerson.set(mark.personId, byMeeting);
        }
        byMeeting.set(mark.meetingId, mark.attendanceStatus);
      }
      const first = meetings[0]!;
      const allEligible = this.computeEligible(first.meetingDate, input.cellId, eligibilityData);
      for (let i = 1; i < meetings.length; i++) {
        const eligible = this.computeEligible(meetings[i]!.meetingDate, input.cellId, eligibilityData);
        for (const personId of eligible) {
          allEligible.add(personId);
        }
      }
      const details: AttendanceDetailRow[] = [];
      for (const personId of allEligible) {
        const fullName = personMap.get(personId) ?? "";
        const attendanceByMeeting = meetings.map((meeting) => {
          const status = attendanceByPerson.get(personId)?.get(meeting.id);
          return {
            meetingId: meeting.id,
            meetingDate: meeting.meetingDate.toISOString().slice(0, 10),
            status: status ?? "UNMARKED" as const
          };
        });
        const totalPresent = attendanceByMeeting.filter((a) => a.status === "PRESENT").length;
        const totalAbsent = attendanceByMeeting.filter((a) => a.status === "ABSENT").length;
        const totalExcused = attendanceByMeeting.filter((a) => a.status === "EXCUSED").length;
        const ratedCount = totalPresent + totalAbsent + totalExcused;
        const attendanceRate = ratedCount > 0 ? roundPercentage(totalPresent / ratedCount) : null;
        details.push({
          person: { id: personId, fullName },
          attendanceByMeeting,
          totalPresent,
          totalAbsent,
          totalExcused,
          attendanceRate
        });
      }
      details.sort((a, b) => {
        if (a.attendanceRate === null && b.attendanceRate === null) return 0;
        if (a.attendanceRate === null) return 1;
        if (b.attendanceRate === null) return -1;
        return a.attendanceRate - b.attendanceRate;
      });
      const totalItems = details.length;
      const paged = details.slice((page - 1) * pageSize, page * pageSize);
      this.logger.log(JSON.stringify({ operation: "reports.attendanceDetail", result: "success", durationMs: Date.now() - startedAt, itemCount: paged.length }));
      return { items: paged, totalItems };
    }, { isolationLevel: "RepeatableRead" });
  }

  async findVisitors(
    churchId: string,
    scope: ReportsScope,
    input: { from: string; to: string; cellId?: string; contactPending?: boolean },
    page: number,
    pageSize: number
  ): Promise<{ items: VisitorReportRow[]; totalItems: number; metrics: VisitorMetrics }> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.visitors", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return { items: [], totalItems: 0, metrics: { total: 0, contactPendingCount: 0, topCell: null } };
      }
      const filteredCellIds = input.cellId
        ? cellIds.filter((id) => id === input.cellId)
        : cellIds;
      if (!filteredCellIds.length) {
        return { items: [], totalItems: 0, metrics: { total: 0, contactPendingCount: 0, topCell: null } };
      }
      const from = civilDayBounds(input.from, DEFAULT_TIMEZONE).start;
      const to = civilDayBounds(input.to, DEFAULT_TIMEZONE).end;
      const meetings = await transaction.meeting.findMany({
        where: {
          churchId,
          cellId: { in: filteredCellIds },
          deletedAt: null,
          meetingDate: { gte: from, lte: to }
        },
        select: { id: true, cellId: true, meetingDate: true }
      });
      const meetingsByCell = new Map<string, { id: string; meetingDate: Date }[]>();
      for (const meeting of meetings) {
        const list = meetingsByCell.get(meeting.cellId) ?? [];
        list.push({ id: meeting.id, meetingDate: meeting.meetingDate });
        meetingsByCell.set(meeting.cellId, list);
      }
      const meetingIds = meetings.map((m) => m.id);
      const visitorRecords = meetingIds.length
        ? await transaction.meetingVisitor.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: {
              meetingId: true,
              personId: true,
              invitedByPersonId: true,
              observation: true
            }
          })
        : [];
      const allPersonIds = new Set<string>();
      for (const v of visitorRecords) {
        allPersonIds.add(v.personId);
        if (v.invitedByPersonId) allPersonIds.add(v.invitedByPersonId);
      }
      const people = allPersonIds.size
        ? await transaction.person.findMany({
            where: { id: { in: [...allPersonIds] }, churchId, deletedAt: null },
            select: { id: true, fullName: true, phone: true }
          })
        : [];
      const personMap = new Map(people.map((p) => [p.id, { fullName: p.fullName, phone: p.phone }]));
      const cellIdsFromMeetings = [...new Set(meetings.map((m) => m.cellId))];
      const cells = cellIdsFromMeetings.length
        ? await transaction.cell.findMany({
            where: { churchId, deletedAt: null, id: { in: cellIdsFromMeetings } },
            select: { id: true, code: true, name: true }
          })
        : [];
      const cellMap = new Map(cells.map((c) => [c.id, c]));
      const meetingMap = new Map(meetings.map((m) => [m.id, m]));
      const allRows: VisitorReportRow[] = visitorRecords.map((v) => {
        const person = personMap.get(v.personId);
        const cell = cellMap.get(meetingMap.get(v.meetingId)?.cellId ?? "");
        const meeting = meetingMap.get(v.meetingId);
        const inviter = v.invitedByPersonId ? personMap.get(v.invitedByPersonId) ?? null : null;
        const contactPending = !person?.phone || person.phone.trim() === "";
        return {
          person: { id: v.personId, fullName: person?.fullName ?? "", phone: person?.phone ?? null },
          cell: cell ? { id: cell.id, code: cell.code, name: cell.name } : { id: "", code: "", name: "" },
          meetingDate: meeting?.meetingDate.toISOString().slice(0, 10) ?? "",
          invitedBy: inviter ? { fullName: inviter.fullName } : null,
          observation: v.observation ?? null,
          contactPending
        };
      });
      const total = allRows.length;
      const contactPendingCount = allRows.filter((r) => r.contactPending).length;
      const countByCell = new Map<string, number>();
      for (const row of allRows) {
        countByCell.set(row.cell.id, (countByCell.get(row.cell.id) ?? 0) + 1);
      }
      let topCell: VisitorMetrics["topCell"] = null;
      for (const [cellId, count] of countByCell) {
        if (!topCell || count > topCell.count) {
          const cell = cellMap.get(cellId);
          topCell = cell
            ? { id: cell.id, code: cell.code, name: cell.name, count }
            : { id: cellId, code: "", name: "", count };
        }
      }
      const filteredByPending = input.contactPending !== undefined
        ? allRows.filter((r) => r.contactPending === input.contactPending)
        : allRows;
      filteredByPending.sort((a, b) => (a.meetingDate < b.meetingDate ? 1 : a.meetingDate > b.meetingDate ? -1 : 0));
      const totalItems = filteredByPending.length;
      const paged = filteredByPending.slice((page - 1) * pageSize, page * pageSize);
      this.logger.log(JSON.stringify({ operation: "reports.visitors", result: "success", durationMs: Date.now() - startedAt, itemCount: paged.length }));
      return { items: paged, totalItems, metrics: { total, contactPendingCount, topCell } };
    }, { isolationLevel: "RepeatableRead" });
  }

  async findMeetingsReport(
    churchId: string,
    scope: ReportsScope,
    input: { from: string; to: string; cellId?: string; status?: string },
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<MeetingsReportRow>> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.meetingsReport", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return { items: [], totalItems: 0 };
      }
      const filteredCellIds = input.cellId
        ? cellIds.filter((id) => id === input.cellId)
        : cellIds;
      if (!filteredCellIds.length) {
        return { items: [], totalItems: 0 };
      }
      const from = civilDayBounds(input.from, DEFAULT_TIMEZONE).start;
      const to = civilDayBounds(input.to, DEFAULT_TIMEZONE).end;
      const meetingWhere: Record<string, unknown> = {
        churchId,
        cellId: { in: filteredCellIds },
        deletedAt: null,
        meetingDate: { gte: from, lte: to }
      };
      if (input.status) {
        meetingWhere.status = input.status;
      }
      const meetings = await transaction.meeting.findMany({
        where: meetingWhere,
        select: {
          id: true,
          cellId: true,
          meetingDate: true,
          status: true,
          cancellationReason: true,
          report: {
            select: { status: true }
          }
        },
        orderBy: { meetingDate: "desc" }
      });
      const meetingIds = meetings.map((m) => m.id);
      const eligibilityData = await this.loadMembershipData(transaction, churchId, filteredCellIds);
      const allAttendance = meetingIds.length
        ? await transaction.meetingAttendance.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true, attendanceStatus: true }
          })
        : [];
      const visitors = meetingIds.length
        ? await transaction.meetingVisitor.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true }
          })
        : [];
      const visitorSet = new Set(visitors.map((v) => `${v.meetingId}:${v.personId}`));
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: filteredCellIds } },
        select: { id: true, code: true, name: true }
      });
      const cellMap = new Map(cells.map((c) => [c.id, c]));
      const rows: MeetingsReportRow[] = meetings.map((meeting) => {
        const cell = cellMap.get(meeting.cellId);
        const eligible = this.computeEligible(meeting.meetingDate, meeting.cellId, eligibilityData);
        const presentCount = allAttendance.filter(
          (a) => a.meetingId === meeting.id && a.attendanceStatus === "PRESENT" && eligible.has(a.personId) && !visitorSet.has(`${a.meetingId}:${a.personId}`)
        ).length;
        const absentCount = allAttendance.filter(
          (a) => a.meetingId === meeting.id && a.attendanceStatus === "ABSENT" && eligible.has(a.personId)
        ).length;
        const visitorCount = visitors.filter((v) => v.meetingId === meeting.id).length;
        const attendanceRate = eligible.size > 0 ? roundPercentage(presentCount / eligible.size) : null;
        return {
          cell: cell ? { id: cell.id, code: cell.code, name: cell.name } : { id: meeting.cellId, code: "", name: "" },
          meetingDate: meeting.meetingDate.toISOString().slice(0, 10),
          status: meeting.status,
          cancellationReason: meeting.cancellationReason,
          presentCount,
          absentCount,
          visitorCount,
          attendanceRate,
          reportStatus: meeting.report?.status ?? null
        };
      });
      const totalItems = rows.length;
      const paged = rows.slice((page - 1) * pageSize, page * pageSize);
      this.logger.log(JSON.stringify({ operation: "reports.meetingsReport", result: "success", durationMs: Date.now() - startedAt, itemCount: paged.length }));
      return { items: paged, totalItems };
    }, { isolationLevel: "RepeatableRead" });
  }

  async exportCells(churchId: string, scope: ReportsScope): Promise<ExportRow[]> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.exportCells", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return [];
      }
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: cellIds } },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          meetingDay: true,
          meetingTime: true,
          address: true,
          createdAt: true,
          leaderId: true,
          traineeLeaderId: true
        }
      });
      const allUserIds = new Set<string>();
      for (const cell of cells) {
        if (cell.leaderId) allUserIds.add(cell.leaderId);
        if (cell.traineeLeaderId) allUserIds.add(cell.traineeLeaderId);
      }
      const users = allUserIds.size
        ? await transaction.user.findMany({
            where: { id: { in: [...allUserIds] }, churchId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true }
          })
        : [];
      const userMap = new Map(users.map((u) => [u.id, u]));
      const cellIdsArr = cells.map((c) => c.id);
      const membershipCounts = cellIdsArr.length
        ? await transaction.cellMembership.groupBy({
            by: ["cellId"],
            where: { churchId, cellId: { in: cellIdsArr }, status: "ACTIVE", deletedAt: null },
            _count: { id: true }
          })
        : [];
      const memberCountMap = new Map(membershipCounts.map((mc) => [mc.cellId, mc._count.id]));
      const assignments = await transaction.supervisorAssignment.findMany({
        where: { churchId, leaderId: { in: cells.map((c) => c.leaderId).filter((id): id is string => id !== null) }, deletedAt: null },
        select: { leaderId: true, supervisorId: true }
      });
      const supervisorByLeader = new Map(assignments.map((a) => [a.leaderId, a.supervisorId]));
      const supervisorIds = [...new Set(assignments.map((a) => a.supervisorId))];
      const supervisors = supervisorIds.length
        ? await transaction.user.findMany({
            where: { id: { in: supervisorIds }, churchId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true }
          })
        : [];
      const supervisorMap = new Map(supervisors.map((s) => [s.id, s]));
      const rows: ExportRow[] = cells.map((cell) => {
        const leader = cell.leaderId ? userMap.get(cell.leaderId) : undefined;
        const traineeLeader = cell.traineeLeaderId ? userMap.get(cell.traineeLeaderId) : undefined;
        const supervisorId = cell.leaderId ? supervisorByLeader.get(cell.leaderId) : undefined;
        const supervisor = supervisorId ? supervisorMap.get(supervisorId) : undefined;
        return {
          code: cell.code,
          name: cell.name,
          status: cell.status,
          leaderName: leader ? `${leader.firstName} ${leader.lastName}` : null,
          supervisorName: supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : null,
          traineeLeaderName: traineeLeader ? `${traineeLeader.firstName} ${traineeLeader.lastName}` : null,
          meetingDay: cell.meetingDay,
          meetingTime: cell.meetingTime.toISOString().slice(11, 16),
          address: cell.address,
          memberCount: memberCountMap.get(cell.id) ?? 0,
          createdAt: cell.createdAt.toISOString()
        };
      });
      this.logger.log(JSON.stringify({ operation: "reports.exportCells", result: "success", durationMs: Date.now() - startedAt, itemCount: rows.length }));
      return rows;
    }, { isolationLevel: "RepeatableRead" });
  }

  async exportPeople(churchId: string, scope: ReportsScope, status: string): Promise<ExportRow[]> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.exportPeople", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return [];
      }
      const activeMemberships = await transaction.cellMembership.findMany({
        where: { churchId, cellId: { in: cellIds }, deletedAt: null },
        select: { personId: true, cellId: true, status: true, joinedAt: true }
      });
      const filtered = status
        ? activeMemberships.filter((m) => m.status === status)
        : activeMemberships;
      const personIds = [...new Set(filtered.map((m) => m.personId))];
      if (!personIds.length) {
        return [];
      }
      const people = await transaction.person.findMany({
        where: { id: { in: personIds }, churchId, deletedAt: null },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          birthDate: true,
          gender: true,
          createdAt: true
        }
      });
      const cellIdsSet = [...new Set(filtered.map((m) => m.cellId))];
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: cellIdsSet } },
        select: { id: true, name: true }
      });
      const cellNameMap = new Map(cells.map((c) => [c.id, c.name]));
      const membershipByPerson = new Map<string, { cellId: string; status: string }>();
      for (const m of filtered) {
        if (!membershipByPerson.has(m.personId)) {
          membershipByPerson.set(m.personId, { cellId: m.cellId, status: m.status });
        }
      }
      const rows: ExportRow[] = [];
      for (const person of people) {
        const membership = membershipByPerson.get(person.id);
        const cellName = membership ? cellNameMap.get(membership.cellId) ?? "" : "";
        rows.push({
          fullName: person.fullName,
          phone: person.phone ?? null,
          email: person.email ?? null,
          birthDate: person.birthDate?.toISOString().slice(0, 10) ?? null,
          gender: person.gender ?? null,
          status: membership?.status ?? "",
          cellName,
          membershipStatus: membership?.status ?? "",
          createdAt: person.createdAt.toISOString()
        });
      }
      this.logger.log(JSON.stringify({ operation: "reports.exportPeople", result: "success", durationMs: Date.now() - startedAt, itemCount: rows.length }));
      return rows;
    }, { isolationLevel: "RepeatableRead" });
  }

  async exportAttendance(
    churchId: string,
    scope: ReportsScope,
    input: { from?: string; to?: string; cellId?: string }
  ): Promise<ExportRow[]> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.exportAttendance", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return [];
      }
      const filteredCellIds = input.cellId
        ? cellIds.filter((id) => id === input.cellId)
        : cellIds;
      if (!filteredCellIds.length) {
        return [];
      }
      const meetingWhere: Record<string, unknown> = {
        churchId,
        cellId: { in: filteredCellIds },
        deletedAt: null,
        status: "COMPLETED"
      };
      if (input.from) {
        const { start } = civilDayBounds(input.from, DEFAULT_TIMEZONE);
        meetingWhere.meetingDate = { gte: start };
      }
      if (input.to) {
        const { end } = civilDayBounds(input.to, DEFAULT_TIMEZONE);
        meetingWhere.meetingDate = { ...((meetingWhere.meetingDate as Record<string, unknown>) ?? {}), lte: end };
      }
      const meetings = await transaction.meeting.findMany({
        where: meetingWhere,
        select: { id: true, cellId: true, meetingDate: true }
      });
      const meetingIds = meetings.map((m) => m.id);
      const allAttendance = meetingIds.length
        ? await transaction.meetingAttendance.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true, attendanceStatus: true }
          })
        : [];
      const visitors = meetingIds.length
        ? await transaction.meetingVisitor.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true }
          })
        : [];
      const visitorSet = new Set(visitors.map((v) => `${v.meetingId}:${v.personId}`));
      const personIds = [...new Set(allAttendance.map((a) => a.personId))];
      const people = personIds.length
        ? await transaction.person.findMany({
            where: { id: { in: personIds }, churchId, deletedAt: null },
            select: { id: true, fullName: true }
          })
        : [];
      const personNameMap = new Map(people.map((p) => [p.id, p.fullName]));
      const cellIdsFromMeetings = [...new Set(meetings.map((m) => m.cellId))];
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: cellIdsFromMeetings } },
        select: { id: true, code: true, name: true }
      });
      const cellMap = new Map(cells.map((c) => [c.id, c]));
      const meetingMap = new Map(meetings.map((m) => [m.id, m]));
      const rows: ExportRow[] = allAttendance.map((a) => {
        const meeting = meetingMap.get(a.meetingId);
        const cell = meeting ? cellMap.get(meeting.cellId) : undefined;
        const isVisitor = visitorSet.has(`${a.meetingId}:${a.personId}`);
        return {
          cellName: cell?.name ?? "",
          cellCode: cell?.code ?? "",
          meetingDate: meeting?.meetingDate.toISOString().slice(0, 10) ?? "",
          personName: personNameMap.get(a.personId) ?? "",
          attendanceStatus: a.attendanceStatus,
          isVisitor
        };
      });
      this.logger.log(JSON.stringify({ operation: "reports.exportAttendance", result: "success", durationMs: Date.now() - startedAt, itemCount: rows.length }));
      return rows;
    }, { isolationLevel: "RepeatableRead" });
  }

  async exportMeetings(
    churchId: string,
    scope: ReportsScope,
    input: { from?: string; to?: string; cellId?: string }
  ): Promise<ExportRow[]> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) {
        this.logger.log(JSON.stringify({ operation: "reports.exportMeetings", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return [];
      }
      const filteredCellIds = input.cellId
        ? cellIds.filter((id) => id === input.cellId)
        : cellIds;
      if (!filteredCellIds.length) {
        return [];
      }
      const meetingWhere: Record<string, unknown> = {
        churchId,
        cellId: { in: filteredCellIds },
        deletedAt: null
      };
      if (input.from) {
        const { start } = civilDayBounds(input.from, DEFAULT_TIMEZONE);
        meetingWhere.meetingDate = { gte: start };
      }
      if (input.to) {
        const { end } = civilDayBounds(input.to, DEFAULT_TIMEZONE);
        meetingWhere.meetingDate = { ...((meetingWhere.meetingDate as Record<string, unknown>) ?? {}), lte: end };
      }
      const meetings = await transaction.meeting.findMany({
        where: meetingWhere,
        select: {
          id: true,
          cellId: true,
          meetingDate: true,
          status: true,
          cancellationReason: true,
          report: { select: { status: true } }
        }
      });
      const meetingIds = meetings.map((m) => m.id);
      const eligibilityData = await this.loadMembershipData(transaction, churchId, filteredCellIds);
      const allAttendance = meetingIds.length
        ? await transaction.meetingAttendance.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true, attendanceStatus: true }
          })
        : [];
      const visitors = meetingIds.length
        ? await transaction.meetingVisitor.findMany({
            where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
            select: { meetingId: true, personId: true }
          })
        : [];
      const visitorSet = new Set(visitors.map((v) => `${v.meetingId}:${v.personId}`));
      const cellIdsFromMeetings = [...new Set(meetings.map((m) => m.cellId))];
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: cellIdsFromMeetings } },
        select: { id: true, code: true, name: true }
      });
      const cellMap = new Map(cells.map((c) => [c.id, c]));
      const rows: ExportRow[] = meetings.map((meeting) => {
        const cell = cellMap.get(meeting.cellId);
        const eligible = meeting.status === "COMPLETED"
          ? this.computeEligible(meeting.meetingDate, meeting.cellId, eligibilityData)
          : new Set<string>();
        const presentCount = allAttendance.filter(
          (a) => a.meetingId === meeting.id && a.attendanceStatus === "PRESENT" && eligible.has(a.personId) && !visitorSet.has(`${a.meetingId}:${a.personId}`)
        ).length;
        const absentCount = allAttendance.filter(
          (a) => a.meetingId === meeting.id && a.attendanceStatus === "ABSENT" && eligible.has(a.personId)
        ).length;
        const visitorCount = visitors.filter((v) => v.meetingId === meeting.id).length;
        const attendanceRate = eligible.size > 0 ? roundPercentage(presentCount / eligible.size) : null;
        return {
          cellName: cell?.name ?? "",
          cellCode: cell?.code ?? "",
          meetingDate: meeting.meetingDate.toISOString().slice(0, 10),
          status: meeting.status,
          cancellationReason: meeting.cancellationReason ?? null,
          presentCount,
          absentCount,
          visitorCount,
          attendanceRate,
          reportStatus: meeting.report?.status ?? null
        };
      });
      this.logger.log(JSON.stringify({ operation: "reports.exportMeetings", result: "success", durationMs: Date.now() - startedAt, itemCount: rows.length }));
      return rows;
    }, { isolationLevel: "RepeatableRead" });
  }

  async recordExport(input: { churchId: string; exportedBy: string; reportType: string; format: string; scope: Record<string, unknown>; rowCount: number }): Promise<void> {
    await this.database.reportExport.create({
      data: {
        churchId: input.churchId,
        exportedBy: input.exportedBy,
        reportType: input.reportType,
        format: input.format,
        scope: input.scope as unknown as Record<string, string>,
        rowCount: input.rowCount
      }
    });
  }

  async assertCellInScope(churchId: string, scope: ReportsScope, cellId: string): Promise<{ id: string; code: string; name: string }> {
    const cell = await this.database.cell.findFirst({
      where: { id: cellId, churchId, deletedAt: null },
      select: { id: true, code: true, name: true }
    });
    if (!cell) {
      throw new ReportsError("REPORT_CELL_NOT_FOUND", "Cell not found");
    }
    const cellIds = await this.database.$transaction(async (transaction) => {
      return this.resolveScopeCellIds(transaction, churchId, scope);
    }, { isolationLevel: "RepeatableRead" });
    if (!cellIds.includes(cellId)) {
      throw new ReportsError("REPORT_CELL_NOT_FOUND", "Cell not in scope");
    }
    return cell;
  }

  private async resolveScopeCellIds(
    transaction: TransactionClient,
    churchId: string,
    scope: ReportsScope
  ): Promise<string[]> {
    if (scope.kind === "church") {
      const rows = await transaction.cell.findMany({ where: { churchId, deletedAt: null }, select: { id: true } });
      return rows.map((row) => row.id);
    }
    if (scope.kind === "supervisor") {
      const assignments = await transaction.supervisorAssignment.findMany({
        where: { churchId, supervisorId: scope.userId, deletedAt: null },
        select: { leaderId: true }
      });
      const leaderIds = assignments.map((assignment) => assignment.leaderId);
      if (!leaderIds.length) return [];
      const rows = await transaction.cell.findMany({ where: { churchId, deletedAt: null, leaderId: { in: leaderIds } }, select: { id: true } });
      return rows.map((row) => row.id);
    }
    const rows = await transaction.cell.findMany({
      where: { churchId, deletedAt: null, OR: [{ leaderId: scope.userId }, { traineeLeaderId: scope.userId }] },
      select: { id: true }
    });
    return rows.map((row) => row.id);
  }

  private computeEligible(
    meetingDate: Date,
    cellId: string,
    data: EligibilityData
  ): Set<string> {
    const civil = meetingDate.toISOString().slice(0, 10);
    const { start, end } = civilDayBounds(civil, DEFAULT_TIMEZONE);
    const eligible = new Set<string>();
    for (const membership of data.memberships) {
      if (membership.cellId !== cellId) continue;
      if (membership.joinedAt >= end) continue;
      if (membership.leftAt !== null && membership.leftAt < start) continue;
      if (membership.deletedAt !== null && membership.deletedAt < start) continue;
      const personDeletedAt = data.personDeletedBy.get(membership.personId);
      if (personDeletedAt !== undefined && personDeletedAt !== null && personDeletedAt < start) continue;
      eligible.add(membership.personId);
    }
    return eligible;
  }

  private async loadMembershipData(
    transaction: TransactionClient,
    churchId: string,
    cellIds: string[]
  ): Promise<EligibilityData> {
    if (!cellIds.length) return EMPTY_ELIGIBILITY;
    const memberships = (await transaction.cellMembership.findMany({
      where: { churchId, cellId: { in: cellIds } },
      select: { cellId: true, personId: true, joinedAt: true, leftAt: true, deletedAt: true }
    })) as MembershipRow[];
    const personIds = [...new Set(memberships.map((membership) => membership.personId))];
    const personDeletedBy = new Map<string, Date | null>();
    if (personIds.length) {
      const people = await transaction.person.findMany({
        where: { id: { in: personIds }, churchId },
        select: { id: true, deletedAt: true }
      });
      for (const person of people) personDeletedBy.set(person.id, person.deletedAt);
    }
    return { memberships, personDeletedBy };
  }
}

function roundPercentage(ratio: number): number {
  return Math.round(ratio * 10_000) / 100;
}

function computeHealthBand(rate: number | null): "healthy" | "attention" | "critical" | null {
  if (rate === null) return null;
  if (rate >= 80) return "healthy";
  if (rate > 50) return "attention";
  return "critical";
}

function normalizeReportStatus(status: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "RETURNED" | "CANCELED" | undefined | null): "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "RETURNED" {
  if (status === "CANCELED" || status === undefined || status === null) return "NOT_STARTED";
  return status;
}

type TransactionClient = Parameters<Parameters<RuntimeDatabaseClient["$transaction"]>[0]>[0];
