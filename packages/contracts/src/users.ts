import { z } from "zod";

export const managedRoleNames = [
  "ADMIN",
  "PASTOR",
  "SUPERVISOR",
  "LEADER"
] as const;

const name = z.string().trim().min(1).max(100);
const password = z.string().min(12).max(128);
const roleIds = z.array(z.uuid()).max(4).refine(
  (values) => new Set(values).size === values.length,
  "Role identifiers must be unique"
);

export const userIdParamsSchema = z.object({ id: z.uuid() }).strict();
export const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(320).optional(),
    status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
    roleId: z.uuid().optional()
  })
  .strict();
export const createUserRequestSchema = z
  .object({
    firstName: name,
    lastName: name,
    email: z.string().trim().toLowerCase().pipe(z.email().max(320)),
    initialPassword: password,
    roleIds
  })
  .strict();
export const updateUserRequestSchema = z
  .object({
    firstName: name.optional(),
    lastName: name.optional(),
    email: z.string().trim().toLowerCase().pipe(z.email().max(320)).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
export const updateOwnProfileRequestSchema = z
  .object({ firstName: name.optional(), lastName: name.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
export const updateUserStatusRequestSchema = z
  .object({ status: z.enum(["ACTIVE", "BLOCKED"]) })
  .strict();
export const replaceUserRolesRequestSchema = z.object({ roleIds }).strict();
export const resetUserPasswordRequestSchema = z
  .object({ newPassword: password })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type UpdateOwnProfileRequest = z.infer<typeof updateOwnProfileRequestSchema>;
export type UserStatusRequest = z.infer<typeof updateUserStatusRequestSchema>;
export type ReplaceUserRolesRequest = z.infer<typeof replaceUserRolesRequestSchema>;

