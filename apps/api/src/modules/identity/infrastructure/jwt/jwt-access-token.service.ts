import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import type { AccessTokenClaims } from "../../application/auth.types";
import type { AccessTokenService } from "../../application/ports";
import {
  AUTHENTICATION_ENVIRONMENT,
  type AuthEnvironment
} from "../../identity.tokens";

interface JwtPayload {
  sub: string;
  churchId: string;
  sid: string;
  roles: string[];
  jti: string;
}

@Injectable()
export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    @Inject(JwtService)
    private readonly jwt: JwtService,
    @Inject(AUTHENTICATION_ENVIRONMENT)
    private readonly environment: AuthEnvironment
  ) {}

  async issue(input: {
    userId: string;
    churchId: string;
    sessionId: string;
    roles: readonly string[];
  }): Promise<{ token: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: input.userId,
      churchId: input.churchId,
      sid: input.sessionId,
      roles: [...input.roles],
      jti: randomUUID()
    };
    const token = await this.jwt.signAsync(payload, {
      algorithm: "HS256",
      secret: this.environment.JWT_ACCESS_SECRET,
      issuer: this.environment.JWT_ISSUER,
      audience: this.environment.JWT_AUDIENCE,
      expiresIn: this.environment.JWT_ACCESS_TTL_SECONDS
    });
    return { token, expiresIn: this.environment.JWT_ACCESS_TTL_SECONDS };
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      algorithms: ["HS256"],
      secret: this.environment.JWT_ACCESS_SECRET,
      issuer: this.environment.JWT_ISSUER,
      audience: this.environment.JWT_AUDIENCE
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.churchId !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.jti !== "string" ||
      !Array.isArray(payload.roles) ||
      !payload.roles.every((role) => typeof role === "string")
    ) {
      throw new Error("Invalid access token claims");
    }
    return {
      userId: payload.sub,
      churchId: payload.churchId,
      sessionId: payload.sid,
      roles: payload.roles,
      jti: payload.jti
    };
  }
}
