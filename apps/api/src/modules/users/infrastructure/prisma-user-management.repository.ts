import { Inject, Injectable } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import type { UserStatus } from "@mission-atos/domain";
import { managedRoleNames } from "@mission-atos/contracts";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { UserManagementError } from "../application/user-management.error";
import type {
  AuditValue,
  UserManagementRepository,
  UserManagementTransaction,
  UserManagementUnitOfWork
} from "../application/user-management.port";
import type {
  ListUsersInput,
  ManagedRole,
  ManagedUser,
  UserPage
} from "../application/user-management.types";

const publicInclude = {
  userRoles: {
    where: { deletedAt: null, role: { deletedAt: null } },
    select: { role: { select: { id: true, name: true } } }
  }
} as const;

@Injectable()
export class PrismaUserManagementRepository
  implements UserManagementRepository, UserManagementUnitOfWork
{
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient
  ) {}

  async isActiveAdministrator(churchId: string, userId: string): Promise<boolean> {
    return (
      (await this.database.user.count({
        where: {
          id: userId,
          churchId,
          status: "ACTIVE",
          deletedAt: null,
          userRoles: {
            some: {
              churchId,
              deletedAt: null,
              role: { name: "ADMIN", deletedAt: null }
            }
          }
        }
      })) === 1
    );
  }

  async managedRoles(churchId: string): Promise<ManagedRole[]> {
    return this.database.role.findMany({
      where: {
        churchId,
        deletedAt: null,
        name: { in: [...managedRoleNames] }
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
  }

  async list(churchId: string, query: ListUsersInput): Promise<UserPage> {
    const searchTerms = query.search?.trim().split(/\s+/).filter(Boolean);
    const where = {
      churchId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.roleId
        ? { userRoles: { some: { churchId, roleId: query.roleId, deletedAt: null } } }
        : {}),
      ...(searchTerms?.length
        ? {
            AND: searchTerms.map((term) => ({
              OR: [
                { firstName: { contains: term, mode: "insensitive" as const } },
                { lastName: { contains: term, mode: "insensitive" as const } },
                { email: { contains: term.toLowerCase(), mode: "insensitive" as const } }
              ]
            }))
          }
        : {})
    };
    const [items, totalItems] = await this.database.$transaction(
      [
        this.database.user.findMany({
          where,
          include: publicInclude,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize
        }),
        this.database.user.count({ where })
      ],
      { isolationLevel: "RepeatableRead" }
    );
    return { items: items.map(mapUser), totalItems };
  }

  async find(churchId: string, userId: string): Promise<ManagedUser | null> {
    const user = await this.database.user.findFirst({
      where: { id: userId, churchId, deletedAt: null },
      include: publicInclude
    });
    return user ? mapUser(user) : null;
  }

  async execute<T>(
    churchId: string,
    work: (transaction: UserManagementTransaction) => Promise<T>
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.database.$transaction(
          async (databaseTransaction) => {
            // Serializes invariant-sensitive mutations per tenant, including
            // concurrent changes targeting different administrator rows.
            await databaseTransaction.$queryRaw`
              SELECT "id"
              FROM "churches"
              WHERE "id" = ${churchId}::uuid AND "deleted_at" IS NULL
              FOR UPDATE
            `;
            return work(
              new PrismaUserManagementTransaction(databaseTransaction, churchId)
            );
          },
          { isolationLevel: "Serializable" }
        );
      } catch (error) {
        if (isPrismaCode(error, "P2002")) {
          throw new UserManagementError(
            "USER_EMAIL_CONFLICT",
            "Email is already in use"
          );
        }
        if (!isPrismaCode(error, "P2034") || attempt === 3) throw error;
      }
    }
    throw new Error("Serializable transaction retry exhausted");
  }
}

type TransactionClient = Parameters<
  Parameters<RuntimeDatabaseClient["$transaction"]>[0]
>[0];

class PrismaUserManagementTransaction implements UserManagementTransaction {
  constructor(
    private readonly transaction: TransactionClient,
    private readonly churchId: string
  ) {}

  async isActiveAdministrator(userId: string): Promise<boolean> {
    return (
      (await this.transaction.user.count({
        where: {
          id: userId,
          churchId: this.churchId,
          status: "ACTIVE",
          deletedAt: null,
          userRoles: {
            some: {
              churchId: this.churchId,
              deletedAt: null,
              role: { name: "ADMIN", deletedAt: null }
            }
          }
        }
      })) === 1
    );
  }

  async findUser(userId: string): Promise<ManagedUser | null> {
    const user = await this.transaction.user.findFirst({
      where: { id: userId, churchId: this.churchId, deletedAt: null },
      include: publicInclude
    });
    return user ? mapUser(user) : null;
  }

  async findRoles(roleIds: readonly string[]) {
    return this.transaction.role.findMany({
      where: {
        id: { in: [...roleIds] },
        churchId: this.churchId,
        deletedAt: null
      },
      select: { id: true, name: true }
    });
  }

  countActiveAdministrators(): Promise<number> {
    return this.transaction.user.count({
      where: {
        churchId: this.churchId,
        status: "ACTIVE",
        deletedAt: null,
        userRoles: {
          some: {
            churchId: this.churchId,
            deletedAt: null,
            role: { name: "ADMIN", deletedAt: null }
          }
        }
      }
    });
  }

  async createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleIds: readonly string[];
  }): Promise<ManagedUser> {
    const user = await this.transaction.user.create({
      data: {
        churchId: this.churchId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash: input.passwordHash,
        status: "ACTIVE"
      }
    });
    if (input.roleIds.length) {
      await this.transaction.userRole.createMany({
        data: input.roleIds.map((roleId) => ({
          churchId: this.churchId,
          userId: user.id,
          roleId
        }))
      });
    }
    return this.requireUser(user.id);
  }

  async updateUser(input: {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<ManagedUser> {
    await this.requireUser(input.userId);
    const user = await this.transaction.user.update({
      where: {
        id_churchId: { id: input.userId, churchId: this.churchId }
      },
      data: {
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.email ? { email: input.email } : {})
      },
      include: publicInclude
    });
    return mapUser(user);
  }

  async updateStatus(input: {
    userId: string;
    status: "ACTIVE" | "BLOCKED";
  }): Promise<ManagedUser> {
    await this.requireUser(input.userId);
    return mapUser(
      await this.transaction.user.update({
        where: {
          id_churchId: { id: input.userId, churchId: this.churchId }
        },
        data: { status: input.status },
        include: publicInclude
      })
    );
  }

  async replaceRoles(input: {
    userId: string;
    roleIds: readonly string[];
  }): Promise<ManagedUser> {
    await this.requireUser(input.userId);
    const existing = await this.transaction.userRole.findMany({
      where: { churchId: this.churchId, userId: input.userId }
    });
    const desired = new Set(input.roleIds);
    const removedIds = existing
      .filter((relation) => !desired.has(relation.roleId) && !relation.deletedAt)
      .map((relation) => relation.id);
    const reactivatedIds = existing
      .filter((relation) => desired.has(relation.roleId) && relation.deletedAt)
      .map((relation) => relation.id);
    if (removedIds.length) {
      await this.transaction.userRole.updateMany({
        where: { id: { in: removedIds } },
        data: { deletedAt: new Date() }
      });
    }
    if (reactivatedIds.length) {
      await this.transaction.userRole.updateMany({
        where: { id: { in: reactivatedIds } },
        data: { deletedAt: null }
      });
    }
    for (const relation of existing) desired.delete(relation.roleId);
    if (desired.size) {
      await this.transaction.userRole.createMany({
        data: [...desired].map((roleId) => ({
          churchId: this.churchId,
          userId: input.userId,
          roleId
        }))
      });
    }
    return this.requireUser(input.userId);
  }

  async updatePassword(input: {
    userId: string;
    passwordHash: string;
  }): Promise<void> {
    await this.requireUser(input.userId);
    await this.transaction.user.update({
      where: {
        id_churchId: { id: input.userId, churchId: this.churchId }
      },
      data: { passwordHash: input.passwordHash }
    });
  }

  revokeSessions(input: {
    userId: string;
    reason: "PASSWORD_CHANGED" | "USER_INACTIVE";
  }): Promise<number> {
    return this.transaction.session
      .updateMany({
        where: {
          churchId: this.churchId,
          userId: input.userId,
          revokedAt: null
        },
        data: { revokedAt: new Date(), revokedReason: input.reason }
      })
      .then((result) => result.count);
  }

  async recordAudit(input: {
    actorId: string;
    entityId: string;
    action: string;
    before?: { [key: string]: AuditValue };
    after?: { [key: string]: AuditValue };
  }): Promise<void> {
    await this.transaction.auditLog.create({
      data: {
        churchId: this.churchId,
        userId: input.actorId,
        entity: "User",
        entityId: input.entityId,
        action: input.action,
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {})
      }
    });
  }

  private async requireUser(userId: string): Promise<ManagedUser> {
    const user = await this.findUser(userId);
    if (!user) {
      throw new UserManagementError("USER_NOT_FOUND", "User not found");
    }
    return user;
  }
}

function mapUser(user: {
  id: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  userRoles: Array<{ role: { id: string; name: string } }>;
}): ManagedUser {
  return {
    id: user.id,
    churchId: user.churchId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    roles: user.userRoles.map(({ role }) => ({ id: role.id, name: role.name })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
