import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { PrismaUserManagementRepository } from "./prisma-user-management.repository";

describe("PrismaUserManagementRepository", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const repository = new PrismaUserManagementRepository(database);
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const userId = randomUUID();
  const otherUserId = randomUUID();
  const roleId = randomUUID();

  beforeAll(async () => {
    await database.church.createMany({
      data: [
        { id: churchId, name: "Repository Church", slug: `repository-${churchId}` },
        { id: otherChurchId, name: "Other Repository Church", slug: `other-repository-${otherChurchId}` }
      ]
    });
    await database.user.createMany({
      data: [
        {
          id: userId,
          churchId,
          firstName: "Visible",
          lastName: "User",
          email: `${userId}@example.test`,
          passwordHash: "integration-only",
          status: "ACTIVE"
        },
        {
          id: otherUserId,
          churchId: otherChurchId,
          firstName: "Hidden",
          lastName: "User",
          email: `${otherUserId}@example.test`,
          passwordHash: "integration-only",
          status: "ACTIVE"
        }
      ]
    });
    await database.role.create({
      data: { id: roleId, churchId, name: "LEADER" }
    });
    await database.userRole.create({
      data: { churchId, userId, roleId }
    });
  });

  afterAll(async () => {
    await database.$executeRawUnsafe('DELETE FROM "audit_logs" WHERE "church_id" IN ($1::uuid, $2::uuid)', churchId, otherChurchId);
    await database.$executeRawUnsafe('DELETE FROM "user_roles" WHERE "church_id" IN ($1::uuid, $2::uuid)', churchId, otherChurchId);
    await database.$executeRawUnsafe('DELETE FROM "roles" WHERE "church_id" IN ($1::uuid, $2::uuid)', churchId, otherChurchId);
    await database.$executeRawUnsafe('DELETE FROM "users" WHERE "church_id" IN ($1::uuid, $2::uuid)', churchId, otherChurchId);
    await database.$executeRawUnsafe('DELETE FROM "churches" WHERE "id" IN ($1::uuid, $2::uuid)', churchId, otherChurchId);
    await database.$disconnect();
  });

  it("paginates and never returns users from another church", async () => {
    const result = await repository.list(churchId, {
      page: 1,
      pageSize: 20,
      search: "user",
      status: "ACTIVE",
      roleId
    });
    expect(result.items.map((user) => user.id)).toContain(userId);
    expect(result.items.map((user) => user.id)).not.toContain(otherUserId);
  });

  it("searches a full name by tokens and returns consistent metadata", async () => {
    const result = await repository.list(churchId, {
      page: 1,
      pageSize: 1,
      search: "Visible User"
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(userId);
    expect(result.totalItems).toBe(1);
  });

  it("returns null for a user from another church", async () => {
    await expect(repository.find(churchId, otherUserId)).resolves.toBeNull();
  });

  it("rolls back persistence and audit when work fails", async () => {
    await expect(
      repository.execute(churchId, async (transaction) => {
        await transaction.updateStatus({ userId, status: "BLOCKED" });
        await transaction.recordAudit({
          actorId: userId,
          entityId: userId,
          action: "ROLLBACK_TEST"
        });
        throw new Error("force rollback");
      })
    ).rejects.toThrow("force rollback");

    await expect(repository.find(churchId, userId)).resolves.toMatchObject({
      status: "ACTIVE"
    });
    await expect(
      database.auditLog.count({
        where: { churchId, entityId: userId, action: "ROLLBACK_TEST" }
      })
    ).resolves.toBe(0);
  });

  it("soft-deletes and reactivates role relations atomically", async () => {
    await repository.execute(churchId, (transaction) =>
      transaction.replaceRoles({ userId, roleIds: [] })
    );
    await expect(
      database.userRole.findFirst({
        where: { churchId, userId, roleId }
      })
    ).resolves.toMatchObject({ deletedAt: expect.any(Date) });

    const restored = await repository.execute(churchId, (transaction) =>
      transaction.replaceRoles({ userId, roleIds: [roleId] })
    );
    expect(restored.roles).toEqual([{ id: roleId, name: "LEADER" }]);
    await expect(
      database.userRole.findFirst({
        where: { churchId, userId, roleId }
      })
    ).resolves.toMatchObject({ deletedAt: null });
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
