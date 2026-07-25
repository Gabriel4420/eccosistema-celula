import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthError } from "../../domain/auth-error";
import type { AuthTokensResult } from "../auth.types";
import {
  ACCESS_TOKEN_SERVICE,
  CLOCK,
  PASSWORD_HASHER,
  REFRESH_TOKEN_SERVICE,
  SESSION_REPOSITORY,
  USER_CREDENTIALS_REPOSITORY,
  type AccessTokenService,
  type Clock,
  type PasswordHasher,
  type RefreshTokenService,
  type SessionRepository,
  type UserCredentialsRepository
} from "../ports";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_CREDENTIALS_REPOSITORY)
    private readonly users: UserCredentialsRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokens: RefreshTokenService,
    @Inject(CLOCK) private readonly clock: Clock
  ) {}

  async execute(input: {
    churchId: string;
    email: string;
    password: string;
    refreshTtlSeconds: number;
  }): Promise<AuthTokensResult> {
    const user = await this.users.findForLogin(input.churchId, input.email);
    if (!user) {
      await this.passwords.dummyVerify(input.password);
      throw invalidCredentials();
    }
    const valid = await this.passwords.verify(user.passwordHash, input.password);
    if (!valid || user.status !== "ACTIVE") {
      throw invalidCredentials();
    }
    if (this.passwords.needsRehash(user.passwordHash)) {
      await this.users.updatePasswordHash({
        churchId: user.churchId,
        userId: user.id,
        passwordHash: await this.passwords.hash(input.password)
      });
    }

    const refreshToken = this.refreshTokens.generate();
    const familyId = randomUUID();
    const now = this.clock.now();
    const session = await this.sessions.create({
      churchId: user.churchId,
      userId: user.id,
      tokenHash: this.refreshTokens.hash(refreshToken),
      familyId,
      expiresAt: new Date(now.getTime() + input.refreshTtlSeconds * 1000)
    });
    const access = await this.accessTokens.issue({
      userId: user.id,
      churchId: user.churchId,
      sessionId: session.id,
      roles: user.roles
    });

    return {
      accessToken: access.token,
      refreshToken,
      expiresIn: access.expiresIn,
      user: { id: user.id, churchId: user.churchId, roles: user.roles }
    };
  }
}

function invalidCredentials(): AuthError {
  return new AuthError(
    "AUTH_INVALID_CREDENTIALS",
    401,
    "Invalid email or password"
  );
}
