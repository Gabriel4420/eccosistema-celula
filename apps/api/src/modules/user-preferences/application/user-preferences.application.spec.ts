import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { UserPreferencesCommands } from "./user-preferences.commands";
import { UserPreferencesQueries } from "./user-preferences.queries";
import type {
  UserPreferencesRepository,
  UserPreferencesTransaction,
  UserPreferencesUnitOfWork
} from "./user-preferences.port";
import type {
  ManagedUserPreferences,
  UpdateOwnPreferencesInput
} from "./user-preferences.types";

const principal: AuthenticatedPrincipal = {
  userId: crypto.randomUUID(),
  churchId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  roles: ["LEADER"]
};

function preferences(
  overrides: Partial<ManagedUserPreferences> = {}
): ManagedUserPreferences {
  return {
    language: "pt-BR",
    displayTimezone: null,
    dateFormat: "dd/MM/yyyy",
    theme: "system",
    ...overrides
  };
}

describe("user preferences application", () => {
  it("queries the principal own preferences", async () => {
    const find = jest.fn(async () => preferences());
    const repository: UserPreferencesRepository = { find };
    const queries = new UserPreferencesQueries(repository);

    await expect(queries.getOwn(principal)).resolves.toEqual(preferences());
    expect(find).toHaveBeenCalledWith(principal.churchId, principal.userId);
  });

  it("rejects a missing or inactive user", async () => {
    const queries = new UserPreferencesQueries({
      find: async () => null
    });
    await expect(queries.getOwn(principal)).rejects.toMatchObject({
      code: "USER_NOT_FOUND"
    });
  });

  it("updates own preferences with a minimal audit diff", async () => {
    const [transaction, commands] = setup();

    await commands.updateOwn(principal, { theme: "dark" });

    expect(transaction.updatePreferences).toHaveBeenCalledWith({ theme: "dark" });
    expect(transaction.recordAudit).toHaveBeenCalledTimes(1);
    expect(transaction.recordAudit).toHaveBeenCalledWith({
      actorId: principal.userId,
      action: "USER_PREFERENCES_UPDATED",
      before: { theme: "system" },
      after: { theme: "dark" }
    });
  });

  it("does not persist or audit an effective no-op", async () => {
    const [transaction, commands] = setup();

    const before = await commands.updateOwn(principal, { theme: "system" });

    expect(transaction.updatePreferences).not.toHaveBeenCalled();
    expect(transaction.recordAudit).not.toHaveBeenCalled();
    expect(before).toEqual(preferences());
  });

  it("audits every changed preference field", async () => {
    const [transaction, commands] = setup(
      preferences({ language: "en", displayTimezone: "America/New_York" })
    );

    const input: UpdateOwnPreferencesInput = {
      language: "es",
      displayTimezone: null,
      dateFormat: "yyyy-MM-dd",
      theme: "light"
    };
    await commands.updateOwn(principal, input);

    expect(transaction.recordAudit).toHaveBeenCalledWith({
      actorId: principal.userId,
      action: "USER_PREFERENCES_UPDATED",
      before: {
        language: "en",
        displayTimezone: "America/New_York",
        dateFormat: "dd/MM/yyyy",
        theme: "system"
      },
      after: input
    });
  });
});

function setup(
  current: ManagedUserPreferences = preferences()
): [
  jest.Mocked<UserPreferencesTransaction>,
  UserPreferencesCommands
] {
  const transaction: jest.Mocked<UserPreferencesTransaction> = {
    findPreferences: jest.fn(async () => current),
    updatePreferences: jest.fn(async (input) => ({
      ...current,
      ...input
    })),
    recordAudit: jest
      .fn<
        Promise<void>,
        [Parameters<UserPreferencesTransaction["recordAudit"]>[0]]
      >()
      .mockResolvedValue()
  };
  const unitOfWork: UserPreferencesUnitOfWork = {
    execute: async (_churchId, _userId, work) => work(transaction)
  };
  return [transaction, new UserPreferencesCommands(unitOfWork)];
}