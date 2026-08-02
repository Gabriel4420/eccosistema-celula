import { z } from "zod";
import { normalizeChurchPhone, normalizeChurchText } from "./church";

const nullable = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => value === "" ? null : value, z.union([schema, z.null()]));

const fullNameSchema = z.string().transform(normalizeChurchText)
  .pipe(z.string().min(1).max(200));
const phoneSchema = nullable(z.string().transform(normalizeChurchPhone)
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)));
const emailSchema = nullable(z.string().trim().toLowerCase().pipe(z.email().max(320)));
const birthDateSchema = nullable(z.string().date().refine(
  (value) => value <= new Date().toISOString().slice(0, 10),
  "Birth date cannot be in the future"
));
const genderSchema = nullable(z.string().trim().min(1).max(50));
const observationsSchema = nullable(z.string().trim().min(1).max(10_000));

export const personIdParamsSchema = z.object({ id: z.uuid() }).strict();

export const listPeopleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(320).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  gender: z.string().trim().max(50).optional()
}).strict();

export const createPersonRequestSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  birthDate: birthDateSchema.optional(),
  gender: genderSchema.optional(),
  observations: observationsSchema.optional()
}).strict();

export const updatePersonRequestSchema = z.object({
  fullName: fullNameSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  birthDate: birthDateSchema.optional(),
  gender: genderSchema.optional(),
  observations: observationsSchema.optional()
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const updatePersonStatusRequestSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"])
}).strict();

export const personResponseSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  birthDate: z.string().date().nullable(),
  gender: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  observations: z.string().nullable().optional()
}).strict();

export const personItemEnvelopeSchema = z.object({
  data: personResponseSchema,
  meta: z.object({}).strict()
}).strict();

export const peoplePageEnvelopeSchema = z.object({
  data: z.array(personResponseSchema),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
  }).strict()
}).strict();

export const peopleErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown())
  }).strict()
}).strict();

export type CreatePersonRequest = z.infer<typeof createPersonRequestSchema>;
export type UpdatePersonRequest = z.infer<typeof updatePersonRequestSchema>;
export type ListPeopleQuery = z.infer<typeof listPeopleQuerySchema>;
export type PersonStatusRequest = z.infer<typeof updatePersonStatusRequestSchema>;
export type PersonResponse = z.infer<typeof personResponseSchema>;
export type PersonItemEnvelope = z.infer<typeof personItemEnvelopeSchema>;
export type PeoplePageEnvelope = z.infer<typeof peoplePageEnvelopeSchema>;
export type PeopleErrorEnvelope = z.infer<typeof peopleErrorEnvelopeSchema>;
