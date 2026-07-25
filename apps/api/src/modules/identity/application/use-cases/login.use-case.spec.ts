import type {
  AccessTokenService,
  Clock,
  PasswordHasher,
  RefreshTokenService,
  SessionRepository,
  UserCredentialsRepository
} from "../ports";
import { LoginUseCase } from "./login.use-case";

describe("LoginUseCase", () => {
  const user = {
    id: "00000000-0000-4000-8000-000000000010",
    churchId: "00000000-0000-4000-8000-000000000001",
    email: "user@example.com",
    passwordHash: "encoded",
    status: "ACTIVE" as const,
    roles: ["LEADER"]
  };

  it("issues a short access token and a persisted refresh session", async () => {
    const users = userRepository(user);
    const sessions = sessionRepository();
    const passwords = passwordHasher(true);
    const useCase = new LoginUseCase(
      users,
      sessions,
      passwords,
      accessTokenService(),
      refreshTokenService(),
      fixedClock()
    );

    const result = await useCase.execute({
      churchId: user.churchId,
      email: user.email,
      password: "correct-password",
      refreshTtlSeconds: 3600
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: user.churchId,
        userId: user.id,
        tokenHash: "hashed-refresh-token"
      })
    );
  });

  it("uses dummy verification and returns the generic error for an unknown user", async () => {
    const users = userRepository(null);
    const passwords = passwordHasher(false);
    const useCase = new LoginUseCase(
      users,
      sessionRepository(),
      passwords,
      accessTokenService(),
      refreshTokenService(),
      fixedClock()
    );

    await expect(
      useCase.execute({
        churchId: user.churchId,
        email: "missing@example.com",
        password: "wrong-password",
        refreshTtlSeconds: 3600
      })
    ).rejects.toMatchObject({ code: "AUTH_INVALID_CREDENTIALS", status: 401 });
    expect(passwords.dummyVerify).toHaveBeenCalledWith("wrong-password");
  });
});

function userRepository(
  found: typeof user | null
): jest.Mocked<UserCredentialsRepository> {
  return {
    findForLogin: jest.fn().mockResolvedValue(found),
    findById: jest.fn(),
    updatePasswordHash: jest.fn(),
    changePasswordAndRevokeSessions: jest.fn()
  };
}

function sessionRepository(): jest.Mocked<SessionRepository> {
  return {
    create: jest.fn().mockResolvedValue({ id: "session-id" }),
    findByTokenHash: jest.fn(),
    rotate: jest.fn(),
    revokeCurrent: jest.fn(),
    revokeFamily: jest.fn()
  };
}

function passwordHasher(valid: boolean): jest.Mocked<PasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue("new-hash"),
    verify: jest.fn().mockResolvedValue(valid),
    needsRehash: jest.fn().mockReturnValue(false),
    dummyVerify: jest.fn().mockResolvedValue()
  };
}

function accessTokenService(): jest.Mocked<AccessTokenService> {
  return {
    issue: jest
      .fn()
      .mockResolvedValue({ token: "access-token", expiresIn: 600 }),
    verify: jest.fn()
  };
}

function refreshTokenService(): jest.Mocked<RefreshTokenService> {
  return {
    generate: jest.fn().mockReturnValue("refresh-token"),
    hash: jest.fn().mockReturnValue("hashed-refresh-token")
  };
}

function fixedClock(): Clock {
  return { now: () => new Date("2026-07-24T12:00:00.000Z") };
}
