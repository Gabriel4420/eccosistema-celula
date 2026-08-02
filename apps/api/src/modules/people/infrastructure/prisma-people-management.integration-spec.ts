import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { PrismaPeopleManagementRepository } from "./prisma-people-management.repository";

describe("PrismaPeopleManagementRepository", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const churchId = randomUUID();
  const actorId = randomUUID();
  const otherChurchId = randomUUID();
  const repository = new PrismaPeopleManagementRepository(database);

  beforeAll(async () => {
    await database.church.create({ data: { id: churchId, name: "People Repository", slug: `people-repo-${churchId}` } });
    await database.church.create({ data: { id: otherChurchId, name: "Other People Repository", slug: `people-repo-${otherChurchId}` } });
    await database.user.create({ data: {
      id: actorId, churchId, firstName: "Test", lastName: "Actor",
      email: `${actorId}@example.test`, passwordHash: "integration-only-not-a-real-password-hash",
      status: "ACTIVE"
    } });
  });

  afterAll(async () => {
    await database.$executeRaw`DELETE FROM "audit_logs" WHERE "church_id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "people" WHERE "church_id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "users" WHERE "church_id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "people" WHERE "church_id" = ${otherChurchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${otherChurchId}::uuid`;
    await database.$disconnect();
  });

  it("persists person and audit atomically and supports paging", async () => {
    const id = await repository.execute(churchId, async (transaction) => {
      const person = await transaction.createPerson({
        fullName: "Pessoa Integração", phone: "+5511999999999",
        email: "pessoa@example.test", birthDate: "2000-01-01", gender: null,
        observations: "restrita"
      });
      await transaction.recordAudit({ actorId, entityId: person.id, action: "PERSON_CREATED", after: { status: "ACTIVE" } });
      return person.id;
    });
    await expect(repository.find(churchId, id)).resolves.toMatchObject({ id, churchId });
    const page = await repository.list(churchId, { page: 1, pageSize: 20, status: "ACTIVE", search: "Integração" });
    expect(page.items).toHaveLength(1);
    expect(await database.auditLog.count({ where: { churchId, entityId: id } })).toBe(1);
  });

  it("isolates tenants and keeps deterministic paging and status filters", async () => {
    const other = await database.person.create({ data: { churchId: otherChurchId, fullName: "Pessoa Outra Igreja" } });
    const first = await database.person.create({ data: { churchId, fullName: "Ana Ordenada", gender: "F" } });
    const second = await database.person.create({ data: { churchId, fullName: "Zoe Ordenada", gender: "F", deletedAt: new Date() } });

    await expect(repository.find(churchId, other.id)).resolves.toBeNull();
    const active = await repository.list(churchId, { page: 1, pageSize: 20, status: "ACTIVE", gender: "f", search: "Ordenada" });
    expect(active.items.map(({ id }) => id)).toContain(first.id);
    expect(active.items.map(({ id }) => id)).not.toContain(second.id);
    expect(active.items.map(({ id }) => id)).not.toContain(other.id);
    const inactive = await repository.list(churchId, { page: 1, pageSize: 1, status: "INACTIVE" });
    expect(inactive.items).toHaveLength(1);
    expect(inactive.items[0]?.id).toBe(second.id);
  });

  it("rolls back person persistence when audit fails", async () => {
    const fullName = `Rollback ${randomUUID()}`;
    await expect(repository.execute(churchId, async (transaction) => {
      await transaction.createPerson({ fullName, phone: null, email: null, birthDate: null, gender: null, observations: null });
      throw new Error("forced audit failure");
    })).rejects.toThrow("forced audit failure");
    await expect(database.person.count({ where: { churchId, fullName } })).resolves.toBe(0);
  });

  it("serializes duplicate detection under concurrent writes", async () => {
    const email = `${randomUUID()}@example.test`;
    const create = () => repository.execute(churchId, async (transaction) => {
      const duplicates = await transaction.findDuplicates({ fullName: "Concorrente", phone: null, email, birthDate: null, gender: null, observations: null });
      if (duplicates.email) throw new Error("duplicate");
      return transaction.createPerson({ fullName: "Concorrente", phone: null, email, birthDate: null, gender: null, observations: null });
    });
    const results = await Promise.allSettled([create(), create()]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    await expect(database.person.count({ where: { churchId, email } })).resolves.toBe(1);
  });

  it("installs the three trigram indexes and observations column", async () => {
    const indexes = await database.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname IN (
        'people_full_name_trgm_idx', 'people_phone_trgm_idx', 'people_email_trgm_idx'
      ) ORDER BY indexname
    `;
    expect(indexes.map(({ indexname }) => indexname)).toEqual([
      "people_email_trgm_idx", "people_full_name_trgm_idx", "people_phone_trgm_idx"
    ]);
    const columns = await database.$queryRaw<Array<{ data_type: string }>>`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'people' AND column_name = 'observations'
    `;
    expect(columns).toEqual([{ data_type: "text" }]);
  });
});

function safeTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || !new URL(value).pathname.toLowerCase().includes("test")) throw new Error("TEST_DATABASE_URL must identify a test database");
  if (process.env.DATABASE_URL === value) throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  return value;
}
