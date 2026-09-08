import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { PrismaChurchManagementRepository } from "./prisma-church-management.repository";

describe("PrismaChurchManagementRepository", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const repository = new PrismaChurchManagementRepository(database);
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const adminId = randomUUID();
  const adminRoleId = randomUUID();

  beforeAll(async () => {
    await database.church.createMany({
      data: [
        { id: churchId, name: "Church Repository", slug: `church-${churchId}` },
        {
          id: otherChurchId,
          name: "Other Church Repository",
          slug: `other-${otherChurchId}`
        }
      ]
    });
    await database.user.create({
      data: {
        id: adminId,
        churchId,
        firstName: "Repository",
        lastName: "Admin",
        email: `${adminId}@example.test`,
        passwordHash: "integration-only",
        status: "ACTIVE"
      }
    });
    await database.role.create({
      data: { id: adminRoleId, churchId, name: "ADMIN" }
    });
    await database.userRole.create({
      data: { churchId, userId: adminId, roleId: adminRoleId }
    });
  });

  afterAll(async () => {
    await database.$executeRawUnsafe(
      'DELETE FROM "audit_logs" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "user_preferences" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "church_settings" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "user_roles" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "roles" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "users" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$disconnect();
  });

  it("finds only the requested active church", async () => {
    await expect(repository.find(churchId)).resolves.toMatchObject({
      id: churchId,
      country: "BR"
    });
    await expect(repository.findSettings(churchId)).resolves.toEqual({
      timezone: "America/Sao_Paulo",
      weekStartsOn: "SUNDAY",
      reportDeadlineHours: 48
    });
    await expect(repository.find(randomUUID())).resolves.toBeNull();
    await expect(repository.findSettings(randomUUID())).resolves.toBeNull();
  });

  it("persists reportDeadlineHours through the settings transaction", async () => {
    await repository.execute(churchId, async (transaction) => {
      await transaction.updateSettings({ reportDeadlineHours: 72 });
    });

    await expect(repository.findSettings(churchId)).resolves.toMatchObject({
      reportDeadlineHours: 72
    });

    await repository.execute(churchId, async (transaction) => {
      await transaction.updateSettings({ reportDeadlineHours: 48 });
    });
    await expect(repository.findSettings(churchId)).resolves.toMatchObject({
      reportDeadlineHours: 48
    });
  });

  it("persists institutional data and audit atomically", async () => {
    await repository.execute(churchId, async (transaction) => {
      expect(await transaction.isActiveAdministrator(adminId)).toBe(true);
      await transaction.updateInstitutional({
        email: "repository@example.test",
        state: "SP",
        postalCode: "01001000"
      });
      await transaction.recordAudit({
        actorId: adminId,
        action: "CHURCH_CONTACT_UPDATED",
        before: { email: null },
        after: { email: "repository@example.test" }
      });
    });

    await expect(repository.find(churchId)).resolves.toMatchObject({
      email: "repository@example.test",
      state: "SP",
      postalCode: "01001000"
    });
    await expect(
      database.auditLog.count({
        where: {
          churchId,
          entityId: churchId,
          action: "CHURCH_CONTACT_UPDATED"
        }
      })
    ).resolves.toBe(1);
  });

  it("rolls back both church and audit on failure", async () => {
    const before = await repository.find(churchId);
    await expect(
      repository.execute(churchId, async (transaction) => {
        await transaction.updateSettings({ weekStartsOn: "MONDAY" });
        await transaction.recordAudit({
          actorId: adminId,
          action: "ROLLBACK_CHURCH_TEST",
          before: { weekStartsOn: "SUNDAY" },
          after: { weekStartsOn: "MONDAY" }
        });
        throw new Error("force rollback");
      })
    ).rejects.toThrow("force rollback");

    await expect(repository.find(churchId)).resolves.toMatchObject({
      weekStartsOn: before?.weekStartsOn
    });
    await expect(
      database.auditLog.count({
        where: { churchId, action: "ROLLBACK_CHURCH_TEST" }
      })
    ).resolves.toBe(0);
  });

  it("does not expose another church through a transaction", async () => {
    await expect(
      repository.execute(otherChurchId, (transaction) =>
        transaction.isActiveAdministrator(adminId)
      )
    ).resolves.toBe(false);
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

