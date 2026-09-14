import { z } from "zod";

export const cellCodePattern = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const meetingTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const cellStatuses = [
  "FORMING",
  "ACTIVE",
  "SUSPENDED",
  "CLOSED"
] as const;
const createCellStatuses = ["FORMING", "ACTIVE", "SUSPENDED"] as const;
const writableCellStatuses = ["ACTIVE", "SUSPENDED"] as const;
const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;
const sortableCellFields = ["name", "code", "meetingDay", "createdAt"] as const;
const sortOrders = ["asc", "desc"] as const;
const assignmentKinds = ["SUPERVISOR", "LEADER", "TRAINEE"] as const;

function normalizeCellText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCellCode(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const codeSchema = z
  .string()
  .transform(normalizeCellCode)
  .pipe(z.string().min(1).max(50).regex(cellCodePattern));
const nameSchema = z
  .string()
  .transform(normalizeCellText)
  .pipe(z.string().min(1).max(160));
const addressSchema = z
  .string()
  .transform(normalizeCellText)
  .pipe(z.string().min(1).max(500));
const meetingTimeSchema = z.string().regex(meetingTimePattern);

const relatedUserSchema = z
  .object({
    id: z.uuid(),
    name: z.string()
  })
  .strict();

export const membershipStatuses = ["ACTIVE", "INACTIVE", "TRANSFERRED"] as const;

export const relatedCellSchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string()
  })
  .strict();

export const cellIdParamsSchema = z.object({ id: z.uuid() }).strict();

export const cellMemberIdParamsSchema = z
  .object({ id: z.uuid(), personId: z.uuid() })
  .strict();

export const listCellMembersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.enum(membershipStatuses).default("ACTIVE")
  })
  .strict();

export const cellMemberReasonSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined));

export const createCellMemberRequestSchema = z
  .object({
    personId: z.uuid(),
    reason: cellMemberReasonSchema
  })
  .strict();

export const removeCellMemberRequestSchema = z
  .object({ reason: cellMemberReasonSchema })
  .strict();

export const cellMemberResponseSchema = z
  .object({
    personId: z.uuid(),
    fullName: z.string(),
    phone: z.string().nullable(),
    joinedAt: z.iso.datetime(),
    status: z.enum(membershipStatuses),
    reason: z.string().nullable()
  })
  .strict();

export const cellMemberItemEnvelopeSchema = z
  .object({
    data: cellMemberResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

export const cellMembersPageEnvelopeSchema = z
  .object({
    data: z.array(cellMemberResponseSchema),
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

export const idempotencyKeySchema = z.uuid();

export const listCellsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(160).optional(),
    status: z.enum(cellStatuses).optional(),
    leaderId: z.uuid().optional(),
    meetingDay: z.enum(daysOfWeek).optional(),
    sortBy: z.enum(sortableCellFields).default("name"),
    sortOrder: z.enum(sortOrders).default("asc")
  })
  .strict();

export const createCellRequestSchema = z
  .object({
    code: codeSchema,
    name: nameSchema,
    status: z.enum(createCellStatuses).default("FORMING"),
    leaderId: z.uuid().nullable().optional(),
    supervisorId: z.uuid().optional(),
    traineeLeaderId: z.uuid().nullable().optional(),
    meetingDay: z.enum(daysOfWeek),
    meetingTime: meetingTimeSchema,
    address: addressSchema
  })
  .strict()
  .refine(
    (value) =>
      value.status !== "ACTIVE" ||
      (value.leaderId !== null && value.leaderId !== undefined && value.supervisorId !== undefined),
    "ACTIVE cells require leaderId and supervisorId"
  );

export const updateCellRequestSchema = z
  .object({
    code: codeSchema.optional(),
    name: nameSchema.optional(),
    meetingDay: z.enum(daysOfWeek).optional(),
    meetingTime: meetingTimeSchema.optional(),
    address: addressSchema.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const updateCellStatusRequestSchema = z
  .object({
    status: z.enum(writableCellStatuses)
  })
  .strict();

export const updateCellLeaderRequestSchema = z
  .object({
    leaderId: z.uuid(),
    supervisorId: z.uuid()
  })
  .strict()
  .refine((value) => value.leaderId !== value.supervisorId, "Leader and supervisor must differ");

export const updateCellTraineeLeaderRequestSchema = z
  .object({
    traineeLeaderId: z.uuid().nullable()
  })
  .strict();

export const cellResponseSchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: z.enum(cellStatuses),
    leader: relatedUserSchema.nullable(),
    supervisor: relatedUserSchema.nullable(),
    traineeLeader: relatedUserSchema.nullable(),
    memberCount: z.number().int().nonnegative(),
    meetingDay: z.enum(daysOfWeek),
    meetingTime: z.string().regex(meetingTimePattern),
    address: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
  .strict();

export const cellItemEnvelopeSchema = z
  .object({
    data: cellResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

export const cellsPageEnvelopeSchema = z
  .object({
    data: z.array(cellResponseSchema),
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

export const cellsErrorEnvelopeSchema = z
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

export const listCellAssignmentOptionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(160).optional(),
    kind: z.enum(assignmentKinds)
  })
  .strict();

export const cellAssignmentOptionSchema = relatedUserSchema;

export const cellAssignmentOptionsEnvelopeSchema = z
  .object({
    data: z.array(cellAssignmentOptionSchema),
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

export type ListCellsQuery = z.infer<typeof listCellsQuerySchema>;
export type CreateCellRequest = z.infer<typeof createCellRequestSchema>;
export type UpdateCellRequest = z.infer<typeof updateCellRequestSchema>;
export type CellStatusRequest = z.infer<typeof updateCellStatusRequestSchema>;
export type UpdateCellLeaderRequest = z.infer<typeof updateCellLeaderRequestSchema>;
export type UpdateCellTraineeLeaderRequest = z.infer<
  typeof updateCellTraineeLeaderRequestSchema
>;
export type CellResponse = z.infer<typeof cellResponseSchema>;
export type CellItemEnvelope = z.infer<typeof cellItemEnvelopeSchema>;
export type CellsPageEnvelope = z.infer<typeof cellsPageEnvelopeSchema>;
export type CellsErrorEnvelope = z.infer<typeof cellsErrorEnvelopeSchema>;
export type ListCellAssignmentOptionsQuery = z.infer<
  typeof listCellAssignmentOptionsQuerySchema
>;
export type CellAssignmentOption = z.infer<typeof cellAssignmentOptionSchema>;
export type CellAssignmentOptionsEnvelope = z.infer<
  typeof cellAssignmentOptionsEnvelopeSchema
>;
export type CreateCellMemberRequest = z.infer<typeof createCellMemberRequestSchema>;
export type RemoveCellMemberRequest = z.infer<typeof removeCellMemberRequestSchema>;
export type ListCellMembersQuery = z.infer<typeof listCellMembersQuerySchema>;
export type CellMemberParams = z.infer<typeof cellMemberIdParamsSchema>;
export type CellMemberStatus = (typeof membershipStatuses)[number];
export type CellMemberResponse = z.infer<typeof cellMemberResponseSchema>;
export type CellMemberItemEnvelope = z.infer<typeof cellMemberItemEnvelopeSchema>;
export type CellMembersPageEnvelope = z.infer<typeof cellMembersPageEnvelopeSchema>;
