import type {
  ManagedUserPreferences,
  UpdateOwnPreferencesInput
} from "./user-preferences.types";

export const USER_PREFERENCES_REPOSITORY = Symbol(
  "USER_PREFERENCES_REPOSITORY"
);
export const USER_PREFERENCES_UNIT_OF_WORK = Symbol(
  "USER_PREFERENCES_UNIT_OF_WORK"
);

export type PreferencesAuditValue =
  | string
  | number
  | boolean
  | null
  | PreferencesAuditValue[]
  | { [key: string]: PreferencesAuditValue };

export interface UserPreferencesRepository {
  find(
    churchId: string,
    userId: string
  ): Promise<ManagedUserPreferences | null>;
}

export interface UserPreferencesTransaction {
  findPreferences(): Promise<ManagedUserPreferences>;
  updatePreferences(
    input: UpdateOwnPreferencesInput
  ): Promise<ManagedUserPreferences>;
  recordAudit(input: {
    actorId: string;
    action: string;
    before: { [key: string]: PreferencesAuditValue };
    after: { [key: string]: PreferencesAuditValue };
  }): Promise<void>;
}

export interface UserPreferencesUnitOfWork {
  execute<T>(
    churchId: string,
    userId: string,
    work: (transaction: UserPreferencesTransaction) => Promise<T>
  ): Promise<T>;
}