import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { ChurchManagementAuthorization } from "./church-management.authorization";
import type {
  ChurchAuditValue,
  ChurchManagementTransaction,
  ChurchManagementUnitOfWork
} from "./church-management.port";
import type {
  ManagedChurch,
  UpdateChurchInput,
  UpdateChurchSettingsInput
} from "./church-management.types";

const identityFields = ["name", "slug"] as const;
const contactFields = ["email", "phone"] as const;
const addressFields = [
  "addressLine",
  "addressNumber",
  "addressComplement",
  "neighborhood",
  "city",
  "state",
  "postalCode",
  "country"
] as const;
const settingsFields = ["timezone", "weekStartsOn"] as const;

export class ChurchManagementCommands {
  constructor(
    private readonly unitOfWork: ChurchManagementUnitOfWork,
    private readonly authorization: ChurchManagementAuthorization
  ) {}

  update(
    principal: AuthenticatedPrincipal,
    input: UpdateChurchInput
  ): Promise<ManagedChurch> {
    this.authorization.assertRole(principal);
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      const before = await transaction.findChurch();
      const groups = [
        createChangeSet(before, input, identityFields, "CHURCH_IDENTITY_UPDATED"),
        createChangeSet(before, input, contactFields, "CHURCH_CONTACT_UPDATED"),
        createChangeSet(before, input, addressFields, "CHURCH_ADDRESS_UPDATED")
      ].filter(isChangeSet);
      if (groups.length === 0) return before;

      const church = await transaction.updateInstitutional(input);
      for (const group of groups) {
        await transaction.recordAudit({
          actorId: principal.userId,
          action: group.action,
          before: group.before,
          after: group.after
        });
      }
      return church;
    });
  }

  updateSettings(
    principal: AuthenticatedPrincipal,
    input: UpdateChurchSettingsInput
  ): Promise<ManagedChurch> {
    this.authorization.assertRole(principal);
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      const before = await transaction.findChurch();
      const changes = createChangeSet(
        before,
        input,
        settingsFields,
        "CHURCH_SETTINGS_UPDATED"
      );
      if (!changes) return before;

      const church = await transaction.updateSettings(input);
      await transaction.recordAudit({
        actorId: principal.userId,
        action: changes.action,
        before: changes.before,
        after: changes.after
      });
      return church;
    });
  }

  private async assertCurrentAdministrator(
    transaction: ChurchManagementTransaction,
    principal: AuthenticatedPrincipal
  ): Promise<void> {
    this.authorization.assertCurrentAdministrator(
      principal,
      await transaction.isActiveAdministrator(principal.userId)
    );
  }
}

interface ChangeSet {
  action: string;
  before: { [key: string]: ChurchAuditValue };
  after: { [key: string]: ChurchAuditValue };
}

function createChangeSet<
  TInput extends object,
  TKey extends Extract<keyof TInput, keyof ManagedChurch>
>(
  current: ManagedChurch,
  input: TInput,
  fields: readonly TKey[],
  action: string
): ChangeSet | undefined {
  const before: { [key: string]: ChurchAuditValue } = {};
  const after: { [key: string]: ChurchAuditValue } = {};
  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(input, field) &&
      current[field] !== input[field]
    ) {
      before[String(field)] = current[field] as ChurchAuditValue;
      after[String(field)] = input[field] as ChurchAuditValue;
    }
  }
  return Object.keys(before).length ? { action, before, after } : undefined;
}

function isChangeSet(value: ChangeSet | undefined): value is ChangeSet {
  return value !== undefined;
}

