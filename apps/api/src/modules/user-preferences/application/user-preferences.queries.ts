import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { UserPreferencesError } from "./user-preferences.error";
import type { UserPreferencesRepository } from "./user-preferences.port";
import type { ManagedUserPreferences } from "./user-preferences.types";

export class UserPreferencesQueries {
  constructor(private readonly preferences: UserPreferencesRepository) {}

  async getOwn(
    principal: AuthenticatedPrincipal
  ): Promise<ManagedUserPreferences> {
    const preferences = await this.preferences.find(
      principal.churchId,
      principal.userId
    );
    if (!preferences) {
      throw new UserPreferencesError("USER_NOT_FOUND", "User not found");
    }
    return preferences;
  }
}