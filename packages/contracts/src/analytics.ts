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

const MAX_OVERVIEW_SPAN_DAYS = 366;
const cellStatuses = ["FORMING", "ACTIVE", "SUSPENDED", "CLOSED"] as const;

export const overviewQuerySchema = z
  .object({
    period: z.enum(["30d"]).optional(),
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional()
  })
  .strict()
  .superRefine((value, context) => {
    const hasPeriod = value.period !== undefined;
    const hasFrom = value.from !== undefined;
    const hasTo = value.to !== undefined;
    if (hasPeriod && (hasFrom || hasTo)) {
      context.addIssue({ code: "custom", path: ["period"], message: "Use either 'period' or 'from'/'to', not both" });
    }
    if (hasFrom !== hasTo) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' and 'to' must be provided together" });
    }
    if (hasFrom && hasTo && value.from! > value.to!) {
      context.addIssue({ code: "custom", path: ["from"], message: "'from' must be before or equal to 'to'" });
    }
    if (hasFrom && hasTo) {
      const spanDays = (Date.UTC(...splitCivil(value.to!)) - Date.UTC(...splitCivil(value.from!))) / 86_400_000 + 1;
      if (spanDays > MAX_OVERVIEW_SPAN_DAYS) {
        context.addIssue({ code: "custom", path: ["from"], message: `Period must not exceed ${MAX_OVERVIEW_SPAN_DAYS} days` });
      }
    }
  });

export const seriesQuerySchema = z
  .object({
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional(),
    granularity: z.enum(["monthly"]).default("monthly")
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, "'from' must be before or equal to 'to'");

export const cellsSummaryQuerySchema = z
  .object({
    windowDays: z.coerce.number().int().min(2).max(90).default(14),
    status: z.enum(cellStatuses).default("ACTIVE")
  })
  .strict();

const percentageSchema = z.number().min(0).max(100);

const periodSchema = z
  .object({
    from: z.string().regex(civilDatePattern),
    to: z.string().regex(civilDatePattern),
    prevFrom: z.string().regex(civilDatePattern),
    prevTo: z.string().regex(civilDatePattern)
  })
  .strict();

const deltaSchema = z
  .object({
    people: z.number().nullable(),
    activeCells: z.number().nullable(),
    formingCells: z.number().nullable(),
    members: z.number().nullable(),
    meetings: z.number().nullable(),
    completedMeetings: z.number().nullable(),
    completionRate: z.number().nullable(),
    attendanceRate: z.number().nullable(),
    averagePresent: z.number().nullable(),
    visitors: z.number().nullable()
  })
  .strict();

const overviewTotalsSchema = z
  .object({
    people: z.number().int().nonnegative(),
    activeCells: z.number().int().nonnegative(),
    formingCells: z.number().int().nonnegative(),
    members: z.number().int().nonnegative()
  })
  .strict();

const overviewMeetingsSchema = z
  .object({
    total: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    completionRate: percentageSchema
  })
  .strict();

const overviewAttendanceSchema = z
  .object({
    attendanceRate: percentageSchema.nullable(),
    averagePresent: z.number().nonnegative()
  })
  .strict();

const overviewVisitorsSchema = z
  .object({
    total: z.number().int().nonnegative()
  })
  .strict();

export const overviewResponseSchema = z
  .object({
    period: periodSchema,
    totals: overviewTotalsSchema,
    meetings: overviewMeetingsSchema,
    attendance: overviewAttendanceSchema,
    visitors: overviewVisitorsSchema,
    delta: deltaSchema.optional()
  })
  .strict();

export const overviewEnvelopeSchema = z
  .object({
    data: overviewResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

const seriesPointSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    meetings: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    presentMembers: z.number().int().nonnegative(),
    visitors: z.number().int().nonnegative()
  })
  .strict();

export const seriesResponseSchema = z.array(seriesPointSchema);

export const seriesEnvelopeSchema = z
  .object({
    data: seriesResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

const cellSummaryItemSchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: z.enum(cellStatuses),
    lastCompletedAt: z.string().regex(civilDatePattern).nullable(),
    membersCount: z.number().int().nonnegative()
  })
  .strict();

export const cellsSummaryResponseSchema = z
  .object({
    cells: z.array(cellSummaryItemSchema),
    withoutRecentMeeting: z.number().int().nonnegative(),
    recentMeetingWindowDays: z.number().int().min(2).max(90)
  })
  .strict();

export const cellsSummaryEnvelopeSchema = z
  .object({
    data: cellsSummaryResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
export type SeriesQuery = z.infer<typeof seriesQuerySchema>;
export type CellsSummaryQuery = z.infer<typeof cellsSummaryQuerySchema>;
export type OverviewResponse = z.infer<typeof overviewResponseSchema>;
export type OverviewEnvelope = z.infer<typeof overviewEnvelopeSchema>;
export type SeriesPoint = z.infer<typeof seriesPointSchema>;
export type SeriesResponse = z.infer<typeof seriesResponseSchema>;
export type SeriesEnvelope = z.infer<typeof seriesEnvelopeSchema>;
export type CellSummaryItem = z.infer<typeof cellSummaryItemSchema>;
export type CellsSummaryResponse = z.infer<typeof cellsSummaryResponseSchema>;
export type CellsSummaryEnvelope = z.infer<typeof cellsSummaryEnvelopeSchema>;

function splitCivil(value: string): [number, number, number] {
  const [year, month, day] = value.split("-");
  return [Number(year), Number(month) - 1, Number(day)];
}
