import { randomUUID } from "node:crypto";

import { createAdminClient } from "../client/admin";
import type { PrismaClient } from "../generated/prisma/client.js";
import {
  bootstrapProduction,
  parseProductionBootstrapEnvironment
} from "./production-bootstrap";

describe("production bootstrap", () => {
  let database: PrismaClient;
  const churchId = randomUUID();
  const slug = "bootstrap-" + churchId;
  const email = churchId + "@bootstrap.test";

  beforeAll(() => {
    database = createAdminClient({ DATABASE_URL: process.env.TEST_DATABASE_URL });
  });

  afterAll(async () => {
    await database.auditLog.deleteMany({ where: { churchId } });
    await database.userRole.deleteMany({ where: { churchId } });
    await database.role.deleteMany({ where: { churchId } });
    await database.user.deleteMany({ where: { churchId } });
    await database.church.deleteMany({ where: { id: churchId } });
    await database.$disconnect();
  });

  it("creates the initial tenant and administrator exactly once", async () => {
    const environment = parseProductionBootstrapEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      AUTH_CHURCH_ID: churchId,
      BOOTSTRAP_CONFIRM: "CREATE_INITIAL_ADMIN",
      BOOTSTRAP_CHURCH_NAME: "Bootstrap Integration",
      BOOTSTRAP_CHURCH_SLUG: slug,
      BOOTSTRAP_ADMIN_FIRST_NAME: "Initial",
      BOOTSTRAP_ADMIN_LAST_NAME: "Administrator",
      BOOTSTRAP_ADMIN_EMAIL: email,
      BOOTSTRAP_ADMIN_PASSWORD: "integration-password-123"
    });
    const hashPassword = jest.fn(async () => "$argon2id$bootstrap-test-hash");

    await expect(
      bootstrapProduction(database, environment, hashPassword)
    ).resolves.toMatchObject({ churchId, changed: true });
    await expect(
      bootstrapProduction(database, environment, hashPassword)
    ).resolves.toMatchObject({ churchId, changed: false });

    await expect(database.church.count({ where: { id: churchId } })).resolves.toBe(1);
    await expect(database.role.count({ where: { churchId, deletedAt: null } })).resolves.toBe(4);
    await expect(database.user.count({ where: { churchId, email } })).resolves.toBe(1);
    await expect(database.userRole.count({ where: { churchId, deletedAt: null } })).resolves.toBe(1);
    await expect(
      database.auditLog.count({
        where: { churchId, action: "PRODUCTION_BOOTSTRAP_COMPLETED" }
      })
    ).resolves.toBe(1);
    expect(hashPassword).toHaveBeenCalledTimes(1);
  });
});
