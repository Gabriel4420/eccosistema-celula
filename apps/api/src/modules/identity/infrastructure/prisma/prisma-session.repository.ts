import { Inject, Injectable } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import type { SessionRecord } from "../../application/auth.types";
import type { SessionRepository } from "../../application/ports";
import { DATABASE_CLIENT } from "../../identity.tokens";

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: RuntimeDatabaseClient
  ) {}

  create(input: {
    churchId: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    return this.database.session.create({
      data: input,
      select: { id: true }
    });
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.database.session.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        churchId: true,
        userId: true,
        familyId: true,
        expiresAt: true,
        revokedAt: true,
        replacedBySessionId: true
      }
    });
  }

  async rotate(input: {
    session: SessionRecord;
    tokenHash: string;
    successorId: string;
    expiresAt: Date;
    occurredAt: Date;
  }): Promise<boolean> {
    return this.database.$transaction(async (transaction) => {
      const consumed = await transaction.session.updateMany({
        where: {
          id: input.session.id,
          churchId: input.session.churchId,
          userId: input.session.userId,
          familyId: input.session.familyId,
          revokedAt: null,
          replacedBySessionId: null,
          expiresAt: { gt: input.occurredAt }
        },
        data: {
          revokedAt: input.occurredAt,
          revokedReason: "ROTATED",
          lastUsedAt: input.occurredAt
        }
      });
      if (consumed.count !== 1) return false;
      await transaction.session.create({
        data: {
          id: input.successorId,
          churchId: input.session.churchId,
          userId: input.session.userId,
          familyId: input.session.familyId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt
        }
      });
      await transaction.session.update({
        where: { id: input.session.id },
        data: { replacedBySessionId: input.successorId }
      });
      return true;
    });
  }

  async revokeCurrent(tokenHash: string, occurredAt: Date): Promise<void> {
    await this.database.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: occurredAt, revokedReason: "LOGOUT" }
    });
  }

  async revokeFamily(familyId: string, occurredAt: Date): Promise<void> {
    await this.database.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: occurredAt, revokedReason: "TOKEN_REUSE" }
    });
  }
}
