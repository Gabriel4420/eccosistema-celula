import { Inject, Injectable } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import type { AuthenticatedUser } from "../../application/auth.types";
import type { UserCredentialsRepository } from "../../application/ports";
import { DATABASE_CLIENT } from "../../identity.tokens";

@Injectable()
export class PrismaUserCredentialsRepository
  implements UserCredentialsRepository
{
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: RuntimeDatabaseClient
  ) {}

  async findForLogin(
    churchId: string,
    email: string
  ): Promise<AuthenticatedUser | null> {
    const user = await this.database.user.findFirst({
      where: { churchId, email, deletedAt: null },
      include: {
        userRoles: {
          where: { churchId, deletedAt: null, role: { deletedAt: null } },
          include: { role: true }
        }
      }
    });
    return user ? mapUser(user) : null;
  }

  async findById(
    churchId: string,
    userId: string
  ): Promise<AuthenticatedUser | null> {
    const user = await this.database.user.findFirst({
      where: { id: userId, churchId, deletedAt: null },
      include: {
        userRoles: {
          where: { churchId, deletedAt: null, role: { deletedAt: null } },
          include: { role: true }
        }
      }
    });
    return user ? mapUser(user) : null;
  }

  async updatePasswordHash(input: {
    churchId: string;
    userId: string;
    passwordHash: string;
  }): Promise<void> {
    await this.database.user.update({
      where: { id_churchId: { id: input.userId, churchId: input.churchId } },
      data: { passwordHash: input.passwordHash }
    });
  }

  async changePasswordAndRevokeSessions(input: {
    churchId: string;
    userId: string;
    passwordHash: string;
    occurredAt: Date;
  }): Promise<void> {
    await this.database.$transaction([
      this.database.user.update({
        where: {
          id_churchId: { id: input.userId, churchId: input.churchId }
        },
        data: { passwordHash: input.passwordHash }
      }),
      this.database.session.updateMany({
        where: {
          churchId: input.churchId,
          userId: input.userId,
          revokedAt: null
        },
        data: {
          revokedAt: input.occurredAt,
          revokedReason: "PASSWORD_CHANGED"
        }
      }),
      this.database.auditLog.create({
        data: {
          churchId: input.churchId,
          userId: input.userId,
          entity: "User",
          entityId: input.userId,
          action: "PASSWORD_CHANGED",
          after: { sessionsRevoked: true }
        }
      })
    ]);
  }
}

function mapUser(user: {
  id: string;
  churchId: string;
  email: string;
  passwordHash: string;
  status: "ACTIVE" | "BLOCKED";
  userRoles: Array<{ role: { name: string } }>;
}): AuthenticatedUser {
  return {
    id: user.id,
    churchId: user.churchId,
    email: user.email,
    passwordHash: user.passwordHash,
    status: user.status,
    roles: user.userRoles.map(({ role }) => role.name)
  };
}
