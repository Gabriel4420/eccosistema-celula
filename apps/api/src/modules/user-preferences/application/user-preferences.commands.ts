import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type {
  PreferencesAuditValue,
  UserPreferencesUnitOfWork
} from "./user-preferences.port";
import type {
  ManagedUserPreferences,
  UpdateOwnPreferencesInput
} from "./user-preferences.types";

const preferenceFields = [
  "language",
  "displayTimezone",
  "dateFormat",
  "theme"
] as const;

export class UserPreferencesCommands {
  constructor(private readonly unitOfWork: UserPreferencesUnitOfWork) {}

  updateOwn(
    principal: AuthenticatedPrincipal,
    input: UpdateOwnPreferencesInput
  ): Promise<ManagedUserPreferences> {
    return this.unitOfWork.execute(
      principal.churchId,
      principal.userId,
      async (transaction) => {
        const before = await transaction.findPreferences();
        const changes = createChangeSet(before, input);
        if (!changes) return before;

        const preferences = await transaction.updatePreferences(input);
        await transaction.recordAudit({
          actorId: principal.userId,
          action: "USER_PREFERENCES_UPDATED",
          before: changes.before,
          after: changes.after
        });
        return preferences;
      }
    );
  }
}

interface ChangeSet {
  before: { [key: string]: PreferencesAuditValue };
  after: { [key: string]: PreferencesAuditValue };
}

function createChangeSet(
  current: ManagedUserPreferences,
  input: UpdateOwnPreferencesInput
): ChangeSet | undefined {
  const before: { [key: string]: PreferencesAuditValue } = {};
  const after: { [key: string]: PreferencesAuditValue } = {};
  for (const field of preferenceFields) {
    const currentValue = current[field];
    const nextValue = input[field];
    if (
      Object.prototype.hasOwnProperty.call(input, field) &&
      currentValue !== nextValue
    ) {
      before[field] = currentValue;
      after[field] = nextValue as PreferencesAuditValue;
    }
  }
  return Object.keys(before).length ? { before, after } : undefined;
}