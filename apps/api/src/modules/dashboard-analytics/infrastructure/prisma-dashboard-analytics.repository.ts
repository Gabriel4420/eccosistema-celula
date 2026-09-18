import { Inject, Injectable, Logger } from "@nestjs/common";
import { resolveCellScopeIds } from "@mission-atos/database";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { civilDayBounds } from "../application/dashboard-analytics.time";
import type {
  AttendanceAggregate,
  CellSummaryRow,
  CellsSummaryQueryInput,
  DashboardListScope,
  MeetingCounts,
  MonthlyPoint,
  TotalsCounts
} from "../application/dashboard-analytics.types";
import type { DashboardAnalyticsRepository } from "../application/dashboard-analytics.port";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

interface CompletedMeeting {
  id: string;
  cellId: string;
  meetingDate: Date;
  month: string;
}

interface MembershipRow {
  cellId: string;
  personId: string;
  joinedAt: Date;
  leftAt: Date | null;
  deletedAt: Date | null;
}

@Injectable()
export class PrismaDashboardAnalyticsRepository implements DashboardAnalyticsRepository {
  private readonly logger = new Logger(PrismaDashboardAnalyticsRepository.name);

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

  async totals(churchId: string, scope: DashboardListScope): Promise<TotalsCounts> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const people = await transaction.person.count({ where: { churchId, deletedAt: null } });
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      let activeCells = 0;
      let formingCells = 0;
      let members = 0;
      if (cellIds.length) {
        const [cells, activeMemberships] = await Promise.all([
          transaction.cell.findMany({
            where: { churchId, deletedAt: null, id: { in: cellIds } },
            select: { status: true }
          }),
          transaction.cellMembership.count({
            where: { churchId, cellId: { in: cellIds }, status: "ACTIVE", deletedAt: null }
          })
        ]);
        activeCells = cells.filter((cell) => cell.status === "ACTIVE").length;
        formingCells = cells.filter((cell) => cell.status === "FORMING").length;
        members = activeMemberships;
      }
      this.logger.log(JSON.stringify({ operation: "dashboard.totals", result: "success", durationMs: Date.now() - startedAt }));
      return { people, activeCells, formingCells, members };
    }, { isolationLevel: "RepeatableRead" });
  }

  async meetingCounts(churchId: string, scope: DashboardListScope, from: string, to: string): Promise<MeetingCounts> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) return { total: 0, completed: 0 };
      const where = { churchId, cellId: { in: cellIds }, deletedAt: null, meetingDate: { gte: dateAt(from), lte: dateAt(to) } };
      const [total, completed] = await Promise.all([
        transaction.meeting.count({ where }),
        transaction.meeting.count({ where: { ...where, status: "COMPLETED" } })
      ]);
      this.logger.log(JSON.stringify({ operation: "dashboard.meetingCounts", result: "success", durationMs: Date.now() - startedAt }));
      return { total, completed };
    }, { isolationLevel: "RepeatableRead" });
  }

  async attendance(churchId: string, scope: DashboardListScope, from: string, to: string): Promise<AttendanceAggregate> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const timezone = await this.churchTimezone(transaction, churchId);
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) return { presentSum: 0, eligibleSum: 0, totalPresentSum: 0, completedCount: 0, visitorCount: 0 };
      const meetings = await this.loadCompletedMeetings(transaction, churchId, cellIds, from, to);
      const { presentByMonth, visitorByMonth, eligibleByMonth } = await this.computeCompletedMetrics(transaction, churchId, cellIds, meetings, timezone);
      const presentSum = sum(presentByMonth.values());
      const eligibleSum = sum(eligibleByMonth.values());
      const visitorCount = sum(visitorByMonth.values());
      this.logger.log(JSON.stringify({ operation: "dashboard.attendance", result: "success", durationMs: Date.now() - startedAt }));
      return { presentSum, eligibleSum, totalPresentSum: presentSum + visitorCount, completedCount: meetings.length, visitorCount };
    }, { isolationLevel: "RepeatableRead" });
  }

  async monthlySeries(churchId: string, scope: DashboardListScope, from: string, to: string): Promise<MonthlyPoint[]> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const timezone = await this.churchTimezone(transaction, churchId);
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) return [];
      const meetings = await transaction.meeting.findMany({
        where: { churchId, cellId: { in: cellIds }, deletedAt: null, meetingDate: { gte: dateAt(from), lte: dateAt(to) } },
        select: { id: true, cellId: true, meetingDate: true, status: true }
      });
      const byMonth = new Map<string, { meetings: number; completed: number }>();
      for (const meeting of meetings) {
        const month = monthOf(meeting.meetingDate);
        const entry = byMonth.get(month) ?? { meetings: 0, completed: 0 };
        entry.meetings += 1;
        if (meeting.status === "COMPLETED") entry.completed += 1;
        byMonth.set(month, entry);
      }
      const completedMeetings = meetings
        .filter((meeting) => meeting.status === "COMPLETED")
        .map((meeting) => ({ id: meeting.id, cellId: meeting.cellId, meetingDate: meeting.meetingDate, month: monthOf(meeting.meetingDate) }));
      const { presentByMonth, visitorByMonth } = await this.computeCompletedMetrics(transaction, churchId, cellIds, completedMeetings, timezone);
      const points: MonthlyPoint[] = [];
      for (const [month, entry] of byMonth) {
        points.push({ month, meetings: entry.meetings, completed: entry.completed, presentMembers: presentByMonth.get(month) ?? 0, visitors: visitorByMonth.get(month) ?? 0 });
      }
      points.sort((a, b) => a.month < b.month ? -1 : 1);
      this.logger.log(JSON.stringify({ operation: "dashboard.series", result: "success", durationMs: Date.now() - startedAt }));
      return points;
    }, { isolationLevel: "RepeatableRead" });
  }

  async cellSummaries(churchId: string, scope: DashboardListScope, input: CellsSummaryQueryInput): Promise<CellSummaryRow[]> {
    const startedAt = Date.now();
    return this.database.$transaction(async (transaction) => {
      const cellIds = await this.resolveScopeCellIds(transaction, churchId, scope);
      if (!cellIds.length) return [];
      const cells = await transaction.cell.findMany({
        where: { churchId, deletedAt: null, id: { in: cellIds }, ...(input.status ? { status: input.status } : {}) },
        select: { id: true, code: true, name: true, status: true }
      });
      if (!cells.length) return [];
      const [completedMeetings, activeMemberships] = await Promise.all([
        transaction.meeting.findMany({
          where: { churchId, cellId: { in: cells.map((cell) => cell.id) }, deletedAt: null, status: "COMPLETED" },
          select: { cellId: true, meetingDate: true }
        }),
        transaction.cellMembership.findMany({
          where: { churchId, cellId: { in: cells.map((cell) => cell.id) }, status: "ACTIVE", deletedAt: null },
          select: { cellId: true }
        })
      ]);
      const lastByCell = new Map<string, string>();
      for (const meeting of completedMeetings) {
        const civil = meeting.meetingDate.toISOString().slice(0, 10);
        const previous = lastByCell.get(meeting.cellId);
        if (!previous || civil > previous) lastByCell.set(meeting.cellId, civil);
      }
      const membersByCell = new Map<string, number>();
      for (const membership of activeMemberships) {
        membersByCell.set(membership.cellId, (membersByCell.get(membership.cellId) ?? 0) + 1);
      }
      const rows: CellSummaryRow[] = cells.map((cell) => ({
        id: cell.id,
        code: cell.code,
        name: cell.name,
        status: cell.status,
        lastCompletedAt: lastByCell.get(cell.id) ?? null,
        membersCount: membersByCell.get(cell.id) ?? 0
      }));
      this.logger.log(JSON.stringify({ operation: "dashboard.cellSummaries", result: "success", durationMs: Date.now() - startedAt, itemCount: rows.length }));
      return rows;
    }, { isolationLevel: "RepeatableRead" });
  }

  private async loadCompletedMeetings(
    transaction: TransactionClient,
    churchId: string,
    cellIds: string[],
    from: string,
    to: string
  ): Promise<CompletedMeeting[]> {
    const meetings = await transaction.meeting.findMany({
      where: { churchId, cellId: { in: cellIds }, deletedAt: null, status: "COMPLETED", meetingDate: { gte: dateAt(from), lte: dateAt(to) } },
      select: { id: true, cellId: true, meetingDate: true }
    });
    return meetings.map((meeting) => ({ id: meeting.id, cellId: meeting.cellId, meetingDate: meeting.meetingDate, month: monthOf(meeting.meetingDate) }));
  }

  private async computeCompletedMetrics(
    transaction: TransactionClient,
    churchId: string,
    cellIds: string[],
    meetings: CompletedMeeting[],
    timezone: string
  ): Promise<{ presentByMonth: Map<string, number>; visitorByMonth: Map<string, number>; eligibleByMonth: Map<string, number> }> {
    const empty = { presentByMonth: new Map<string, number>(), visitorByMonth: new Map<string, number>(), eligibleByMonth: new Map<string, number>() };
    if (!meetings.length) return empty;
    const meetingIds = meetings.map((meeting) => meeting.id);
    const [presentMarks, visitors] = await Promise.all([
      transaction.meetingAttendance.findMany({
        where: { churchId, meetingId: { in: meetingIds }, deletedAt: null, attendanceStatus: "PRESENT" },
        select: { meetingId: true, personId: true }
      }),
      transaction.meetingVisitor.findMany({
        where: { churchId, meetingId: { in: meetingIds }, deletedAt: null },
        select: { meetingId: true, personId: true }
      })
    ]);
    const visitorPersons = new Set(visitors.map((visitor) => visitor.personId));
    const eligibleByMeeting = await this.eligibleByMeeting(transaction, churchId, cellIds, meetings, timezone);
    const presentByMonth = new Map<string, number>();
    const visitorByMonth = new Map<string, number>();
    const eligibleByMonth = new Map<string, number>();
    for (const meeting of meetings) {
      const eligible = eligibleByMeeting.get(meeting.id) ?? new Set<string>();
      let present = 0;
      for (const mark of presentMarks) {
        if (mark.meetingId === meeting.id && eligible.has(mark.personId) && !visitorPersons.has(mark.personId)) present += 1;
      }
      const visitorsCount = visitors.filter((visitor) => visitor.meetingId === meeting.id).length;
      presentByMonth.set(meeting.month, (presentByMonth.get(meeting.month) ?? 0) + present);
      visitorByMonth.set(meeting.month, (visitorByMonth.get(meeting.month) ?? 0) + visitorsCount);
      eligibleByMonth.set(meeting.month, (eligibleByMonth.get(meeting.month) ?? 0) + eligible.size);
    }
    return { presentByMonth, visitorByMonth, eligibleByMonth };
  }

  private async eligibleByMeeting(
    transaction: TransactionClient,
    churchId: string,
    cellIds: string[],
    meetings: CompletedMeeting[],
    timezone: string
  ): Promise<Map<string, Set<string>>> {
    const data = await this.eligibleData(transaction, churchId, cellIds);
    const result = new Map<string, Set<string>>();
    for (const meeting of meetings) {
      result.set(meeting.id, eligibleFor(meeting.cellId, meeting.meetingDate, data, timezone));
    }
    return result;
  }

  private async eligibleData(
    transaction: TransactionClient,
    churchId: string,
    cellIds: string[]
  ): Promise<{ memberships: MembershipRow[]; personDeletedBy: Map<string, Date | null> }> {
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

  private async churchTimezone(transaction: TransactionClient, churchId: string): Promise<string> {
    const church = await transaction.church.findFirst({ where: { id: churchId }, select: { timezone: true } });
    return church?.timezone ?? DEFAULT_TIMEZONE;
  }

  private resolveScopeCellIds(
    transaction: TransactionClient,
    churchId: string,
    scope: DashboardListScope
  ): Promise<string[]> {
    return resolveCellScopeIds(transaction, churchId, scope);
  }
}

function eligibleFor(
  cellId: string,
  meetingDate: Date,
  data: { memberships: MembershipRow[]; personDeletedBy: Map<string, Date | null> },
  timezone: string
): Set<string> {
  const civil = meetingDate.toISOString().slice(0, 10);
  const { start, end } = civilDayBounds(civil, timezone);
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

function monthOf(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function dateAt(civil: string): Date {
  return new Date(`${civil}T00:00:00.000Z`);
}

function sum(values: Iterable<number>): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

type TransactionClient = Parameters<Parameters<RuntimeDatabaseClient["$transaction"]>[0]>[0];
