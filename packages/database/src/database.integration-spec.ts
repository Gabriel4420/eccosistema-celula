import type { PrismaClient } from "./generated/prisma/client.js";
import { createAdminClient } from "./client/admin.js";
import { createRuntimeClient } from "./client/runtime.js";

const churchOneId = "10000000-0000-4000-8000-000000000001";
const churchTwoId = "20000000-0000-4000-8000-000000000002";
const userOneId = "10000000-0000-4000-8000-000000000011";
const roleTwoId = "20000000-0000-4000-8000-000000000022";
const churchSettingsId = "30000000-0000-4000-8000-000000000003";

describe("database foundation", () => {
  let admin: PrismaClient;

  beforeAll(async () => {
    admin = createAdminClient({ DATABASE_URL: process.env.TEST_DATABASE_URL });
    await admin.$executeRawUnsafe(
      'TRUNCATE TABLE "audit_logs", "meeting_reports", "meeting_attendances", "meetings", "cell_memberships", "people", "cells", "supervisor_assignments", "user_roles", "roles", "users" CASCADE'
    );
    await admin.church.deleteMany({
      where: {
        OR: [
          { id: { in: [churchOneId, churchTwoId, churchSettingsId] } },
          {
            slug: {
              in: [
                "ficticia-um",
                "tenant-um",
                "tenant-dois",
                "church-settings-defaults"
              ]
            }
          }
        ]
      }
    });
  });

  afterAll(async () => {
    await admin.$disconnect();
  });

  it("keeps the fictional seed idempotent", async () => {
    await expect(
      admin.church.count({ where: { slug: "igreja-exemplo-ficticia" } })
    ).resolves.toBe(1);
  });

  it("generates UUIDs and timestamps in PostgreSQL", async () => {
    const church = await admin.church.create({
      data: { name: "Fictícia Um", slug: "ficticia-um" }
    });

    expect(church.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(church.createdAt).toBeInstanceOf(Date);
    expect(church.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects duplicate tenant keys and cross-tenant relations", async () => {
    await admin.church.createMany({
      data: [
        { id: churchOneId, name: "Tenant Um", slug: "tenant-um" },
        { id: churchTwoId, name: "Tenant Dois", slug: "tenant-dois" }
      ],
      skipDuplicates: true
    });
    await admin.user.create({
      data: {
        id: userOneId,
        churchId: churchOneId,
        firstName: "Usuário",
        lastName: "Fictício",
        email: "ficticio@example.invalid",
        passwordHash: "not-a-real-hash",
        status: "ACTIVE"
      }
    });
    await admin.role.create({
      data: { id: roleTwoId, churchId: churchTwoId, name: "Papel Fictício" }
    });

    await expect(
      admin.userRole.create({
        data: {
          churchId: churchOneId,
          userId: userOneId,
          roleId: roleTwoId
        }
      })
    ).rejects.toThrow();

    await expect(
      admin.user.create({
        data: {
          churchId: churchOneId,
          firstName: "Outro",
          lastName: "Fictício",
          email: "ficticio@example.invalid",
          passwordHash: "not-a-real-hash",
          status: "ACTIVE"
        }
      })
    ).rejects.toThrow();
  });

  it("enforces checks and the single open membership index", async () => {
    await expect(
      admin.supervisorAssignment.create({
        data: {
          churchId: churchOneId,
          supervisorId: userOneId,
          leaderId: userOneId
        }
      })
    ).rejects.toThrow();

    const cell = await admin.cell.create({
      data: {
        churchId: churchOneId,
        code: "CELL-TEST",
        name: "Célula Fictícia",
        status: "FORMING",
        meetingDay: "MONDAY",
        meetingTime: new Date("1970-01-01T19:00:00.000Z"),
        address: "Endereço fictício"
      }
    });
    const person = await admin.person.create({
      data: { churchId: churchOneId, fullName: "Pessoa Fictícia" }
    });
    await admin.cellMembership.create({
      data: {
        churchId: churchOneId,
        personId: person.id,
        cellId: cell.id,
        status: "ACTIVE",
        joinedAt: new Date()
      }
    });

    await expect(
      admin.cellMembership.create({
        data: {
          churchId: churchOneId,
          personId: person.id,
          cellId: cell.id,
          status: "ACTIVE",
          joinedAt: new Date()
        }
      })
    ).rejects.toThrow();
  });

  it("blocks physical deletion and audit mutation through runtime client", async () => {
    const runtime = createRuntimeClient({
      DATABASE_URL: process.env.TEST_DATABASE_URL
    });

    await expect(runtime.church.deleteMany()).rejects.toThrow(
      "Physical deletion is disabled"
    );
    await expect(runtime.auditLog.updateMany({ data: {} })).rejects.toThrow(
      "AuditLog is append-only"
    );
    await runtime.$disconnect();
  });

  it("creates the explicit partial index and native column types", async () => {
    const indexes = await admin.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'cell_memberships_one_active_per_person_idx',
          'cell_memberships_one_open_per_person_key'
        )
      ORDER BY indexname
    `;
    const columns = await admin.$queryRaw<Array<{ data_type: string }>>`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'meetings'
        AND column_name = 'meeting_date'
    `;

    expect(indexes).toEqual([
      { indexname: "cell_memberships_one_active_per_person_idx" }
    ]);
    expect(columns).toEqual([{ data_type: "date" }]);
  });

  it("backfills and defaults required church settings", async () => {
    const church = await admin.church.create({
      data: {
        id: churchSettingsId,
        name: "Church Settings Defaults",
        slug: "church-settings-defaults"
      }
    });

    expect(church).toMatchObject({
      country: "BR",
      timezone: "America/Sao_Paulo",
      weekStartsOn: "SUNDAY"
    });
  });

  it("enforces institutional normalization constraints in PostgreSQL", async () => {
    await expect(
      admin.church.update({
        where: { id: churchSettingsId },
        data: { phone: "not-e164" }
      })
    ).rejects.toThrow();
    await expect(
      admin.church.update({
        where: { id: churchSettingsId },
        data: { email: "UPPERCASE@EXAMPLE.TEST" }
      })
    ).rejects.toThrow();

    const constraints = await admin.$queryRaw<Array<{ conname: string }>>`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'churches'::regclass
        AND conname IN (
          'churches_slug_format_check',
          'churches_slug_reserved_check',
          'churches_phone_e164_check',
          'churches_postal_code_br_check'
        )
    `;
    expect(constraints).toHaveLength(4);
  });
});
