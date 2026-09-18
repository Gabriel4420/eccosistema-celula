import { z } from "zod";

const civilDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidCivilDate(value: string): boolean {
  if (!civilDatePattern.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const civilDateSchema = z
  .string()
  .regex(civilDatePattern, "Invalid date format. Use YYYY-MM-DD")
  .refine(isValidCivilDate, "Invalid calendar date");

const MAX_SPAN_DAYS = 366;
const cellStatuses = ["FORMING", "ACTIVE", "SUSPENDED", "CLOSED"] as const;
const meetingStatuses = ["SCHEDULED", "COMPLETED", "CANCELED"] as const;
const reportStatuses = ["NOT_STARTED", "DRAFT", "SUBMITTED", "RETURNED"] as const;
const exportFormats = ["csv", "xlsx", "pdf"] as const;
export const exportLocales = ["pt-BR", "en", "es"] as const;
export type ExportLocale = (typeof exportLocales)[number];
const exportReportTypes = ["cells", "people", "attendance", "meetings"] as const;
const healthBands = ["healthy", "attention", "critical"] as const;

// ── Period query (reusable for all report endpoints) ──

const periodQuerySchema = z
  .object({
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict()
  .superRefine((value, context) => {
    const hasFrom = value.from !== undefined;
    const hasTo = value.to !== undefined;
    if (hasFrom !== hasTo) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' and 'to' must be provided together" });
    }
    if (hasFrom && hasTo && value.from! > value.to!) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' must be before or equal to 'to'" });
    }
    if (hasFrom && hasTo) {
      const spanDays = (Date.UTC(...splitCivil(value.to!)) - Date.UTC(...splitCivil(value.from!))) / 86_400_000 + 1;
      if (spanDays > MAX_SPAN_DAYS) {
        context.addIssue({ code: "custom", path: ["from"], message: `Period must not exceed ${MAX_SPAN_DAYS} days` });
      }
    }
  });

// ── Pagination meta ──

const paginationMetaSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
  })
  .strict();

// ── R-001: Pending reports ──

export const pendingReportsQuerySchema = periodQuerySchema
  .extend({
    status: z.enum(reportStatuses).optional(),
    cellId: z.uuid().optional()
  })
  .strict();

const pendingReportItemSchema = z
  .object({
    cell: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).strict(),
    leader: z.object({ firstName: z.string(), lastName: z.string() }).strict().nullable(),
    meetingDate: z.string().regex(civilDatePattern),
    daysSinceMeeting: z.number().int().nonnegative(),
    overdue: z.boolean(),
    reportStatus: z.enum(reportStatuses),
    lastReturnedAt: z.string().nullable()
  })
  .strict();

export const pendingReportsEnvelopeSchema = z
  .object({
    data: z.array(pendingReportItemSchema),
    meta: paginationMetaSchema
  })
  .strict();

// ── R-002: Attendance summary ──

export const attendanceSummaryQuerySchema = periodQuerySchema
  .extend({
    cellId: z.uuid().optional(),
    status: z.enum(cellStatuses).optional(),
    health: z.enum(healthBands).optional()
  })
  .strict();

const attendanceSummaryItemSchema = z
  .object({
    cell: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).strict(),
    leader: z.object({ firstName: z.string(), lastName: z.string() }).strict().nullable(),
    totalMeetings: z.number().int().nonnegative(),
    attendanceRate: z.number().min(0).max(100).nullable(),
    averagePresent: z.number().nonnegative(),
    totalVisitors: z.number().int().nonnegative(),
    healthBand: z.enum(["healthy", "attention", "critical"]).nullable()
  })
  .strict();

export const attendanceSummaryEnvelopeSchema = z
  .object({
    data: z.array(attendanceSummaryItemSchema),
    meta: paginationMetaSchema
  })
  .strict();

// ── R-003: Attendance detail (drill-down) ──

export const attendanceDetailQuerySchema = z
  .object({
    cellId: z.uuid(),
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict()
  .superRefine((value, context) => {
    const hasFrom = value.from !== undefined;
    const hasTo = value.to !== undefined;
    if (hasFrom !== hasTo) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' and 'to' must be provided together" });
    }
    if (hasFrom && hasTo && value.from! > value.to!) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' must be before or equal to 'to'" });
    }
  });

const attendanceByMeetingSchema = z
  .object({
    meetingId: z.uuid(),
    meetingDate: z.string().regex(civilDatePattern),
    status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "UNMARKED"])
  })
  .strict();

const attendanceDetailItemSchema = z
  .object({
    person: z.object({ id: z.uuid(), fullName: z.string() }).strict(),
    attendanceByMeeting: z.array(attendanceByMeetingSchema),
    totalPresent: z.number().int().nonnegative(),
    totalAbsent: z.number().int().nonnegative(),
    totalExcused: z.number().int().nonnegative(),
    attendanceRate: z.number().min(0).max(100).nullable()
  })
  .strict();

export const attendanceDetailEnvelopeSchema = z
  .object({
    data: z.array(attendanceDetailItemSchema),
    meta: paginationMetaSchema
  })
  .strict();

// ── R-004: Visitors ──

export const visitorsQuerySchema = periodQuerySchema
  .extend({
    cellId: z.uuid().optional(),
    contactPending: z.coerce.boolean().optional()
  })
  .strict();

const visitorReportItemSchema = z
  .object({
    person: z.object({ id: z.uuid(), fullName: z.string(), phone: z.string().nullable() }).strict(),
    cell: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).strict(),
    meetingDate: z.string().regex(civilDatePattern),
    invitedBy: z.object({ fullName: z.string() }).strict().nullable(),
    observation: z.string().nullable(),
    contactPending: z.boolean()
  })
  .strict();

const visitorMetricsSchema = z
  .object({
    total: z.number().int().nonnegative(),
    contactPendingCount: z.number().int().nonnegative(),
    topCell: z.object({ id: z.uuid(), code: z.string(), name: z.string(), count: z.number().int().nonnegative() }).strict().nullable()
  })
  .strict();

export const visitorsEnvelopeSchema = z
  .object({
    data: z.array(visitorReportItemSchema),
    metrics: visitorMetricsSchema,
    meta: paginationMetaSchema
  })
  .strict();

// ── R-005: Meetings report ──

export const meetingsReportQuerySchema = periodQuerySchema
  .extend({
    cellId: z.uuid().optional(),
    status: z.enum(meetingStatuses).optional()
  })
  .strict();

const meetingsReportItemSchema = z
  .object({
    cell: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).strict(),
    meetingDate: z.string().regex(civilDatePattern),
    status: z.enum(meetingStatuses),
    cancellationReason: z.string().nullable(),
    presentCount: z.number().int().nonnegative(),
    absentCount: z.number().int().nonnegative(),
    visitorCount: z.number().int().nonnegative(),
    attendanceRate: z.number().min(0).max(100).nullable(),
    reportStatus: z.enum(["NOT_STARTED", "DRAFT", "SUBMITTED", "RETURNED", "CANCELED"]).nullable()
  })
  .strict();

export const meetingsReportEnvelopeSchema = z
  .object({
    data: z.array(meetingsReportItemSchema),
    meta: paginationMetaSchema
  })
  .strict();

// ── Export queries ──

export const exportCellsQuerySchema = z
  .object({ format: z.enum(exportFormats), locale: z.enum(exportLocales).default("pt-BR") })
  .strict();

export const exportPeopleQuerySchema = z
  .object({
    format: z.enum(exportFormats),
    locale: z.enum(exportLocales).default("pt-BR"),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
  })
  .strict();

export const exportAttendanceQuerySchema = z
  .object({
    format: z.enum(exportFormats),
    locale: z.enum(exportLocales).default("pt-BR"),
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional(),
    cellId: z.uuid().optional()
  })
  .strict()
  .superRefine((value, context) => {
    const hasFrom = value.from !== undefined;
    const hasTo = value.to !== undefined;
    if (hasFrom !== hasTo) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' and 'to' must be provided together" });
    }
    if (hasFrom && hasTo && value.from! > value.to!) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' must be before or equal to 'to'" });
    }
  });

export const exportMeetingsQuerySchema = z
  .object({
    format: z.enum(exportFormats),
    locale: z.enum(exportLocales).default("pt-BR"),
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional(),
    cellId: z.uuid().optional()
  })
  .strict()
  .superRefine((value, context) => {
    const hasFrom = value.from !== undefined;
    const hasTo = value.to !== undefined;
    if (hasFrom !== hasTo) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' and 'to' must be provided together" });
    }
    if (hasFrom && hasTo && value.from! > value.to!) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' must be before or equal to 'to'" });
    }
  });

// ── Error codes ──

export const reportErrorCodeValues = [
  "REPORT_CELL_NOT_FOUND",
  "REPORT_EXPORT_FAILED"
] as const;

export const reportErrorCodeSchema = z.enum(reportErrorCodeValues);

export const reportsErrorEnvelopeSchema = z
  .object({
    error: z.object({
      code: reportErrorCodeSchema,
      message: z.string(),
      details: z.record(z.string(), z.unknown())
    }).strict()
  })
  .strict();

// ── Types ──

export type PendingReportsQuery = z.infer<typeof pendingReportsQuerySchema>;
export type PendingReportItem = z.infer<typeof pendingReportItemSchema>;
export type PendingReportsEnvelope = z.infer<typeof pendingReportsEnvelopeSchema>;

export type AttendanceSummaryQuery = z.infer<typeof attendanceSummaryQuerySchema>;
export type AttendanceSummaryItem = z.infer<typeof attendanceSummaryItemSchema>;
export type AttendanceSummaryEnvelope = z.infer<typeof attendanceSummaryEnvelopeSchema>;

export type AttendanceDetailQuery = z.infer<typeof attendanceDetailQuerySchema>;
export type AttendanceDetailItem = z.infer<typeof attendanceDetailItemSchema>;
export type AttendanceDetailEnvelope = z.infer<typeof attendanceDetailEnvelopeSchema>;

export type VisitorsQuery = z.infer<typeof visitorsQuerySchema>;
export type VisitorReportItem = z.infer<typeof visitorReportItemSchema>;
export type VisitorsEnvelope = z.infer<typeof visitorsEnvelopeSchema>;

export type MeetingsReportQuery = z.infer<typeof meetingsReportQuerySchema>;
export type MeetingsReportItem = z.infer<typeof meetingsReportItemSchema>;
export type MeetingsReportEnvelope = z.infer<typeof meetingsReportEnvelopeSchema>;

export type ExportFormat = (typeof exportFormats)[number];
export type ExportReportType = (typeof exportReportTypes)[number];
export type ReportErrorCode = z.infer<typeof reportErrorCodeSchema>;

export { exportFormats, exportReportTypes, healthBands, reportStatuses };

function splitCivil(value: string): [number, number, number] {
  const [year, month, day] = value.split("-");
  return [Number(year), Number(month) - 1, Number(day)];
}
