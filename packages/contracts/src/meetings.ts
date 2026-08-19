import { z } from "zod";

const meetingStatuses = ["SCHEDULED", "COMPLETED", "CANCELED"] as const;
const sortOrders = ["asc", "desc"] as const;
const meetingDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function normalizeMeetingDate(value: string): string {
  return value.trim();
}

function isValidCivilDate(value: string): boolean {
  if (!meetingDatePattern.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

const meetingDateSchema = z
  .string()
  .transform(normalizeMeetingDate)
  .pipe(z.string().refine(isValidCivilDate, "Invalid date format. Use YYYY-MM-DD"));

const meetingCellParamsSchema = z.object({ cellId: z.uuid() }).strict();

const meetingParamsSchema = z
  .object({ cellId: z.uuid(), meetingId: z.uuid() })
  .strict();

export const listMeetingsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    from: meetingDateSchema.optional(),
    to: meetingDateSchema.optional(),
    status: z.enum(meetingStatuses).optional(),
    sortOrder: z.enum(sortOrders).default("desc")
  })
  .strict()
  .refine(
    (value) => !value.from || !value.to || value.from <= value.to,
    "'from' must be before or equal to 'to'"
  );

export const createMeetingRequestSchema = z
  .object({
    meetingDate: meetingDateSchema
  })
  .strict();

export const updateMeetingRequestSchema = z
  .object({
    meetingDate: meetingDateSchema
  })
  .strict();

export const updateMeetingStatusRequestSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("COMPLETED") }).strict(),
  z
    .object({
      status: z.literal("CANCELED"),
      cancellationReason: z
        .string()
        .transform(normalizeText)
        .pipe(z.string().min(1).max(1000))
    })
    .strict()
]);

export const meetingReportDraftRequestSchema = z
  .object({
    observations: z
      .string()
      .transform(normalizeText)
      .pipe(z.string().max(5000))
      .nullable()
  })
  .strict();

const relatedCellSchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string()
  })
  .strict();

export const meetingResponseSchema = z
  .object({
    id: z.uuid(),
    cell: relatedCellSchema,
    meetingDate: z.string().regex(meetingDatePattern),
    status: z.enum(meetingStatuses),
    cancellationReason: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
  .strict();

export const meetingItemEnvelopeSchema = z
  .object({
    data: meetingResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

export const meetingsPageEnvelopeSchema = z
  .object({
    data: z.array(meetingResponseSchema),
    meta: z
      .object({
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1).max(100),
        totalItems: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();

export const meetingReportDraftResponseSchema = z
  .object({
    id: z.uuid(),
    meetingId: z.uuid(),
    observations: z.string().nullable(),
    status: z.literal("DRAFT"),
    submittedBy: z.null(),
    submittedAt: z.null(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
  .strict();

export const meetingReportEnvelopeSchema = z
  .object({
    data: meetingReportDraftResponseSchema.nullable(),
    meta: z.object({}).strict()
  })
  .strict();

export const meetingsErrorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown())
      })
      .strict()
  })
  .strict();

export type ListMeetingsQuery = z.infer<typeof listMeetingsQuerySchema>;
export type CreateMeetingRequest = z.infer<typeof createMeetingRequestSchema>;
export type UpdateMeetingRequest = z.infer<typeof updateMeetingRequestSchema>;
export type UpdateMeetingStatusRequest = z.infer<typeof updateMeetingStatusRequestSchema>;
export type MeetingReportDraftRequest = z.infer<typeof meetingReportDraftRequestSchema>;
export type MeetingResponse = z.infer<typeof meetingResponseSchema>;
export type MeetingItemEnvelope = z.infer<typeof meetingItemEnvelopeSchema>;
export type MeetingsPageEnvelope = z.infer<typeof meetingsPageEnvelopeSchema>;
export type MeetingReportDraftResponse = z.infer<typeof meetingReportDraftResponseSchema>;
export type MeetingReportEnvelope = z.infer<typeof meetingReportEnvelopeSchema>;
export type MeetingsErrorEnvelope = z.infer<typeof meetingsErrorEnvelopeSchema>;

export {
  meetingCellParamsSchema,
  meetingParamsSchema
};
