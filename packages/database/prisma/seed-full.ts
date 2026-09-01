/**
 * Seed completo de demonstração do ecossistema de células.
 *
 * Dependências e configuração:
 * - Requer a variável de ambiente DATABASE_URL apontando para um PostgreSQL.
 * - Executar a partir de `packages/database`:
 *     npm run db:seed:full
 *   ou
 *     npx tsx prisma/seed-full.ts
 * - Bibliotecas: `@prisma/adapter-pg`, client Prisma gerado
 *   (`../src/generated/prisma/client.js`) e `argon2` (hash de senha), mesmo
 *   padrão já utilizado nos seeds existentes do projeto.
 *
 * ETAPA 1
 * Preenche as tabelas de domínio sem usuários: churches, roles, people,
 * cells, cell_memberships, meetings, meeting_attendances, meeting_reports e
 * audit_logs. Toda a etapa é idempotente (upsert por chaves naturais ou por id).
 *
 * ETAPA 2
 * Cria exatamente UM usuário — Gabriel Rodrigues — com papel ADMIN (maior
 * nível de privilégio do sistema, sempre vinculado a uma igreja) e o vínculo
 * user_role correspondente. Gabriel não possui célula, liderança, treinamento
 * nem supervisão vinculados.
 *
 * Tabelas intencionalmente vazias:
 * - supervisor_assignments: exige dois usuários (supervisor + líder);
 * - sessions: infraestrutura de autenticação criada apenas no login real;
 * - idempotency_requests: registrada no uso real dos endpoints com
 *   Idempotency-Key.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";

import { PrismaClient } from "../src/generated/prisma/client.js";

const FICTIONAL_CHURCH_ID = "00000000-0000-4000-8000-000000000001";

const ROLE_ADMIN_ID = "10000000-0000-4000-8000-000000000001";
const ROLE_PASTOR_ID = "10000000-0000-4000-8000-000000000002";
const ROLE_SUPERVISOR_ID = "10000000-0000-4000-8000-000000000003";
const ROLE_LEADER_ID = "10000000-0000-4000-8000-000000000004";

const MANAGED_ROLE_NAMES = ["ADMIN", "PASTOR", "SUPERVISOR", "LEADER"] as const;

interface SeedPerson {
  readonly id: string;
  readonly fullName: string;
  readonly phone: string;
  readonly email: string;
  readonly birthDate: string;
  readonly gender: string;
  readonly observations: string;
}

const SEED_PEOPLE: readonly SeedPerson[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    fullName: "Maria Oliveira",
    phone: "+5511987654321",
    email: "maria.oliveira@email.test",
    birthDate: "1990-05-15",
    gender: "Feminino",
    observations: "Membro ativo, atua na recepção aos domingos."
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    fullName: "João Pereira",
    phone: "+5511976543210",
    email: "joao.pereira@email.test",
    birthDate: "1985-11-02",
    gender: "Masculino",
    observations: ""
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    fullName: "Ana Souza",
    phone: "+5511965432109",
    email: "ana.souza@email.test",
    birthDate: "1998-03-21",
    gender: "Feminino",
    observations: ""
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    fullName: "Carlos Lima",
    phone: "+5511954321098",
    email: "carlos.lima@email.test",
    birthDate: "1979-07-19",
    gender: "Masculino",
    observations: "Visitas a novos convertidos às sextas-feiras."
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    fullName: "Fernanda Alves",
    phone: "+5511943210987",
    email: "fernanda.alves@email.test",
    birthDate: "2001-09-30",
    gender: "Feminino",
    observations: ""
  },
  {
    id: "00000000-0000-4000-8000-000000000106",
    fullName: "Rafael Costa",
    phone: "+5511932109876",
    email: "rafael.costa@email.test",
    birthDate: "1993-01-12",
    gender: "Masculino",
    observations: "Coopera com a equipe de som."
  },
  {
    id: "00000000-0000-4000-8000-000000000107",
    fullName: "Juliana Rocha",
    phone: "+5511921098765",
    email: "juliana.rocha@email.test",
    birthDate: "1988-12-08",
    gender: "Feminino",
    observations: ""
  },
  {
    id: "00000000-0000-4000-8000-000000000108",
    fullName: "Pedro Martins",
    phone: "+5511910987654",
    email: "pedro.martins@email.test",
    birthDate: "1975-04-25",
    gender: "Masculino",
    observations: ""
  },
  {
    id: "00000000-0000-4000-8000-000000000109",
    fullName: "Visitante do Espírito Santo",
    phone: "+5511909876543",
    email: "visitante.santo@email.test",
    birthDate: "1992-08-11",
    gender: "Masculino",
    observations: "Visitante convidado a participar da célula Esperança."
  }
];

interface SeedCell {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: "FORMING" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  readonly meetingDay:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  readonly meetingTime: string;
  readonly address: string;
}

// Sem líderes/trainees na Etapa 1: a Etapa 2 cria apenas Gabriel, que não
// possui células, liderança, treinamento ou supervisão vinculados.
const SEED_CELLS: readonly SeedCell[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    code: "CEL-001",
    name: "Célula Esperança",
    status: "FORMING",
    meetingDay: "WEDNESDAY",
    meetingTime: "19:30",
    address: "Rua das Acácias, 120 - Centro"
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    code: "CEL-002",
    name: "Célula Renovação",
    status: "FORMING",
    meetingDay: "TUESDAY",
    meetingTime: "20:00",
    address: "Avenida Brasil, 350 - Jardim América"
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    code: "CEL-003",
    name: "Célula Fidelidade",
    status: "SUSPENDED",
    meetingDay: "THURSDAY",
    meetingTime: "19:00",
    address: "Rua dos Lírios, 77 - Vila Nova"
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    code: "CEL-004",
    name: "Célula Unidade",
    status: "FORMING",
    meetingDay: "FRIDAY",
    meetingTime: "20:30",
    address: "Rua do Bosque, 15 - Bairro Alto"
  },
  {
    id: "00000000-0000-4000-8000-000000000205",
    code: "CEL-005",
    name: "Célula Caminho",
    status: "CLOSED",
    meetingDay: "SATURDAY",
    meetingTime: "18:00",
    address: "Rua das Palmeiras, 200 - Centro"
  }
];

interface SeedMembership {
  readonly id: string;
  readonly personId: string;
  readonly cellId: string;
  readonly status: "ACTIVE" | "INACTIVE" | "TRANSFERRED";
  readonly joinedAt: string;
  readonly leftAt?: string;
}

const SEED_MEMBERSHIPS: readonly SeedMembership[] = [
  { id: "00000000-0000-4000-8000-000000000301", personId: SEED_PEOPLE[0]!.id, cellId: SEED_CELLS[0]!.id, status: "ACTIVE", joinedAt: "2026-01-15" },
  { id: "00000000-0000-4000-8000-000000000302", personId: SEED_PEOPLE[1]!.id, cellId: SEED_CELLS[0]!.id, status: "ACTIVE", joinedAt: "2025-12-03" },
  { id: "00000000-0000-4000-8000-000000000303", personId: SEED_PEOPLE[2]!.id, cellId: SEED_CELLS[1]!.id, status: "ACTIVE", joinedAt: "2026-02-10" },
  { id: "00000000-0000-4000-8000-000000000304", personId: SEED_PEOPLE[3]!.id, cellId: SEED_CELLS[1]!.id, status: "INACTIVE", joinedAt: "2025-08-20", leftAt: "2026-03-01" },
  { id: "00000000-0000-4000-8000-000000000305", personId: SEED_PEOPLE[4]!.id, cellId: SEED_CELLS[2]!.id, status: "ACTIVE", joinedAt: "2025-11-05" },
  { id: "00000000-0000-4000-8000-000000000306", personId: SEED_PEOPLE[5]!.id, cellId: SEED_CELLS[3]!.id, status: "ACTIVE", joinedAt: "2026-01-28" },
  { id: "00000000-0000-4000-8000-000000000307", personId: SEED_PEOPLE[6]!.id, cellId: SEED_CELLS[3]!.id, status: "TRANSFERRED", joinedAt: "2025-09-14", leftAt: "2026-02-20" },
  { id: "00000000-0000-4000-8000-000000000308", personId: SEED_PEOPLE[7]!.id, cellId: SEED_CELLS[4]!.id, status: "INACTIVE", joinedAt: "2025-06-01", leftAt: "2025-12-15" }
];

interface SeedMeeting {
  readonly id: string;
  readonly cellId: string;
  readonly meetingDate: string;
  readonly status: "SCHEDULED" | "COMPLETED" | "CANCELED";
}

const SEED_MEETINGS: readonly SeedMeeting[] = [
  { id: "00000000-0000-4000-8000-000000000401", cellId: SEED_CELLS[0]!.id, meetingDate: "2026-08-05", status: "COMPLETED" },
  { id: "00000000-0000-4000-8000-000000000402", cellId: SEED_CELLS[0]!.id, meetingDate: "2026-08-12", status: "SCHEDULED" },
  { id: "00000000-0000-4000-8000-000000000403", cellId: SEED_CELLS[1]!.id, meetingDate: "2026-08-04", status: "COMPLETED" },
  { id: "00000000-0000-4000-8000-000000000404", cellId: SEED_CELLS[2]!.id, meetingDate: "2026-08-06", status: "CANCELED" },
  { id: "00000000-0000-4000-8000-000000000405", cellId: SEED_CELLS[3]!.id, meetingDate: "2026-08-07", status: "COMPLETED" },
  { id: "00000000-0000-4000-8000-000000000406", cellId: SEED_CELLS[3]!.id, meetingDate: "2026-08-14", status: "SCHEDULED" }
];

interface SeedAttendance {
  readonly id: string;
  readonly meetingId: string;
  readonly personId: string;
  readonly attendanceStatus: "PRESENT" | "ABSENT" | "EXCUSED";
}

const SEED_ATTENDANCES: readonly SeedAttendance[] = [
  { id: "00000000-0000-4000-8000-000000000501", meetingId: SEED_MEETINGS[0]!.id, personId: SEED_PEOPLE[0]!.id, attendanceStatus: "PRESENT" },
  { id: "00000000-0000-4000-8000-000000000502", meetingId: SEED_MEETINGS[0]!.id, personId: SEED_PEOPLE[1]!.id, attendanceStatus: "PRESENT" },
  { id: "00000000-0000-4000-8000-000000000503", meetingId: SEED_MEETINGS[2]!.id, personId: SEED_PEOPLE[2]!.id, attendanceStatus: "PRESENT" },
  { id: "00000000-0000-4000-8000-000000000504", meetingId: SEED_MEETINGS[2]!.id, personId: SEED_PEOPLE[3]!.id, attendanceStatus: "ABSENT" },
  { id: "00000000-0000-4000-8000-000000000505", meetingId: SEED_MEETINGS[4]!.id, personId: SEED_PEOPLE[5]!.id, attendanceStatus: "PRESENT" },
  { id: "00000000-0000-4000-8000-000000000506", meetingId: SEED_MEETINGS[4]!.id, personId: SEED_PEOPLE[6]!.id, attendanceStatus: "EXCUSED" },
  { id: "00000000-0000-4000-8000-000000000507", meetingId: SEED_MEETINGS[0]!.id, personId: SEED_PEOPLE[8]!.id, attendanceStatus: "PRESENT" }
];

// Visitantes de reuniões. Cada visitante possui um MeetingAttendance com
// attendanceStatus PRESENT e um registro MeetingVisitor associado. Visitantes
// não possuem cell_membership: são contabilizados à parte da taxa de presença.
interface SeedVisitor {
  readonly id: string;
  readonly meetingId: string;
  readonly personId: string;
  readonly observation?: string;
}

const SEED_VISITORS: readonly SeedVisitor[] = [
  {
    id: "00000000-0000-4000-8000-000000000801",
    meetingId: SEED_MEETINGS[0]!.id,
    personId: SEED_PEOPLE[8]!.id,
    observation: "Convidado pela célula Esperança."
  }
];

interface SeedReport {
  readonly id: string;
  readonly meetingId: string;
  readonly observations: string;
  readonly status: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "RETURNED" | "CANCELED";
}

// Sem submissor na Etapa 1 (não há usuários): relatórios em rascunho/iniciados.
const SEED_REPORTS: readonly SeedReport[] = [
  { id: "00000000-0000-4000-8000-000000000601", meetingId: SEED_MEETINGS[0]!.id, observations: "Encontro com 2 presentes; estudo de Romanos 12.", status: "DRAFT" },
  { id: "00000000-0000-4000-8000-000000000602", meetingId: SEED_MEETINGS[2]!.id, observations: "", status: "NOT_STARTED" },
  { id: "00000000-0000-4000-8000-000000000603", meetingId: SEED_MEETINGS[4]!.id, observations: "Frequência anotada; nova visita agendada.", status: "DRAFT" }
];

interface SeedAuditLog {
  readonly id: string;
  readonly entity: string;
  readonly entityId: string;
  readonly action: string;
  readonly before?: unknown;
  readonly after?: unknown;
}

// Registros de auditoria sem usuário representam eventos de sistema/seeding.
const SEED_AUDIT_LOGS: readonly SeedAuditLog[] = [
  { id: "00000000-0000-4000-8000-000000000701", entity: "cell", entityId: SEED_CELLS[0]!.id, action: "CELL_CREATED" },
  { id: "00000000-0000-4000-8000-000000000702", entity: "cell", entityId: SEED_CELLS[2]!.id, action: "CELL_STATUS_CHANGED", after: { status: "SUSPENDED" } },
  { id: "00000000-0000-4000-8000-000000000703", entity: "person", entityId: SEED_PEOPLE[0]!.id, action: "PERSON_CREATED" },
  { id: "00000000-0000-4000-8000-000000000704", entity: "meeting", entityId: SEED_MEETINGS[0]!.id, action: "MEETING_CREATED" }
];

const GABRIEL_USER_ID = "90000000-0000-4000-8000-000000000001";
const GABRIEL_PASSWORD = "G@bri&l442018";

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    // ========================================================================
    // ETAPA 1 — Preenchimento das tabelas de domínio (sem usuários)
    // ========================================================================

    // churches
    await prisma.church.upsert({
      where: { slug: "igreja-exemplo-ficticia" },
      create: {
        id: FICTIONAL_CHURCH_ID,
        name: "Igreja Exemplo Fictícia",
        slug: "igreja-exemplo-ficticia",
        email: "contato@igreja-exemplo.test",
        phone: "+5511999999999",
        addressLine: "Rua Exemplo",
        addressNumber: "100",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postalCode: "01001000",
        country: "BR",
        timezone: "America/Sao_Paulo",
        weekStartsOn: "SUNDAY"
      },
      update: {
        name: "Igreja Exemplo Fictícia",
        email: "contato@igreja-exemplo.test",
        phone: "+5511999999999",
        addressLine: "Rua Exemplo",
        addressNumber: "100",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postalCode: "01001000",
        country: "BR",
        timezone: "America/Sao_Paulo",
        weekStartsOn: "SUNDAY"
      }
    });

    // roles
    const roleIdsByKey: Record<string, string> = {
      ADMIN: ROLE_ADMIN_ID,
      PASTOR: ROLE_PASTOR_ID,
      SUPERVISOR: ROLE_SUPERVISOR_ID,
      LEADER: ROLE_LEADER_ID
    };
    for (const roleName of MANAGED_ROLE_NAMES) {
      await prisma.role.upsert({
        where: { churchId_name: { churchId: FICTIONAL_CHURCH_ID, name: roleName } },
        create: {
          id: roleIdsByKey[roleName],
          churchId: FICTIONAL_CHURCH_ID,
          name: roleName
        },
        update: {
          name: roleName
        }
      });
    }

    // people
    for (const person of SEED_PEOPLE) {
      await prisma.person.upsert({
        where: { id: person.id },
        create: {
          id: person.id,
          churchId: FICTIONAL_CHURCH_ID,
          fullName: person.fullName,
          phone: person.phone,
          email: person.email,
          birthDate: new Date(person.birthDate),
          gender: person.gender,
          observations: person.observations
        },
        update: {
          fullName: person.fullName,
          phone: person.phone,
          email: person.email,
          birthDate: new Date(person.birthDate),
          gender: person.gender,
          observations: person.observations
        }
      });
    }

    // cells — sem leaderId/traineeLeaderId nesta etapa
    for (const cell of SEED_CELLS) {
      await prisma.cell.upsert({
        where: { churchId_code: { churchId: FICTIONAL_CHURCH_ID, code: cell.code } },
        create: {
          id: cell.id,
          churchId: FICTIONAL_CHURCH_ID,
          code: cell.code,
          name: cell.name,
          status: cell.status,
          meetingDay: cell.meetingDay,
          meetingTime: new Date(`1970-01-01T${cell.meetingTime}:00`),
          address: cell.address
        },
        update: {
          name: cell.name,
          status: cell.status,
          meetingDay: cell.meetingDay,
          meetingTime: new Date(`1970-01-01T${cell.meetingTime}:00`),
          address: cell.address
        }
      });
    }

    // cell_memberships
    for (const membership of SEED_MEMBERSHIPS) {
      await prisma.cellMembership.upsert({
        where: { id: membership.id },
        create: {
          id: membership.id,
          churchId: FICTIONAL_CHURCH_ID,
          personId: membership.personId,
          cellId: membership.cellId,
          status: membership.status,
          joinedAt: new Date(membership.joinedAt),
          leftAt: membership.leftAt ? new Date(membership.leftAt) : null
        },
        update: {
          personId: membership.personId,
          cellId: membership.cellId,
          status: membership.status,
          joinedAt: new Date(membership.joinedAt),
          leftAt: membership.leftAt ? new Date(membership.leftAt) : null
        }
      });
    }

    // meetings
    for (const meeting of SEED_MEETINGS) {
      await prisma.meeting.upsert({
        where: {
          churchId_cellId_meetingDate: {
            churchId: FICTIONAL_CHURCH_ID,
            cellId: meeting.cellId,
            meetingDate: new Date(meeting.meetingDate)
          }
        },
        create: {
          id: meeting.id,
          churchId: FICTIONAL_CHURCH_ID,
          cellId: meeting.cellId,
          meetingDate: new Date(meeting.meetingDate),
          status: meeting.status
        },
        update: {
          cellId: meeting.cellId,
          meetingDate: new Date(meeting.meetingDate),
          status: meeting.status
        }
      });
    }

    // meeting_attendances
    for (const attendance of SEED_ATTENDANCES) {
      await prisma.meetingAttendance.upsert({
        where: {
          churchId_meetingId_personId: {
            churchId: FICTIONAL_CHURCH_ID,
            meetingId: attendance.meetingId,
            personId: attendance.personId
          }
        },
        create: {
          id: attendance.id,
          churchId: FICTIONAL_CHURCH_ID,
          meetingId: attendance.meetingId,
          personId: attendance.personId,
          attendanceStatus: attendance.attendanceStatus
        },
        update: {
          meetingId: attendance.meetingId,
          personId: attendance.personId,
          attendanceStatus: attendance.attendanceStatus
        }
      });
    }

    // meeting_visitors — visitantes presentes (possuem MeetingAttendance PRESENT)
    for (const visitor of SEED_VISITORS) {
      await prisma.meetingVisitor.upsert({
        where: {
          churchId_meetingId_personId: {
            churchId: FICTIONAL_CHURCH_ID,
            meetingId: visitor.meetingId,
            personId: visitor.personId
          }
        },
        create: {
          id: visitor.id,
          churchId: FICTIONAL_CHURCH_ID,
          meetingId: visitor.meetingId,
          personId: visitor.personId,
          observation: visitor.observation ?? null
        },
        update: {
          meetingId: visitor.meetingId,
          personId: visitor.personId,
          observation: visitor.observation ?? null
        }
      });
    }

    // meeting_reports — sem submittedBy nesta etapa
    for (const report of SEED_REPORTS) {
      await prisma.meetingReport.upsert({
        where: {
          meetingId_churchId: { meetingId: report.meetingId, churchId: FICTIONAL_CHURCH_ID }
        },
        create: {
          id: report.id,
          churchId: FICTIONAL_CHURCH_ID,
          meetingId: report.meetingId,
          observations: report.observations,
          status: report.status
        },
        update: {
          observations: report.observations,
          status: report.status
        }
      });
    }

    // audit_logs
    for (const auditLog of SEED_AUDIT_LOGS) {
      await prisma.auditLog.upsert({
        where: { id: auditLog.id },
        create: {
          id: auditLog.id,
          churchId: FICTIONAL_CHURCH_ID,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          action: auditLog.action,
          before: auditLog.before as never,
          after: auditLog.after as never
        },
        update: {
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          action: auditLog.action,
          before: auditLog.before as never,
          after: auditLog.after as never
        }
      });
    }

    console.info(
      "ETAPA 1 concluída: igreja, papéis, pessoas, células, membros, encontros, frequências, visitantes, relatórios e auditoria criados."
    );

    // ========================================================================
    // ETAPA 2 — Criação do usuário único Gabriel Rodrigues
    // ========================================================================
    //
    // Único usuário criado pelo seed. Gabriel tem o papel ADMIN (maior nível
    // de privilégio do sistema, sempre vinculado a uma igreja) e NÃO possui
    // igreja própria, célula, liderança, treinamento ou supervisão vinculados.

    const passwordHash = await hash(GABRIEL_PASSWORD);

    await prisma.user.upsert({
      where: { churchId_email: { churchId: FICTIONAL_CHURCH_ID, email: "gabriel.rodrigues@eccosistema.test" } },
      create: {
        id: GABRIEL_USER_ID,
        churchId: FICTIONAL_CHURCH_ID,
        firstName: "Gabriel",
        lastName: "Rodrigues",
        email: "gabriel.rodrigues@eccosistema.test",
        passwordHash,
        status: "ACTIVE"
      },
      update: {
        firstName: "Gabriel",
        lastName: "Rodrigues",
        passwordHash,
        status: "ACTIVE"
      }
    });

    await prisma.userRole.upsert({
      where: {
        churchId_userId_roleId: {
          churchId: FICTIONAL_CHURCH_ID,
          userId: GABRIEL_USER_ID,
          roleId: ROLE_ADMIN_ID
        }
      },
      create: {
        churchId: FICTIONAL_CHURCH_ID,
        userId: GABRIEL_USER_ID,
        roleId: ROLE_ADMIN_ID
      },
      update: {
        roleId: ROLE_ADMIN_ID
      }
    });

    console.info(
      "ETAPA 2 concluída: usuário Gabriel Rodrigues criado (papel ADMIN, sem igreja própria, sem células vinculadas)."
    );
    console.info("Seed completo aplicado com sucesso.");
  } finally {
    await prisma.$disconnect();
  }
}

void seed().catch((error: unknown) => {
  console.error("Falha ao aplicar a seed completa:", error);
  process.exitCode = 1;
});
