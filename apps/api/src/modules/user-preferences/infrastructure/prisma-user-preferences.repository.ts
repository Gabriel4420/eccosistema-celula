import { Inject, Injectable } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { UserPreferencesError } from "../application/user-preferences.error";
import type {
  PreferencesAuditValue,
  UserPreferencesRepository,
  UserPreferencesTransaction,
  UserPreferencesUnitOfWork
} from "../application/user-preferences.port";
import type {
  ManagedUserPreferences,
  UpdateOwnPreferencesInput
} from "../application/user-preferences.types";

const DEFAULT_LANGUAGE = "pt-BR";
const DEFAULT_DATE_FORMAT = "dd/MM/yyyy";
const DEFAULT_THEME = "system";

@Injectable()
export class PrismaUserPreferencesRepository
  implements UserPreferencesRepository, UserPreferencesUnitOfWork
{
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient
  ) {}

  async find(
    churchId: string,
    userId: string
  ): Promise<ManagedUserPreferences | null> {
    const user = await this.database.user.findFirst({
      where: { id: userId, churchId, status: "ACTIVE", deletedAt: null },
      select: preferencesSelect
    });
    if (!user) return null;
    return mapPreferences(user);
  }

  async execute<T>(
    churchId: string,
    userId: string,
    work: (transaction: UserPreferencesTransaction) => Promise<T>
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.database.$transaction(
          async (databaseTransaction) => {
            const locked = await databaseTransaction.$queryRaw<
              Array<{ id: string }>
            >`
              SELECT "id"
              FROM "users"
              WHERE "id" = ${userId}::uuid
                AND "church_id" = ${churchId}::uuid
                AND "status" = 'ACTIVE'
                AND "deleted_at" IS NULL
              FOR UPDATE
            `;
            if (locked.length !== 1) {
              throw new UserPreferencesError(
                "USER_NOT_FOUND",
                "User not found"
              );
            }
            return work(
              new PrismaUserPreferencesTransaction(
                databaseTransaction,
                churchId,
                userId
              )
            );
          },
          { isolationLevel: "Serializable" }
        );
      } catch (error) {
        if (!isPrismaCode(error, "P2034") || attempt === 3) throw error;
      }
    }
    throw new Error("Serializable transaction retry exhausted");
  }
}

const preferencesSelect = {
  preferences: {
    select: {
      language: true,
      displayTimezone: true,
      dateFormat: true,
      theme: true
    }
  }
} as const;

type TransactionClient = Parameters<
  Parameters<RuntimeDatabaseClient["$transaction"]>[0]
>[0];

class PrismaUserPreferencesTransaction implements UserPreferencesTransaction {
  constructor(
    private readonly transaction: TransactionClient,
    private readonly churchId: string,
    private readonly userId: string
  ) {}

  async findPreferences(): Promise<ManagedUserPreferences> {
    const user = await this.transaction.user.findFirst({
      where: { id: this.userId, churchId: this.churchId, deletedAt: null },
      select: preferencesSelect
    });
    if (!user) {
      throw new UserPreferencesError("USER_NOT_FOUND", "User not found");
    }
    return mapPreferences(user);
  }

  async updatePreferences(
    input: UpdateOwnPreferencesInput
  ): Promise<ManagedUserPreferences> {
    const hasChanges =
      input.language !== undefined ||
      input.displayTimezone !== undefined ||
      input.dateFormat !== undefined ||
      input.theme !== undefined;
    if (hasChanges) {
      await this.transaction.userPreferences.upsert({
        where: { userId: this.userId },
        create: {
          userId: this.userId,
          churchId: this.churchId,
          language: input.language ?? DEFAULT_LANGUAGE,
          displayTimezone: input.displayTimezone ?? null,
          dateFormat: input.dateFormat ?? DEFAULT_DATE_FORMAT,
          theme: input.theme ?? DEFAULT_THEME
        },
        update: {
          language: input.language,
          displayTimezone: input.displayTimezone,
          dateFormat: input.dateFormat,
          theme: input.theme
        }
      });
    }
    return this.findPreferences();
  }

  async recordAudit(input: {
    actorId: string;
    action: string;
    before: { [key: string]: PreferencesAuditValue };
    after: { [key: string]: PreferencesAuditValue };
  }): Promise<void> {
    await this.transaction.auditLog.create({
      data: {
        churchId: this.churchId,
        userId: input.actorId,
        entity: "UserPreferences",
        entityId: this.userId,
        action: input.action,
        before: input.before,
        after: input.after
      }
    });
  }
}

function mapPreferences(user: {
  preferences: {
    language: string;
    displayTimezone: string | null;
    dateFormat: string;
    theme: string;
  } | null;
}): ManagedUserPreferences {
  return {
    language: (user.preferences?.language ?? DEFAULT_LANGUAGE) as ManagedUserPreferences["language"],
    displayTimezone: user.preferences?.displayTimezone ?? null,
    dateFormat: (user.preferences?.dateFormat ?? DEFAULT_DATE_FORMAT) as ManagedUserPreferences["dateFormat"],
    theme: (user.preferences?.theme ?? DEFAULT_THEME) as ManagedUserPreferences["theme"]
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