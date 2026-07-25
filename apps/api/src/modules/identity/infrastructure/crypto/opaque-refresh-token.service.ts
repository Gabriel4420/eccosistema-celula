import { Inject, Injectable } from "@nestjs/common";
import { createHmac, randomBytes } from "node:crypto";
import type { RefreshTokenService } from "../../application/ports";
import {
  AUTHENTICATION_ENVIRONMENT,
  type AuthEnvironment
} from "../../identity.tokens";

@Injectable()
export class OpaqueRefreshTokenService implements RefreshTokenService {
  constructor(
    @Inject(AUTHENTICATION_ENVIRONMENT)
    private readonly environment: AuthEnvironment
  ) {}

  generate(): string {
    return randomBytes(32).toString("base64url");
  }

  hash(token: string): string {
    return createHmac("sha256", this.environment.REFRESH_TOKEN_PEPPER)
      .update(token)
      .digest("hex");
  }
}
