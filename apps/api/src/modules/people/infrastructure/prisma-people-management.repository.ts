import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { PeopleManagementError } from "../application/people-management.error";
import type {
  DuplicateFields,
  PeopleManagementRepository,
  PeopleManagementTransaction,
  PeopleManagementUnitOfWork
} from "../application/people-management.port";
import type {
  ListPeopleInput,
  ManagedPerson,
  PersonPage,
  PersonPatchInput,
  PersonWriteInput
} from "../application/people-management.types";

const personSelect = {
  id: true,
  churchId: true,
  fullName: true,
  phone: true,
  email: true,
  birthDate: true,
  gender: true,
  observations: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

@Injectable()
export class PrismaPeopleManagementRepository
  implements PeopleManagementRepository, PeopleManagementUnitOfWork
{
  private readonly logger = new Logger(PrismaPeopleManagementRepository.name);

  constructor(@Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient) {}

  async list(churchId: string, input: ListPeopleInput): Promise<PersonPage> {
    const startedAt = Date.now();
    const terms = input.search?.split(/\s+/).filter(Boolean) ?? [];
    const where = {
      churchId,
      deletedAt: input.status === "ACTIVE" ? null : { not: null },
      ...(input.gender ? { gender: { equals: input.gender, mode: "insensitive" as const } } : {}),
      ...(terms.length ? {
        AND: terms.map((term) => ({
          OR: [
            { fullName: { contains: term, mode: "insensitive" as const } },
            { email: { contains: term.toLowerCase(), mode: "insensitive" as const } },
            { phone: { contains: term, mode: "insensitive" as const } }
          ]
        }))
      } : {})
    };
    const [items, totalItems] = await this.database.$transaction([
      this.database.person.findMany({
        where,
        select: personSelect,
        orderBy: [{ fullName: "asc" }, { id: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.database.person.count({ where })
    ], { isolationLevel: "RepeatableRead" });
    this.logger.log(JSON.stringify({ operation: "people.list", result: "success", durationMs: Date.now() - startedAt, itemCount: items.length }));
    return { items: items.map(mapPerson), totalItems };
  }

  async find(churchId: string, personId: string): Promise<ManagedPerson | null> {
    const person = await this.database.person.findFirst({
      where: { id: personId, churchId, deletedAt: null },
      select: personSelect
    });
    return person ? mapPerson(person) : null;
  }

  async execute<T>(
    churchId: string,
    work: (transaction: PeopleManagementTransaction) => Promise<T>
  ): Promise<T> {
    const startedAt = Date.now();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const result = await this.database.$transaction(async (databaseTransaction) => {
          const locked = await databaseTransaction.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "churches"
            WHERE "id" = ${churchId}::uuid AND "deleted_at" IS NULL
            FOR UPDATE
          `;
          if (locked.length !== 1) {
            throw new PeopleManagementError("PERSON_NOT_FOUND", "Person not found");
          }
          return work(new PrismaPeopleManagementTransaction(databaseTransaction, churchId));
        }, { isolationLevel: "Serializable" });
        this.logger.log(JSON.stringify({ operation: "people.transaction", result: "success", durationMs: Date.now() - startedAt, attempt }));
        return result;
      } catch (error) {
        if (!isPrismaCode(error, "P2034") || attempt === 3) {
          this.logger.error(JSON.stringify({ operation: "people.transaction", result: "rollback", durationMs: Date.now() - startedAt, attempt }));
          throw error;
        }
        this.logger.warn(JSON.stringify({ operation: "people.transaction", result: "retry", attempt }));
      }
    }
    throw new Error("Serializable transaction retry exhausted");
  }
}

type TransactionClient = Parameters<Parameters<RuntimeDatabaseClient["$transaction"]>[0]>[0];

class PrismaPeopleManagementTransaction implements PeopleManagementTransaction {
  constructor(
    private readonly transaction: TransactionClient,
    private readonly churchId: string
  ) {}

  async hasActiveRole(userId: string, roles: readonly string[]): Promise<boolean> {
    return (await this.transaction.user.count({
      where: {
        id: userId,
        churchId: this.churchId,
        status: "ACTIVE",
        deletedAt: null,
        userRoles: { some: {
          churchId: this.churchId,
          deletedAt: null,
          role: { name: { in: [...roles] }, deletedAt: null }
        } }
      }
    })) === 1;
  }

  async findPerson(personId: string, includeInactive = false): Promise<ManagedPerson | null> {
    const person = await this.transaction.person.findFirst({
      where: {
        id: personId,
        churchId: this.churchId,
        ...(!includeInactive ? { deletedAt: null } : {})
      },
      select: personSelect
    });
    return person ? mapPerson(person) : null;
  }

  async findDuplicates(input: PersonWriteInput, excludeId?: string): Promise<DuplicateFields> {
    const base = {
      churchId: this.churchId,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {})
    };
    const [phone, email, nameAndBirthDate] = await Promise.all([
      input.phone ? this.transaction.person.count({ where: { ...base, phone: input.phone } }) : 0,
      input.email ? this.transaction.person.count({ where: { ...base, email: input.email } }) : 0,
      input.birthDate ? this.transaction.person.count({ where: {
        ...base,
        fullName: { equals: input.fullName, mode: "insensitive" },
        birthDate: parseDate(input.birthDate)
      } }) : 0
    ]);
    return { phone: phone > 0, email: email > 0, nameAndBirthDate: nameAndBirthDate > 0 };
  }

  async findCellByCode(code: string): Promise<{ id: string } | null> {
    const cell = await this.transaction.cell.findFirst({
      where: { churchId: this.churchId, code, deletedAt: null },
      select: { id: true }
    });
    return cell ?? null;
  }

  async createCellMembership(input: { personId: string; cellId: string }): Promise<void> {
    await this.transaction.cellMembership.create({
      data: {
        churchId: this.churchId,
        personId: input.personId,
        cellId: input.cellId,
        status: "ACTIVE",
        joinedAt: new Date()
      }
    });
  }

  async createPerson(input: PersonWriteInput): Promise<ManagedPerson> {
    return mapPerson(await this.transaction.person.create({
      data: {
        churchId: this.churchId,
        ...toPersistence(input)
      },
      select: personSelect
    }));
  }

  async updatePerson(personId: string, input: PersonPatchInput): Promise<ManagedPerson> {
    await this.requirePerson(personId, false);
    const data = {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate ? parseDate(input.birthDate) : null } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.observations !== undefined ? { observations: input.observations } : {})
    };
    return mapPerson(await this.transaction.person.update({
      where: { id_churchId: { id: personId, churchId: this.churchId } },
      data,
      select: personSelect
    }));
  }

  async setDeletedAt(personId: string, deletedAt: Date | null): Promise<ManagedPerson> {
    await this.requirePerson(personId, true);
    return mapPerson(await this.transaction.person.update({
      where: { id_churchId: { id: personId, churchId: this.churchId } },
      data: { deletedAt },
      select: personSelect
    }));
  }

  async recordAudit(input: {
    actorId: string;
    entityId: string;
    action: string;
    before?: Record<string, string | string[] | null>;
    after?: Record<string, string | string[] | null>;
  }): Promise<void> {
    await this.transaction.auditLog.create({
      data: {
        churchId: this.churchId,
        userId: input.actorId,
        entity: "Person",
        entityId: input.entityId,
        action: input.action,
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {})
      }
    });
  }

  private async requirePerson(id: string, includeInactive: boolean): Promise<ManagedPerson> {
    const person = await this.findPerson(id, includeInactive);
    if (!person) throw new PeopleManagementError("PERSON_NOT_FOUND", "Person not found");
    return person;
  }
}

function toPersistence(input: PersonWriteInput) {
  return {
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    birthDate: input.birthDate ? parseDate(input.birthDate) : null,
    gender: input.gender,
    observations: input.observations
  };
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapPerson(person: {
  id: string; churchId: string; fullName: string; phone: string | null;
  email: string | null; birthDate: Date | null; gender: string | null;
  observations: string | null; deletedAt: Date | null;
  createdAt: Date; updatedAt: Date;
}): ManagedPerson {
  return { ...person };
}

function isPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
