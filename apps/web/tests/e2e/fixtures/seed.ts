import { createRuntimeClient } from "@mission-atos/database";
import { hash } from "argon2";

const E2E_CHURCH_ID = "11111111-1111-4111-8111-111111111111";
const E2E_PERSON_ID = "11111111-1111-4111-8111-111111111121";
const E2E_MEETING_ID = "11111111-1111-4111-8111-111111111131";
export const E2E_PASSWORD = "e2e-password-1234";

const MANAGED_ROLE_NAMES = ["ADMIN", "PASTOR", "SUPERVISOR", "LEADER"] as const;

interface SeedUser {
  readonly key: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly roleNames: readonly string[];
}

const SEED_USERS: readonly SeedUser[] = [
  { key: "admin", email: "admin@e2e.test", firstName: "Alice", lastName: "Admin", roleNames: ["ADMIN"] },
  { key: "pastor", email: "pastor@e2e.test", firstName: "Paulo", lastName: "Pastor", roleNames: ["PASTOR"] },
  { key: "supervisor", email: "supervisor@e2e.test", firstName: "Sofia", lastName: "Supervisora", roleNames: ["SUPERVISOR"] },
  { key: "leader", email: "leader@e2e.test", firstName: "Lucas", lastName: "Líder", roleNames: ["LEADER"] }
];

function requiredTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || !new URL(value).pathname.toLowerCase().includes("test")) {
    throw new Error("TEST_DATABASE_URL must identify a test database");
  }
  return value;
}

export async function seedDatabase(): Promise<void> {
  const databaseUrl = requiredTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });

  try {
    for (const table of ["idempotency_requests", "meeting_visitors", "meeting_attendances", "meeting_reports", "meetings", "cell_memberships"]) {
      await database.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "church_id" = $1::uuid`, E2E_CHURCH_ID);
    }
    await database.$executeRawUnsafe(
      'DELETE FROM "sessions" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "audit_logs" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "cells" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "supervisor_assignments" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "people" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "user_roles" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "roles" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "users" WHERE "church_id" = $1::uuid',
      E2E_CHURCH_ID
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" = $1::uuid',
      E2E_CHURCH_ID
    );

    await database.church.create({
      data: {
        id: E2E_CHURCH_ID,
        name: "Igreja E2E Fictícia",
        slug: "igreja-e2e-ficticia",
        email: "contato@igreja-e2e.test",
        phone: "+5511988888888",
        addressLine: "Av. Fictícia",
        addressNumber: "200",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postalCode: "01001000",
        country: "BR",
        timezone: "America/Sao_Paulo",
        weekStartsOn: "SUNDAY"
      }
    });

    const passwordHash = await hash(E2E_PASSWORD);
    const roles = new Map<string, string>();

    for (const roleName of MANAGED_ROLE_NAMES) {
      const role = await database.role.create({
        data: { churchId: E2E_CHURCH_ID, name: roleName }
      });
      roles.set(roleName, role.id);
    }

    for (const user of SEED_USERS) {
      const created = await database.user.create({
        data: {
          churchId: E2E_CHURCH_ID,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          passwordHash,
          status: "ACTIVE"
        }
      });
      for (const roleName of user.roleNames) {
        const roleId = roles.get(roleName);
        if (!roleId) throw new Error(`Missing role ${roleName}`);
        await database.userRole.create({
          data: { churchId: E2E_CHURCH_ID, userId: created.id, roleId }
        });
      }
    }

    const userByKey = new Map<string, { id: string; firstName: string; lastName: string }>();
    for (const user of SEED_USERS) {
      const created = await database.user.findUniqueOrThrow({
        where: { churchId_email: { churchId: E2E_CHURCH_ID, email: user.email } },
        select: { id: true, firstName: true, lastName: true }
      });
      userByKey.set(user.key, created);
    }

    const leader = userByKey.get("leader");
    const supervisor = userByKey.get("supervisor");
    if (!leader || !supervisor) throw new Error("Missing leader/supervisor seed users");

    await database.supervisorAssignment.create({
      data: {
        churchId: E2E_CHURCH_ID,
        supervisorId: supervisor.id,
        leaderId: leader.id
      }
    });

    const cell = await database.cell.create({
      data: {
        churchId: E2E_CHURCH_ID,
        code: "CEL-E2E-001",
        name: "Célula E2E Esperança",
        status: "ACTIVE",
        leaderId: leader.id,
        meetingDay: "WEDNESDAY",
        meetingTime: new Date("1970-01-01T19:30:00"),
        address: "Rua das Flores, 10 - Centro"
      }
    });

    const activePerson = await database.person.create({
      data: {
        id: E2E_PERSON_ID,
        churchId: E2E_CHURCH_ID,
        fullName: "Maria E2E Ativa",
        phone: "+5511990000001",
        email: "maria-ativa@e2e.test",
        birthDate: new Date("1990-05-15"),
        gender: "Feminino",
        observations: "Observação fictícia visível para ADMIN e PASTOR."
      }
    });
    await database.person.create({
      data: {
        churchId: E2E_CHURCH_ID,
        fullName: "João E2E Inativo",
        phone: "+5511990000002",
        deletedAt: new Date()
      }
    });

    await database.cellMembership.create({
      data: { churchId: E2E_CHURCH_ID, cellId: cell.id, personId: activePerson.id, status: "ACTIVE", joinedAt: new Date("2026-01-01T03:00:00Z") }
    });
    await database.meeting.create({
      data: { id: E2E_MEETING_ID, churchId: E2E_CHURCH_ID, cellId: cell.id, meetingDate: new Date("2026-08-22"), status: "SCHEDULED" }
    });

    console.info(
      `Seed E2E aplicada: igreja ${E2E_CHURCH_ID}, papéis ${MANAGED_ROLE_NAMES.join(", ")} e usuários ${SEED_USERS.map((item) => item.email).join(", ")}.`
    );
  } finally {
    await database.$disconnect();
  }
}

const isMainModule = process.argv[1]?.replace(/\\/g, "/").endsWith("fixtures/seed.ts");
if (isMainModule) {
  void seedDatabase().catch((error: unknown) => {
    console.error("Falha ao aplicar a seed E2E:", error);
    process.exitCode = 1;
  });
}
