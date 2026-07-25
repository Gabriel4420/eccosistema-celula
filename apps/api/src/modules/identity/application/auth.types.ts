import type { AuthenticatedPrincipal } from "@mission-atos/domain";

export interface AuthenticatedUser {
  id: string;
  churchId: string;
  email: string;
  passwordHash: string;
  status: "ACTIVE" | "BLOCKED";
  roles: readonly string[];
}

export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    churchId: string;
    roles: readonly string[];
  };
}

export interface AccessTokenClaims extends AuthenticatedPrincipal {
  jti: string;
}

export interface SessionRecord {
  id: string;
  churchId: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: string | null;
}
