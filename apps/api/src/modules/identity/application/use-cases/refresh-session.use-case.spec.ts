import type {
  AccessTokenService,
  Clock,
  RefreshTokenService,
  SessionRepository,
  UserCredentialsRepository
} from "../ports";
import type { SessionRecord } from "../auth.types";
import { RefreshSessionUseCase } from "./refresh-session.use-case";

describe("RefreshSessionUseCase", () => {
  const session = {
    id: "session",
    churchId: "church",
    userId: "user",
    familyId: "family",
    expiresAt: new Date("2026-07-24T13:00:00.000Z"),
    revokedAt: null,
    replacedBySessionId: null
  };

  it("rotates a valid session", async () => {
    const sessions = sessionRepository(session);
    const useCase = new RefreshSessionUseCase(
      userRepository(),
      sessions,
      accessTokens(),
      refreshTokens(),
      clock()
    );
    const result = await useCase.execute({
      refreshToken: "old-token",
      refreshTtlSeconds: 3600
    });
    expect(result.refreshToken).toBe("new-token");
    expect(sessions.rotate).toHaveBeenCalledWith(
      expect.objectContaining({ session, tokenHash: "new-hash" })
    );
  });

  it("revokes the family when a rotated token is reused", async () => {
    const sessions = sessionRepository({
      ...session,
      revokedAt: new Date("2026-07-24T12:00:00.000Z"),
      replacedBySessionId: "successor"
    });
    const useCase = new RefreshSessionUseCase(
      userRepository(),
      sessions,
      accessTokens(),
      refreshTokens(),
      clock()
    );
    await expect(
      useCase.execute({ refreshToken: "old-token", refreshTtlSeconds: 3600 })
    ).rejects.toMatchObject({ code: "AUTH_REFRESH_INVALID" });
    expect(sessions.revokeFamily).toHaveBeenCalledWith(
      "family",
      new Date("2026-07-24T12:00:00.000Z")
    );
  });
});

function sessionRepository(
  found: SessionRecord
): jest.Mocked<SessionRepository> {
  return {
    create: jest.fn(),
    findByTokenHash: jest.fn().mockResolvedValue(found),
    rotate: jest.fn().mockResolvedValue(true),
    revokeCurrent: jest.fn(),
    revokeFamily: jest.fn()
  };
}

function userRepository(): jest.Mocked<UserCredentialsRepository> {
  return {
    findForLogin: jest.fn(),
    findById: jest.fn().mockResolvedValue({
      id: "user",
      churchId: "church",
      email: "user@example.test",
      passwordHash: "hash",
      status: "ACTIVE",
      roles: ["ROLE"]
    }),
    updatePasswordHash: jest.fn(),
    changePasswordAndRevokeSessions: jest.fn()
  };
}

function accessTokens(): jest.Mocked<AccessTokenService> {
  return {
    issue: jest.fn().mockResolvedValue({ token: "access", expiresIn: 600 }),
    verify: jest.fn()
  };
}

function refreshTokens(): jest.Mocked<RefreshTokenService> {
  return {
    generate: jest.fn().mockReturnValue("new-token"),
    hash: jest
      .fn()
      .mockImplementation((token: string) =>
        token === "old-token" ? "old-hash" : "new-hash"
      )
  };
}

function clock(): Clock {
  return { now: () => new Date("2026-07-24T12:00:00.000Z") };
}
