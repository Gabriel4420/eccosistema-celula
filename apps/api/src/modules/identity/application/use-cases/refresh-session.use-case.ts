import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthError } from "../../domain/auth-error";
import type { AuthTokensResult } from "../auth.types";
import {
  ACCESS_TOKEN_SERVICE,
  CLOCK,
  REFRESH_TOKEN_SERVICE,
  SESSION_REPOSITORY,
  USER_CREDENTIALS_REPOSITORY,
  type AccessTokenService,
  type Clock,
  type RefreshTokenService,
  type SessionRepository,
  type UserCredentialsRepository
} from "../ports";

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(USER_CREDENTIALS_REPOSITORY)
    private readonly users: UserCredentialsRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepository,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokens: RefreshTokenService,
    @Inject(CLOCK) private readonly clock: Clock
  ) {}

  async execute(input: {
    refreshToken: string;
    refreshTtlSeconds: number;
  }): Promise<AuthTokensResult> {
    const now = this.clock.now();
    const currentHash = this.refreshTokens.hash(input.refreshToken);
    const session = await this.sessions.findByTokenHash(currentHash);
    if (!session) throw invalidRefresh();
    if (session.revokedAt || session.replacedBySessionId) {
      await this.sessions.revokeFamily(session.familyId, now);
      throw invalidRefresh();
    }
    if (session.expiresAt <= now) throw invalidRefresh();

    const resolved = await this.users.findById(
      session.churchId,
      session.userId
    );
    if (!resolved || resolved.id !== session.userId || resolved.status !== "ACTIVE") {
      await this.sessions.revokeFamily(session.familyId, now);
      throw invalidRefresh();
    }

    const refreshToken = this.refreshTokens.generate();
    const successorId = randomUUID();
    const rotated = await this.sessions.rotate({
      session,
      tokenHash: this.refreshTokens.hash(refreshToken),
      successorId,
      expiresAt: new Date(now.getTime() + input.refreshTtlSeconds * 1000),
      occurredAt: now
    });
    if (!rotated) {
      await this.sessions.revokeFamily(session.familyId, now);
      throw invalidRefresh();
    }
    const access = await this.accessTokens.issue({
      userId: resolved.id,
      churchId: resolved.churchId,
      sessionId: successorId,
      roles: resolved.roles
    });
    return {
      accessToken: access.token,
      refreshToken,
      expiresIn: access.expiresIn,
      user: {
        id: resolved.id,
        churchId: resolved.churchId,
        roles: resolved.roles
      }
    };
  }

}

function invalidRefresh(): AuthError {
  return new AuthError("AUTH_REFRESH_INVALID", "Invalid refresh token");
}
