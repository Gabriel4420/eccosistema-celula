import type {
  ManagedChurch,
  ManagedChurchSettings,
  UpdateChurchInput,
  UpdateChurchSettingsInput
} from "./church-management.types";

export const CHURCH_MANAGEMENT_REPOSITORY = Symbol(
  "CHURCH_MANAGEMENT_REPOSITORY"
);
export const CHURCH_MANAGEMENT_UNIT_OF_WORK = Symbol(
  "CHURCH_MANAGEMENT_UNIT_OF_WORK"
);

export type ChurchAuditValue =
  | string
  | number
  | boolean
  | null
  | ChurchAuditValue[]
  | { [key: string]: ChurchAuditValue };

export interface ChurchManagementRepository {
  find(churchId: string): Promise<ManagedChurch | null>;
  findSettings(churchId: string): Promise<ManagedChurchSettings | null>;
}

export interface ChurchManagementTransaction {
  isActiveAdministrator(userId: string): Promise<boolean>;
  findChurch(): Promise<ManagedChurch>;
  findSettings(): Promise<ManagedChurchSettings>;
  updateInstitutional(input: UpdateChurchInput): Promise<ManagedChurch>;
  updateSettings(input: UpdateChurchSettingsInput): Promise<ManagedChurchSettings>;
  recordAudit(input: {
    actorId: string;
    action: string;
    before: { [key: string]: ChurchAuditValue };
    after: { [key: string]: ChurchAuditValue };
  }): Promise<void>;
}

export interface ChurchManagementUnitOfWork {
  execute<T>(
    churchId: string,
    work: (transaction: ChurchManagementTransaction) => Promise<T>
  ): Promise<T>;
}

