import { z } from "zod";
import { isIanaTimezone } from "./church";

export const settingsLocales = ["pt-BR", "en", "es"] as const;

export const settingsDateFormats = [
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd"
] as const;

export const settingsThemes = ["light", "dark", "system"] as const;

export const reportDeadlineHoursSchema = z
  .coerce.number()
  .int()
  .min(1)
  .max(720);

const displayTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine(isIanaTimezone, "Invalid IANA timezone");

export const updateOwnPreferencesRequestSchema = z
  .object({
    language: z.enum(settingsLocales).optional(),
    displayTimezone: z
      .union([displayTimezoneSchema, z.null()])
      .optional(),
    dateFormat: z.enum(settingsDateFormats).optional(),
    theme: z.enum(settingsThemes).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const userPreferencesResponseSchema = z
  .object({
    language: z.enum(settingsLocales),
    displayTimezone: z.string().nullable(),
    dateFormat: z.enum(settingsDateFormats),
    theme: z.enum(settingsThemes)
  })
  .strict();

export const userPreferencesEnvelopeSchema = z
  .object({
    data: userPreferencesResponseSchema,
    meta: z.object({}).strict()
  })
  .strict();

export type SettingsLocale = (typeof settingsLocales)[number];
export type SettingsDateFormat = (typeof settingsDateFormats)[number];
export type SettingsTheme = (typeof settingsThemes)[number];
export type UpdateOwnPreferencesRequest = z.infer<
  typeof updateOwnPreferencesRequestSchema
>;
export type UserPreferencesResponse = z.infer<
  typeof userPreferencesResponseSchema
>;
export type UserPreferencesEnvelope = z.infer<
  typeof userPreferencesEnvelopeSchema
>;
