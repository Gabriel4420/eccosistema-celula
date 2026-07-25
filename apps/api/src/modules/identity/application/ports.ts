import type {
  AccessTokenClaims,
  AuthenticatedUser,
  SessionRecord
} from "./auth.types";

export const USER_CREDENTIALS_REPOSITORY = Symbol(
  "USER_CREDENTIALS_REPOSITORY"
);
export const SESSION_REPOSITORY = Symbol("SESSION_REPOSITORY");
export const PASSWORD_HASHER = Symbol("PASSWORD_HASHER");
export const ACCESS_TOKEN_SERVICE = Symbol("ACCESS_TOKEN_SERVICE");
export const REFRESH_TOKEN_SERVICE = Symbol("REFRESH_TOKEN_SERVICE");
export const CLOCK = Symbol("CLOCK");

export interface UserCredentialsRepository {
  findForLogin(churchId: string, email: string): Promise<AuthenticatedUser | null>;
  findById(churchId: string, userId: string): Promise<AuthenticatedUser | null>;
  updatePasswordHash(input: {
    churchId: string;
    userId: string;
    passwordHash: string;
  }): Promise<void>;
  changePasswordAndRevokeSessions(input: {
    churchId: string;
    userId: string;
    passwordHash: string;
    occurredAt: Date;
  }): Promise<void>;
}

export interface SessionRepository {
  create(input: {
    churchId: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  rotate(input: {
    session: SessionRecord;
    tokenHash: string;
    successorId: string;
    expiresAt: Date;
    occurredAt: Date;
  }): Promise<boolean>;
  revokeCurrent(tokenHash: string, occurredAt: Date): Promise<void>;
  revokeFamily(familyId: string, occurredAt: Date): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
  needsRehash(hash: string): boolean;
  dummyVerify(password: string): Promise<void>;
}

export interface AccessTokenService {
  issue(input: {
    userId: string;
    churchId: string;
    sessionId: string;
    roles: readonly string[];
  }): Promise<{ token: string; expiresIn: number }>;
  verify(token: string): Promise<AccessTokenClaims>;
}

export interface RefreshTokenService {
  generate(): string;
  hash(token: string): string;
}

export interface Clock {
  now(): Date;
}
