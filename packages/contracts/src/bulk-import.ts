import { z } from "zod";
import { createCellRequestSchema } from "./cells";
import { createPersonRequestSchema } from "./people";
import { evaluatePasswordStrength } from "./password";
import { managedRoleNames } from "./users";

export const importFormats = ["xlsx", "csv", "json"] as const;
export const importDomains = ["people", "cells", "users"] as const;

const cellCodeSchema = z
  .string()
  .trim()
  .transform((value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  )
  .pipe(z.string().min(1).max(50));

const roleNameSchema = z.enum(managedRoleNames);
const roleNamesSchema = z
  .array(roleNameSchema)
  .max(4)
  .refine((values) => new Set(values).size === values.length, "Role names must be unique");

const userFullNameSchema = z.string().trim().min(1).max(100);
const initialPasswordSchema = z.string().min(12).max(128).refine(
  (value) => evaluatePasswordStrength(value).isValid,
  "Password must contain uppercase, lowercase, number and special character"
);

/**
 * Canonical items produced by the file parsers and accepted by the JSON
 * import. People optionally carry a `cellCode` to create the primary active
 * membership (RF-008); users carry role NAMES resolved to UUIDs server-side.
 */
export const importPersonItemSchema = createPersonRequestSchema
  .extend({ cellCode: cellCodeSchema.optional() })
  .strict();

export const importCellItemSchema = createCellRequestSchema.strict();

export const importUserItemSchema = z
  .object({
    firstName: userFullNameSchema,
    lastName: userFullNameSchema,
    email: z.string().trim().toLowerCase().pipe(z.email().max(320)),
    initialPassword: initialPasswordSchema,
    roles: roleNamesSchema
  })
  .strict();

export const importPeopleRequestSchema = z
  .object({ items: z.array(importPersonItemSchema).min(1).max(2000) })
  .strict();

export const importCellsRequestSchema = z
  .object({ items: z.array(importCellItemSchema).min(1).max(2000) })
  .strict();

export const importUsersRequestSchema = z
  .object({ items: z.array(importUserItemSchema).min(1).max(2000) })
  .strict();

export const importRowResultSchema = z
  .object({
    row: z.number().int().min(1),
    status: z.enum(["created", "error"]),
    code: z.string().optional(),
    message: z.string().optional(),
    errors: z.array(z.string()).optional()
  })
  .strict();

export const importResultSchema = z
  .object({
    domain: z.enum(importDomains),
    fileName: z.string().min(1),
    format: z.enum(importFormats),
    processed: z.number().int().nonnegative(),
    created: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    resultsPerRow: z.array(importRowResultSchema)
  })
  .strict();

export const importResultEnvelopeSchema = z
  .object({
    data: importResultSchema,
    meta: z.object({}).strict()
  })
  .strict();

export type ImportFormat = (typeof importFormats)[number];
export type ImportDomain = (typeof importDomains)[number];
export type ManagedRoleName = (typeof managedRoleNames)[number];

export type ImportPersonItem = z.infer<typeof importPersonItemSchema>;
export type ImportCellItem = z.infer<typeof importCellItemSchema>;
export type ImportUserItem = z.infer<typeof importUserItemSchema>;
export type ImportRowResult = z.infer<typeof importRowResultSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ImportResultEnvelope = z.infer<typeof importResultEnvelopeSchema>;
