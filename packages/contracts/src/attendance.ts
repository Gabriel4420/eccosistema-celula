import { z } from "zod";

const attendanceStatuses = ["PRESENT", "ABSENT", "EXCUSED"] as const;
const displayStatuses = [...attendanceStatuses, "UNMARKED"] as const;
export const attendanceParamsSchema = z.object({ cellId: z.uuid(), meetingId: z.uuid() }).strict();
export const attendanceVisitorParamsSchema = attendanceParamsSchema.extend({ personId: z.uuid() }).strict();
const attendanceEntrySchema = z.object({ personId: z.uuid(), status: z.enum(attendanceStatuses) }).strict();
export const saveAttendanceRequestSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  attendance: z.array(attendanceEntrySchema).max(500)
}).strict().superRefine((value, context) => {
  const seen = new Set<string>();
  value.attendance.forEach((entry, index) => {
    if (seen.has(entry.personId)) context.addIssue({ code: "custom", path: ["attendance", index, "personId"], message: "Duplicate personId" });
    seen.add(entry.personId);
  });
});
export const createMeetingVisitorRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), personId: z.uuid(), invitedByPersonId: z.uuid().optional(), observation: z.string().trim().max(500).optional() }).strict(),
  z.object({ kind: z.literal("quick-create"), name: z.string().trim().min(1).max(200), phone: z.string().trim().max(32).optional(), invitedByPersonId: z.uuid().optional(), observation: z.string().trim().max(500).optional() }).strict()
]);
const attendanceSummarySchema = z.object({
  eligibleCount: z.number().int().nonnegative(), presentParticipants: z.number().int().nonnegative(),
  absentParticipants: z.number().int().nonnegative(), excusedParticipants: z.number().int().nonnegative(),
  unmarkedParticipants: z.number().int().nonnegative(), visitorCount: z.number().int().nonnegative(),
  totalPresent: z.number().int().nonnegative(), markingProgress: z.number().min(0).max(100).nullable(),
  attendancePercentage: z.number().min(0).max(100).nullable(), isOperational: z.boolean()
}).strict();
const participantSchema = z.object({ personId: z.uuid(), fullName: z.string(), status: z.enum(displayStatuses) }).strict();
const visitorSchema = z.object({ personId: z.uuid(), fullName: z.string(), invitedByPersonId: z.uuid().nullable(), observation: z.string().nullable(), contactPending: z.boolean() }).strict();
export const attendanceSnapshotSchema = z.object({
  meeting: z.object({ id: z.uuid(), cellId: z.uuid(), cellName: z.string(), meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["SCHEDULED", "COMPLETED", "CANCELED"]) }).strict(),
  revision: z.number().int().nonnegative(), isReadOnly: z.boolean(), canEdit: z.boolean(),
  participants: z.array(participantSchema), visitors: z.array(visitorSchema), summary: attendanceSummarySchema
}).strict();
export const attendanceEnvelopeSchema = z.object({ data: attendanceSnapshotSchema, meta: z.object({}).strict() }).strict();
export type SaveAttendanceRequest = z.infer<typeof saveAttendanceRequestSchema>;
export type CreateMeetingVisitorRequest = z.infer<typeof createMeetingVisitorRequestSchema>;
export type AttendanceSnapshot = z.infer<typeof attendanceSnapshotSchema>;
export type AttendanceEnvelope = z.infer<typeof attendanceEnvelopeSchema>;
