import { z } from "zod";

export const churchWeekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;

export const reservedChurchSlugs = [
  "admin",
  "api",
  "app",
  "auth",
  "church",
  "churches",
  "docs",
  "health",
  "login",
  "logout",
  "refresh",
  "settings",
  "users",
  "www"
] as const;

export function normalizeChurchText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeChurchSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeChurchPhone(value: string): string {
  return value.trim().replace(/[\s().-]/g, "");
}

export function normalizeChurchPostalCode(value: string): string {
  return value.replace(/\D/g, "");
}

export function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const requiredText = (maxLength: number) =>
  z.string().transform(normalizeChurchText).pipe(z.string().min(1).max(maxLength));

const nullableText = (maxLength: number) =>
  z.union([requiredText(maxLength), z.null()]);

const slugSchema = z
  .string()
  .transform(normalizeChurchSlug)
  .pipe(z.string().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
  .refine(
    (value) => !reservedChurchSlugs.includes(value as typeof reservedChurchSlugs[number]),
    "Reserved church slug"
  );

const nullableEmail = z.union([
  z.string().trim().toLowerCase().pipe(z.email().max(320)),
  z.null()
]);

const nullablePhone = z.union([
  z
    .string()
    .transform(normalizeChurchPhone)
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
  z.null()
]);

const nullableState = z.union([
  z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z]{2}$/)),
  z.null()
]);

const nullablePostalCode = z.union([
  z
    .string()
    .transform(normalizeChurchPostalCode)
    .pipe(z.string().regex(/^\d{8}$/)),
  z.null()
]);

export const updateChurchRequestSchema = z
  .object({
    name: requiredText(160).optional(),
    slug: slugSchema.optional(),
    email: nullableEmail.optional(),
    phone: nullablePhone.optional(),
    addressLine: nullableText(200).optional(),
    addressNumber: nullableText(30).optional(),
    addressComplement: nullableText(120).optional(),
    neighborhood: nullableText(120).optional(),
    city: nullableText(120).optional(),
    state: nullableState.optional(),
    postalCode: nullablePostalCode.optional(),
    country: z.literal("BR").optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const updateChurchSettingsRequestSchema = z
  .object({
    timezone: z.string().trim().min(1).max(64).refine(isIanaTimezone, "Invalid IANA timezone").optional(),
    weekStartsOn: z.enum(churchWeekDays).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const churchAddressResponseSchema = z.object({
  line: z.string().nullable(),
  number: z.string().nullable(),
  complement: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string()
}).strict();

export const churchResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: churchAddressResponseSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
}).strict();

export const churchEnvelopeSchema = z.object({
  data: churchResponseSchema,
  meta: z.object({}).strict()
}).strict();

export const churchSettingsResponseSchema = z.object({
  timezone: z.string(),
  weekStartsOn: z.enum(churchWeekDays)
}).strict();

export const churchSettingsEnvelopeSchema = z.object({
  data: churchSettingsResponseSchema,
  meta: z.object({}).strict()
}).strict();

export type UpdateChurchRequest = z.infer<typeof updateChurchRequestSchema>;
export type UpdateChurchSettingsRequest = z.infer<
  typeof updateChurchSettingsRequestSchema
>;
export type ChurchWeekDay = typeof churchWeekDays[number];
export type ChurchAddressResponse = z.infer<typeof churchAddressResponseSchema>;
export type ChurchResponse = z.infer<typeof churchResponseSchema>;
export type ChurchEnvelope = z.infer<typeof churchEnvelopeSchema>;
export type ChurchSettingsResponse = z.infer<typeof churchSettingsResponseSchema>;
export type ChurchSettingsEnvelope = z.infer<typeof churchSettingsEnvelopeSchema>;

