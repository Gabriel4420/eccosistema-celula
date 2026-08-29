import { z } from "zod";

import type { PrismaClient } from "../generated/prisma/client.js";

const managedRoleNames = ["ADMIN", "PASTOR", "SUPERVISOR", "LEADER"] as const;
const reservedSlugs = new Set([
  "admin", "api", "app", "auth", "church", "churches", "docs", "health",
  "login", "logout", "refresh", "settings", "users", "www"
]);

const productionBootstrapEnvironmentSchema = z.object({
  NODE_ENV: z.literal("production"),
  DATABASE_URL: z.url().startsWith("postgresql://"),
  AUTH_CHURCH_ID: z.uuid(),
  BOOTSTRAP_CONFIRM: z.literal("CREATE_INITIAL_ADMIN"),
  BOOTSTRAP_CHURCH_NAME: z.string().trim().min(1).max(160),
  BOOTSTRAP_CHURCH_SLUG: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .refine((slug) => !reservedSlugs.has(slug), "Reserved church slug"),
  BOOTSTRAP_CHURCH_TIMEZONE: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .default("America/Sao_Paulo")
    .refine(isIanaTimezone, "Invalid IANA timezone"),
  BOOTSTRAP_ADMIN_FIRST_NAME: z.string().trim().min(1).max(100),
  BOOTSTRAP_ADMIN_LAST_NAME: z.string().trim().min(1).max(100),
  BOOTSTRAP_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email().max(320)),
  BOOTSTRAP_ADMIN_PASSWORD: z
    .string()
    .min(12)
    .max(128)
    .refine(isAcceptableBootstrapPassword, "Bootstrap password is a placeholder or too predictable")
});

export type ProductionBootstrapEnvironment = z.infer<
  typeof productionBootstrapEnvironmentSchema
>;

export interface ProductionBootstrapResult {
  readonly churchId: string;
  readonly adminUserId: string;
  readonly changed: boolean;
}

export function parseProductionBootstrapEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): ProductionBootstrapEnvironment {
  return productionBootstrapEnvironmentSchema.parse(environment);
}

export async function bootstrapProduction(
  prisma: PrismaClient,
  environment: ProductionBootstrapEnvironment,
  hashPassword: (password: string) => Promise<string>
): Promise<ProductionBootstrapResult> {
  return prisma.$transaction(
    async (transaction) => {
      const [churchById, churchBySlug] = await Promise.all([
        transaction.church.findUnique({ where: { id: environment.AUTH_CHURCH_ID } }),
        transaction.church.findUnique({ where: { slug: environment.BOOTSTRAP_CHURCH_SLUG } })
      ]);

      if (churchById && churchById.slug !== environment.BOOTSTRAP_CHURCH_SLUG) {
        throw new Error("AUTH_CHURCH_ID already belongs to a church with another slug");
      }
      if (churchBySlug && churchBySlug.id !== environment.AUTH_CHURCH_ID) {
        throw new Error("BOOTSTRAP_CHURCH_SLUG already belongs to another church");
      }

      const existingChurch = churchById ?? churchBySlug;
      if (existingChurch?.deletedAt) {
        throw new Error("The configured church is deleted and cannot be bootstrapped");
      }

      const church =
        existingChurch ??
        (await transaction.church.create({
          data: {
            id: environment.AUTH_CHURCH_ID,
            name: environment.BOOTSTRAP_CHURCH_NAME,
            slug: environment.BOOTSTRAP_CHURCH_SLUG,
            timezone: environment.BOOTSTRAP_CHURCH_TIMEZONE,
            weekStartsOn: "SUNDAY"
          }
        }));

      let changed = existingChurch === null;
      const roles = new Map<string, { id: string }>();
      for (const roleName of managedRoleNames) {
        const existingRole = await transaction.role.findUnique({
          where: { churchId_name: { churchId: church.id, name: roleName } },
          select: { id: true, deletedAt: true }
        });
        const role = existingRole?.deletedAt
          ? await transaction.role.update({
              where: { id: existingRole.id },
              data: { deletedAt: null },
              select: { id: true }
            })
          : existingRole ??
            await transaction.role.create({
              data: { churchId: church.id, name: roleName },
              select: { id: true }
            });
        changed ||= existingRole === null || existingRole.deletedAt !== null;
        roles.set(roleName, role);
      }

      const existingAdmin = await transaction.user.findUnique({
        where: {
          churchId_email: {
            churchId: church.id,
            email: environment.BOOTSTRAP_ADMIN_EMAIL
          }
        }
      });
      if (existingAdmin?.deletedAt || existingAdmin?.status === "BLOCKED") {
        throw new Error("The configured administrator exists but is inactive");
      }

      const userCount = await transaction.user.count({ where: { churchId: church.id } });
      if (!existingAdmin && userCount > 0) {
        throw new Error("The church already has users; refusing to create a different bootstrap administrator");
      }

      const admin =
        existingAdmin ??
        (await transaction.user.create({
          data: {
            churchId: church.id,
            firstName: environment.BOOTSTRAP_ADMIN_FIRST_NAME,
            lastName: environment.BOOTSTRAP_ADMIN_LAST_NAME,
            email: environment.BOOTSTRAP_ADMIN_EMAIL,
            passwordHash: await hashPassword(environment.BOOTSTRAP_ADMIN_PASSWORD),
            status: "ACTIVE"
          }
        }));
      changed ||= existingAdmin === null;

      const adminRole = roles.get("ADMIN");
      if (!adminRole) {
        throw new Error("ADMIN role was not created");
      }
      const existingAssignment = await transaction.userRole.findUnique({
        where: {
          churchId_userId_roleId: {
            churchId: church.id,
            userId: admin.id,
            roleId: adminRole.id
          }
        }
      });
      if (existingAssignment) {
        if (existingAssignment.deletedAt) {
          await transaction.userRole.update({
            where: { id: existingAssignment.id },
            data: { deletedAt: null }
          });
          changed = true;
        }
      } else {
        await transaction.userRole.create({
          data: { churchId: church.id, userId: admin.id, roleId: adminRole.id }
        });
        changed = true;
      }

      if (changed) {
        await transaction.auditLog.create({
          data: {
            churchId: church.id,
            userId: admin.id,
            entity: "Church",
            entityId: church.id,
            action: "PRODUCTION_BOOTSTRAP_COMPLETED",
            after: {
              managedRoles: [...managedRoleNames],
              administratorCreated: existingAdmin === null
            }
          }
        });
      }

      return { churchId: church.id, adminUserId: admin.id, changed };
    },
    { isolationLevel: "Serializable" }
  );
}

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function isAcceptableBootstrapPassword(password: string): boolean {
  const normalized = password.toLowerCase();
  return ![
    "replace-with", "change-me", "changeme", "password", "senha123", "admin123"
  ].some((placeholder) => normalized.includes(placeholder));
}
