import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { attendanceSnapshotSchema } from "@mission-atos/contracts";
import type { AttendanceSnapshot, CreateMeetingVisitorRequest, SaveAttendanceRequest } from "@mission-atos/contracts";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { calculateAttendanceSummary, canEditAttendance } from "@mission-atos/domain";
import type { AttendanceDisplayStatus, AuthenticatedPrincipal } from "@mission-atos/domain";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { AttendancePolicy } from "../domain/attendance.policy";
import { AttendanceError } from "./attendance.error";

const VISITOR_OPERATION = "attendance:visitor:create";
type AttendanceDb = Pick<RuntimeDatabaseClient,
  "meeting" | "meetingAttendance" | "meetingVisitor" | "person" |
  "cellMembership" | "supervisorAssignment" | "auditLog" | "idempotencyRequest">;

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient,
    @Inject(AttendancePolicy) private readonly policy: AttendancePolicy
  ) {}

  async get(principal: AuthenticatedPrincipal, cellId: string, meetingId: string): Promise<AttendanceSnapshot> {
    const context = await this.loadContext(this.database, principal, cellId, meetingId, false);
    return this.buildSnapshot(this.database, principal, context);
  }

  async save(principal: AuthenticatedPrincipal, cellId: string, meetingId: string, input: SaveAttendanceRequest): Promise<AttendanceSnapshot> {
    try {
      await this.database.$transaction(async (transaction) => {
        const context = await this.loadContext(transaction, principal, cellId, meetingId, true);
        this.assertEditable(context.status);
        const eligible = await this.listEligible(transaction, context);
        const eligibleIds = new Set(eligible.map((item) => item.id));
        for (const item of input.attendance) if (!eligibleIds.has(item.personId)) throw new AttendanceError("PERSON_NOT_ELIGIBLE", "Person is not eligible for this meeting");
        const visitors = await transaction.meetingVisitor.findMany({ where: { churchId: principal.churchId, meetingId, deletedAt: null }, select: { personId: true } });
        const visitorIds = new Set(visitors.map((item) => item.personId));
        const existing = await transaction.meetingAttendance.findMany({ where: { churchId: principal.churchId, meetingId, personId: { in: [...eligibleIds] } }, select: { personId: true, attendanceStatus: true, deletedAt: true } });
        const desired = new Map(input.attendance.map((item) => [item.personId, item.status]));
        const current = new Map(existing.filter((item) => item.deletedAt === null && !visitorIds.has(item.personId)).map((item) => [item.personId, item.attendanceStatus]));
        if (sameMap(current, desired)) return;
        const acquired = await transaction.meeting.updateMany({ where: { id: meetingId, churchId: principal.churchId, attendanceRevision: input.expectedRevision }, data: { attendanceRevision: { increment: 1 } } });
        if (acquired.count !== 1) {
          const refreshed = await transaction.meetingAttendance.findMany({ where: { churchId: principal.churchId, meetingId, deletedAt: null, personId: { in: [...eligibleIds] } }, select: { personId: true, attendanceStatus: true } });
          const canonical = new Map(refreshed.filter((item) => !visitorIds.has(item.personId)).map((item) => [item.personId, item.attendanceStatus]));
          if (sameMap(canonical, desired)) return;
          throw new AttendanceError("ATTENDANCE_REVISION_CONFLICT", "Attendance was changed by another request");
        }
        const changedPeople: Array<{ personId: string; before: string; after: string }> = [];
        for (const personId of eligibleIds) {
          const next = desired.get(personId);
          const before = current.get(personId) ?? "UNMARKED";
          if (next) {
            await transaction.meetingAttendance.upsert({
              where: { churchId_meetingId_personId: { churchId: principal.churchId, meetingId, personId } },
              create: { churchId: principal.churchId, meetingId, personId, attendanceStatus: next },
              update: { attendanceStatus: next, deletedAt: null }
            });
            if (before !== next) changedPeople.push({ personId, before, after: next });
          } else if (before !== "UNMARKED") {
            await transaction.meetingAttendance.update({ where: { churchId_meetingId_personId: { churchId: principal.churchId, meetingId, personId } }, data: { deletedAt: new Date() } });
            changedPeople.push({ personId, before, after: "UNMARKED" });
          }
        }
        await transaction.auditLog.create({ data: { churchId: principal.churchId, userId: principal.userId, entity: "Meeting", entityId: meetingId, action: "MEETING_ATTENDANCE_UPDATED", after: auditPayload(changedPeople) as never } });
      }, { isolationLevel: "Serializable" });
    } catch (cause) {
      if (!isSerializationConflict(cause)) throw cause;
      const snapshot = await this.get(principal, cellId, meetingId);
      const current = new Map(snapshot.participants.filter((item) => item.status !== "UNMARKED").map((item) => [item.personId, item.status]));
      const desired = new Map(input.attendance.map((item) => [item.personId, item.status]));
      if (sameMap(current, desired)) return snapshot;
      throw new AttendanceError("ATTENDANCE_REVISION_CONFLICT", "Attendance was changed by another request");
    }
    return this.get(principal, cellId, meetingId);
  }

  async addVisitor(principal: AuthenticatedPrincipal, cellId: string, meetingId: string, key: string, input: CreateMeetingVisitorRequest): Promise<AttendanceSnapshot> {
    return this.database.$transaction(async (transaction) => {
      const context = await this.loadContext(transaction, principal, cellId, meetingId, true);
      this.assertEditable(context.status);
      const requestHash = createHash("sha256").update(JSON.stringify({ cellId, meetingId, input })).digest("hex");
      const replay = await transaction.idempotencyRequest.findFirst({ where: { churchId: principal.churchId, actorId: principal.userId, operation: VISITOR_OPERATION, key }, select: { requestHash: true, result: true } });
      if (replay) {
        if (replay.requestHash !== requestHash) throw new AttendanceError("IDEMPOTENCY_KEY_CONFLICT", "Idempotency key reused with another payload");
        return attendanceSnapshotSchema.parse(replay.result);
      }
      let personId: string;
      let source: "existing_person" | "quick_create";
      if (input.kind === "existing") { personId = input.personId; source = "existing_person"; }
      else {
        const normalizedPhone = input.phone?.replace(/\D/g, "") || null;
        const duplicate = await transaction.person.findFirst({ where: { churchId: principal.churchId, deletedAt: null, OR: [...(normalizedPhone ? [{ phone: normalizedPhone }] : []), { fullName: { equals: input.name, mode: "insensitive" } }] }, select: { id: true } });
        if (duplicate) personId = duplicate.id;
        else personId = (await transaction.person.create({ data: { churchId: principal.churchId, fullName: input.name, phone: normalizedPhone } , select: { id: true } })).id;
        source = "quick_create";
      }
      const person = await transaction.person.findFirst({ where: { id: personId, churchId: principal.churchId, OR: [{ deletedAt: null }, { deletedAt: { gte: context.dayStart } }] }, select: { id: true } });
      if (!person) throw new AttendanceError("ATTENDANCE_PERSON_NOT_FOUND", "Person not found");
      if (await this.isEligible(transaction, context, personId)) throw new AttendanceError("VISITOR_ALREADY_ELIGIBLE", "Eligible participant cannot be registered as visitor");
      const invitedByPersonId = input.invitedByPersonId ?? null;
      if (invitedByPersonId) {
        const inviter = await transaction.person.findFirst({ where: { id: invitedByPersonId, churchId: principal.churchId, OR: [{ deletedAt: null }, { deletedAt: { gte: context.dayStart } }] }, select: { id: true } });
        if (!inviter) throw new AttendanceError("ATTENDANCE_PERSON_NOT_FOUND", "Inviter not found");
      }
      const observation = input.observation ?? null;
      const [activeVisitor, activeAttendance] = await Promise.all([
        transaction.meetingVisitor.findFirst({ where: { churchId: principal.churchId, meetingId, personId, deletedAt: null }, select: { invitedByPersonId: true, observation: true } }),
        transaction.meetingAttendance.findFirst({ where: { churchId: principal.churchId, meetingId, personId, deletedAt: null }, select: { attendanceStatus: true } })
      ]);
      const isNoOp = activeVisitor?.invitedByPersonId === invitedByPersonId
        && activeVisitor.observation === observation
        && activeAttendance?.attendanceStatus === "PRESENT";
      if (isNoOp) {
        const snapshot = await this.buildSnapshot(transaction, principal, context);
        await transaction.idempotencyRequest.create({ data: { churchId: principal.churchId, actorId: principal.userId, operation: VISITOR_OPERATION, key, requestHash, resourceId: meetingId, result: snapshot as never, expiresAt: new Date(Date.now() + 86_400_000) } });
        return snapshot;
      }
      await transaction.meeting.update({ where: { id_churchId: { id: meetingId, churchId: principal.churchId } }, data: { attendanceRevision: { increment: 1 } } });
      await transaction.meetingAttendance.upsert({ where: { churchId_meetingId_personId: { churchId: principal.churchId, meetingId, personId } }, create: { churchId: principal.churchId, meetingId, personId, attendanceStatus: "PRESENT" }, update: { attendanceStatus: "PRESENT", deletedAt: null } });
      await transaction.meetingVisitor.upsert({ where: { churchId_meetingId_personId: { churchId: principal.churchId, meetingId, personId } }, create: { churchId: principal.churchId, meetingId, personId, invitedByPersonId, observation }, update: { invitedByPersonId, observation, deletedAt: null } });
      await transaction.auditLog.create({ data: { churchId: principal.churchId, userId: principal.userId, entity: "MeetingVisitor", entityId: meetingId, action: "MEETING_VISITOR_ADDED", after: { personId, source } } });
      const refreshedContext = await this.loadContext(transaction, principal, cellId, meetingId, true);
      const snapshot = await this.buildSnapshot(transaction, principal, refreshedContext);
      await transaction.idempotencyRequest.create({ data: { churchId: principal.churchId, actorId: principal.userId, operation: VISITOR_OPERATION, key, requestHash, resourceId: meetingId, result: snapshot as never, expiresAt: new Date(Date.now() + 86_400_000) } });
      return snapshot;
    }, { isolationLevel: "Serializable" });
  }

  async removeVisitor(principal: AuthenticatedPrincipal, cellId: string, meetingId: string, personId: string): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const context = await this.loadContext(transaction, principal, cellId, meetingId, true);
      this.assertEditable(context.status);
      const visitor = await transaction.meetingVisitor.findFirst({ where: { churchId: principal.churchId, meetingId, personId, deletedAt: null }, select: { id: true } });
      if (!visitor) return;
      const now = new Date();
      await transaction.meeting.update({ where: { id_churchId: { id: meetingId, churchId: principal.churchId } }, data: { attendanceRevision: { increment: 1 } } });
      await transaction.meetingVisitor.update({ where: { id: visitor.id }, data: { deletedAt: now } });
      await transaction.meetingAttendance.update({ where: { churchId_meetingId_personId: { churchId: principal.churchId, meetingId, personId } }, data: { deletedAt: now } });
      await transaction.auditLog.create({ data: { churchId: principal.churchId, userId: principal.userId, entity: "MeetingVisitor", entityId: meetingId, action: "MEETING_VISITOR_REMOVED", after: { personId } } });
    }, { isolationLevel: "Serializable" });
  }

  private async loadContext(client: AttendanceDb, principal: AuthenticatedPrincipal, cellId: string, meetingId: string, edit: boolean) {
    const meeting = await client.meeting.findFirst({ where: { id: meetingId, cellId, churchId: principal.churchId, deletedAt: null, cell: { deletedAt: null } }, select: { id: true, churchId: true, cellId: true, meetingDate: true, status: true, attendanceRevision: true, cell: { select: { name: true, leaderId: true, traineeLeaderId: true } }, church: { select: { timezone: true } } } });
    if (!meeting) throw new AttendanceError("ATTENDANCE_MEETING_NOT_FOUND", "Meeting not found");
    const assignments = meeting.cell.leaderId ? await client.supervisorAssignment.findMany({ where: { churchId: principal.churchId, leaderId: meeting.cell.leaderId, deletedAt: null }, select: { supervisorId: true } }) : [];
    const scope = { leaderId: meeting.cell.leaderId, traineeLeaderId: meeting.cell.traineeLeaderId, supervisorIds: assignments.map((item) => item.supervisorId) };
    const allowed = edit ? this.policy.canEdit(principal, scope) : this.policy.canView(principal, scope);
    if (!allowed) throw new AttendanceError("ATTENDANCE_ACCESS_DENIED", "Access is not allowed");
    const meetingDate = formatDateOnly(meeting.meetingDate);
    const { start, end } = civilDayBounds(meetingDate, meeting.church.timezone);
    return { ...meeting, meetingDate, dayStart: start, dayEnd: end };
  }

  private listEligible(client: AttendanceDb, context: Awaited<ReturnType<AttendanceService["loadContext"]>>) {
    return client.person.findMany({ where: { churchId: context.churchId, OR: [{ deletedAt: null }, { deletedAt: { gte: context.dayStart } }], memberships: { some: { churchId: context.churchId, cellId: context.cellId, joinedAt: { lt: context.dayEnd }, OR: [{ leftAt: null }, { leftAt: { gte: context.dayStart } }], AND: [{ OR: [{ deletedAt: null }, { deletedAt: { gte: context.dayStart } }] }] } } }, select: { id: true, fullName: true }, orderBy: [{ fullName: "asc" }, { id: "asc" }] });
  }

  private async isEligible(client: AttendanceDb, context: Awaited<ReturnType<AttendanceService["loadContext"]>>, personId: string): Promise<boolean> {
    return (await client.cellMembership.count({ where: { churchId: context.churchId, cellId: context.cellId, personId, joinedAt: { lt: context.dayEnd }, OR: [{ leftAt: null }, { leftAt: { gte: context.dayStart } }], AND: [{ OR: [{ deletedAt: null }, { deletedAt: { gte: context.dayStart } }] }] } })) > 0;
  }

  private async buildSnapshot(client: AttendanceDb, principal: AuthenticatedPrincipal, context: Awaited<ReturnType<AttendanceService["loadContext"]>>): Promise<AttendanceSnapshot> {
    const participants = await this.listEligible(client, context);
    const marks = await client.meetingAttendance.findMany({ where: { churchId: principal.churchId, meetingId: context.id, deletedAt: null, personId: { in: participants.map((item) => item.id) } }, select: { personId: true, attendanceStatus: true } });
    const markByPerson = new Map(marks.map((item) => [item.personId, item.attendanceStatus]));
    const visitors = await client.meetingVisitor.findMany({ where: { churchId: principal.churchId, meetingId: context.id, deletedAt: null }, select: { personId: true, invitedByPersonId: true, observation: true, person: { select: { fullName: true, phone: true } } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const displayParticipants = participants.map((person) => ({ personId: person.id, fullName: person.fullName, status: (markByPerson.get(person.id) ?? "UNMARKED") as AttendanceDisplayStatus }));
    const canEdit = canEditAttendance(context.status) && this.policy.canEdit(principal, { leaderId: context.cell.leaderId, traineeLeaderId: context.cell.traineeLeaderId, supervisorIds: [] });
    return { meeting: { id: context.id, cellId: context.cellId, cellName: context.cell.name, meetingDate: context.meetingDate, status: context.status }, revision: context.attendanceRevision, isReadOnly: !canEditAttendance(context.status), canEdit, participants: displayParticipants, visitors: visitors.map((visitor) => ({ personId: visitor.personId, fullName: visitor.person.fullName, invitedByPersonId: visitor.invitedByPersonId, observation: visitor.observation, contactPending: !visitor.person.phone })), summary: calculateAttendanceSummary(displayParticipants.map((item) => item.status), visitors.length, context.status) };
  }

  private assertEditable(status: "SCHEDULED" | "COMPLETED" | "CANCELED"): void { if (!canEditAttendance(status)) throw new AttendanceError("MEETING_ATTENDANCE_NOT_EDITABLE", "Canceled meeting attendance is read only"); }
}

function sameMap(left: ReadonlyMap<string, string>, right: ReadonlyMap<string, string>): boolean { if (left.size !== right.size) return false; for (const [key, value] of left) if (right.get(key) !== value) return false; return true; }
function isSerializationConflict(cause: unknown): cause is { code: "P2034" } { return typeof cause === "object" && cause !== null && "code" in cause && cause.code === "P2034"; }
function auditPayload(changes: Array<{ personId: string; before: string; after: string }>): Record<string, unknown> { return changes.length <= 100 ? { changedCount: changes.length, changes } : { changedCount: changes.length, changeHash: createHash("sha256").update(JSON.stringify(changes)).digest("hex") }; }
function formatDateOnly(date: Date): string { return date.toISOString().slice(0, 10); }
function civilDayBounds(date: string, timezone: string): { start: Date; end: Date } { const start = zonedMidnight(date, timezone); const next = new Date(`${date}T00:00:00.000Z`); next.setUTCDate(next.getUTCDate() + 1); return { start, end: zonedMidnight(next.toISOString().slice(0, 10), timezone) }; }
function zonedMidnight(date: string, timezone: string): Date { const target = new Date(`${date}T00:00:00.000Z`); let candidate = target; for (let attempt = 0; attempt < 3; attempt += 1) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(candidate); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)); candidate = new Date(candidate.getTime() + (target.getTime() - represented)); } return candidate; }
