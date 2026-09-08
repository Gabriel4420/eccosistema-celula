import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { PrismaUserPreferencesRepository } from "./prisma-user-preferences.repository";

describe("PrismaUserPreferencesRepository", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const repository = new PrismaUserPreferencesRepository(database);
  const churchId = randomUUID();
  const userId = randomUUID();
  const otherUserId = randomUUID();

  beforeAll(async () => {
    await database.church.create({
      data: {
        id: churchId,
        name: "Preferences Church",
        slug: `prefs-${churchId}`
      }
    });
    await database.user.createMany({
      data: [
        {
          id: userId,
          churchId,
          firstName: "Preferences",
          lastName: "User",
          email: `${userId}@example.test`,
          passwordHash: "integration-only",
          status: "ACTIVE"
        },
        {
          id: otherUserId,
          churchId,
          firstName: "Inactive",
          lastName: "User",
          email: `${otherUserId}@example.test`,
          passwordHash: "integration-only",
          status: "BLOCKED"
        }
      ]
    });
  });

  afterAll(async () => {
    await database.$executeRawUnsafe(
      'DELETE FROM "audit_logs" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "user_preferences" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "users" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" = $1::uuid',
      churchId
    );
    await database.$disconnect();
  });

  it("falls back to documented defaults when no row exists", async () => {
    await expect(
      repository.find(churchId, userId)
    ).resolves.toEqual({
      language: "pt-BR",
      displayTimezone: null,
      dateFormat: "dd/MM/yyyy",
      theme: "system"
    });
  });

  it("does not expose preferences for missing or inactive users", async () => {
    await expect(repository.find(churchId, otherUserId)).resolves.toBeNull();
    await expect(repository.find(churchId, randomUUID())).resolves.toBeNull();
  });

  it("persists preferences and audit atomically inside the unit of work", async () => {
    await repository.execute(churchId, userId, async (transaction) => {
      await transaction.updatePreferences({
        language: "en",
        theme: "dark"
      });
      await transaction.recordAudit({
        actorId: userId,
        action: "USER_PREFERENCES_UPDATED",
        before: { language: "pt-BR", theme: "system" },
        after: { language: "en", theme: "dark" }
      });
    });

    await expect(repository.find(churchId, userId)).resolves.toEqual({
      language: "en",
      displayTimezone: null,
      dateFormat: "dd/MM/yyyy",
      theme: "dark"
    });
    await expect(
      database.auditLog.count({
        where: { churchId, entityId: userId, action: "USER_PREFERENCES_UPDATED" }
      })
    ).resolves.toBe(1);
  });

  it("rolls back preferences and audit on failure", async () => {
    await expect(
      repository.execute(churchId, userId, async (transaction) => {
        await transaction.updatePreferences({ theme: "light" });
        await transaction.recordAudit({
          actorId: userId,
          action: "ROLLBACK_PREFERENCES_TEST",
          before: {},
          after: { theme: "light" }
        });
        throw new Error("force rollback");
      })
    ).rejects.toThrow("force rollback");

    await expect(repository.find(churchId, userId)).resolves.toEqual({
      language: "en",
      displayTimezone: null,
      dateFormat: "dd/MM/yyyy",
      theme: "dark"
    });
    await expect(
      database.auditLog.count({
        where: { churchId, action: "ROLLBACK_PREFERENCES_TEST" }
      })
    ).resolves.toBe(0);
  });

  it("rejects transactions for unknown users", async () => {
    await expect(
      repository.execute(churchId, randomUUID(), async (transaction) =>
        transaction.findPreferences()
      )
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND" });
  });
});

function safeTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || !new URL(value).pathname.toLowerCase().includes("test")) {
    throw new Error("TEST_DATABASE_URL must identify a test database");
  }
  if (process.env.DATABASE_URL === value) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  }
  return value;
}