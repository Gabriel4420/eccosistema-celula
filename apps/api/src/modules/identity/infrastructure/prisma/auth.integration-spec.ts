import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { PrismaSessionRepository } from "./prisma-session.repository";

describe("authentication persistence", () => {
  const urls = safeTestUrls();
  const database = createRuntimeClient({ DATABASE_URL: urls.test });
  const repository = new PrismaSessionRepository(database);
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const userId = randomUUID();

  beforeAll(async () => {
    await database.church.createMany({
      data: [
        { id: churchId, name: "Auth Test Church", slug: `auth-${churchId}` },
        {
          id: otherChurchId,
          name: "Other Auth Test Church",
          slug: `auth-${otherChurchId}`
        }
      ]
    });
    await database.user.create({
      data: {
        id: userId,
        churchId,
        firstName: "Test",
        lastName: "User",
        email: `${userId}@example.test`,
        passwordHash: "test-only-not-an-authenticated-fixture",
        status: "ACTIVE"
      }
    });
  });

  afterAll(async () => {
    await database.$executeRawUnsafe(
      'DELETE FROM "sessions" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "users" WHERE "id" = $1::uuid',
      userId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$disconnect();
  });

  it("rejects a session that crosses churches", async () => {
    await expect(
      repository.create({
        churchId: otherChurchId,
        userId,
        tokenHash: "a".repeat(64),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 60_000)
      })
    ).rejects.toBeDefined();
  });

  it("allows only one concurrent rotation", async () => {
    const familyId = randomUUID();
    const created = await repository.create({
      churchId,
      userId,
      tokenHash: "b".repeat(64),
      familyId,
      expiresAt: new Date(Date.now() + 60_000)
    });
    const session = await repository.findByTokenHash("b".repeat(64));
    expect(session).not.toBeNull();
    if (!session) return;
    const now = new Date();
    const results = await Promise.all([
      repository.rotate({
        session,
        tokenHash: "c".repeat(64),
        successorId: randomUUID(),
        expiresAt: new Date(now.getTime() + 60_000),
        occurredAt: now
      }),
      repository.rotate({
        session,
        tokenHash: "d".repeat(64),
        successorId: randomUUID(),
        expiresAt: new Date(now.getTime() + 60_000),
        occurredAt: now
      })
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(created.id).toBe(session.id);
  });
});

function safeTestUrls(): { test: string } {
  const test = process.env.TEST_DATABASE_URL;
  const development = process.env.DATABASE_URL;
  if (!test || !new URL(test).pathname.toLowerCase().includes("test")) {
    throw new Error("TEST_DATABASE_URL must identify a test database");
  }
  if (development && development === test) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  }
  return { test };
}
