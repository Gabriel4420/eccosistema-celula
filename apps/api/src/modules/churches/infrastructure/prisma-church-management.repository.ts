import { Inject, Injectable } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { ChurchManagementError } from "../application/church-management.error";
import type {
  ChurchAuditValue,
  ChurchManagementRepository,
  ChurchManagementTransaction,
  ChurchManagementUnitOfWork
} from "../application/church-management.port";
import type {
  ManagedChurch,
  ManagedChurchSettings,
  UpdateChurchInput,
  UpdateChurchSettingsInput
} from "../application/church-management.types";

const DEFAULT_REPORT_DEADLINE_HOURS = 48;

const churchSelect = {
  id: true,
  name: true,
  slug: true,
  email: true,
  phone: true,
  addressLine: true,
  addressNumber: true,
  addressComplement: true,
  neighborhood: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  timezone: true,
  weekStartsOn: true,
  createdAt: true,
  updatedAt: true
} as const;

@Injectable()
export class PrismaChurchManagementRepository
  implements ChurchManagementRepository, ChurchManagementUnitOfWork
{
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient
  ) {}

  async find(churchId: string): Promise<ManagedChurch | null> {
    const church = await this.database.church.findFirst({
      where: { id: churchId, deletedAt: null },
      select: churchSelect
    });
    return church ? mapChurch(church) : null;
  }

  async findSettings(
    churchId: string
  ): Promise<ManagedChurchSettings | null> {
    const church = await this.database.church.findFirst({
      where: { id: churchId, deletedAt: null },
      select: {
        timezone: true,
        weekStartsOn: true,
        churchSettings: { select: { reportDeadlineHours: true } }
      }
    });
    if (!church) return null;
    return mapSettings(church);
  }

  async execute<T>(
    churchId: string,
    work: (transaction: ChurchManagementTransaction) => Promise<T>
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.database.$transaction(
          async (databaseTransaction) => {
            const locked = await databaseTransaction.$queryRaw<
              Array<{ id: string }>
            >`
              SELECT "id"
              FROM "churches"
              WHERE "id" = ${churchId}::uuid AND "deleted_at" IS NULL
              FOR UPDATE
            `;
            if (locked.length !== 1) {
              throw new ChurchManagementError(
                "CHURCH_NOT_FOUND",
                "Church not found"
              );
            }
            return work(
              new PrismaChurchManagementTransaction(
                databaseTransaction,
                churchId
              )
            );
          },
          { isolationLevel: "Serializable" }
        );
      } catch (error) {
        if (isPrismaCode(error, "P2002")) {
          throw new ChurchManagementError(
            "CHURCH_SLUG_CONFLICT",
            "Church slug is already in use"
          );
        }
        if (!isPrismaCode(error, "P2034") || attempt === 3) throw error;
      }
    }
    throw new Error("Serializable transaction retry exhausted");
  }
}

type TransactionClient = Parameters<
  Parameters<RuntimeDatabaseClient["$transaction"]>[0]
>[0];

class PrismaChurchManagementTransaction
  implements ChurchManagementTransaction
{
  constructor(
    private readonly transaction: TransactionClient,
    private readonly churchId: string
  ) {}

  async isActiveAdministrator(userId: string): Promise<boolean> {
    return (
      (await this.transaction.user.count({
        where: {
          id: userId,
          churchId: this.churchId,
          status: "ACTIVE",
          deletedAt: null,
          userRoles: {
            some: {
              churchId: this.churchId,
              deletedAt: null,
              role: { name: "ADMIN", deletedAt: null }
            }
          }
        }
      })) === 1
    );
  }

  async findChurch(): Promise<ManagedChurch> {
    const church = await this.transaction.church.findFirst({
      where: { id: this.churchId, deletedAt: null },
      select: churchSelect
    });
    if (!church) {
      throw new ChurchManagementError("CHURCH_NOT_FOUND", "Church not found");
    }
    return mapChurch(church);
  }

  async findSettings(): Promise<ManagedChurchSettings> {
    const church = await this.transaction.church.findFirst({
      where: { id: this.churchId, deletedAt: null },
      select: {
        timezone: true,
        weekStartsOn: true,
        churchSettings: { select: { reportDeadlineHours: true } }
      }
    });
    if (!church) {
      throw new ChurchManagementError("CHURCH_NOT_FOUND", "Church not found");
    }
    return mapSettings(church);
  }

  async updateInstitutional(
    input: UpdateChurchInput
  ): Promise<ManagedChurch> {
    const church = await this.transaction.church.update({
      where: { id: this.churchId },
      data: input,
      select: churchSelect
    });
    return mapChurch(church);
  }

  async updateSettings(
    input: UpdateChurchSettingsInput
  ): Promise<ManagedChurchSettings> {
    if (input.timezone !== undefined || input.weekStartsOn !== undefined) {
      await this.transaction.church.update({
        where: { id: this.churchId },
        data: {
          timezone: input.timezone,
          weekStartsOn: input.weekStartsOn
        }
      });
    }
    if (input.reportDeadlineHours !== undefined) {
      await this.transaction.churchSettings.upsert({
        where: { churchId: this.churchId },
        create: {
          churchId: this.churchId,
          reportDeadlineHours: input.reportDeadlineHours
        },
        update: {
          reportDeadlineHours: input.reportDeadlineHours
        }
      });
    }
    return this.findSettings();
  }

  async recordAudit(input: {
    actorId: string;
    action: string;
    before: { [key: string]: ChurchAuditValue };
    after: { [key: string]: ChurchAuditValue };
  }): Promise<void> {
    await this.transaction.auditLog.create({
      data: {
        churchId: this.churchId,
        userId: input.actorId,
        entity: "Church",
        entityId: this.churchId,
        action: input.action,
        before: input.before,
        after: input.after
      }
    });
  }
}

function mapChurch(church: {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  timezone: string;
  weekStartsOn:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  createdAt: Date;
  updatedAt: Date;
}): ManagedChurch {
  return { ...church };
}

function mapSettings(church: {
  timezone: string;
  weekStartsOn:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  churchSettings: { reportDeadlineHours: number } | null;
}): ManagedChurchSettings {
  return {
    timezone: church.timezone,
    weekStartsOn: church.weekStartsOn,
    reportDeadlineHours:
      church.churchSettings?.reportDeadlineHours ??
      DEFAULT_REPORT_DEADLINE_HOURS
  };
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

