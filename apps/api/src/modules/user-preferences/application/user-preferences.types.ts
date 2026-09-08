import type {
  SettingsDateFormat,
  SettingsLocale,
  SettingsTheme,
  UpdateOwnPreferencesRequest
} from "@mission-atos/contracts";

export interface ManagedUserPreferences {
  language: SettingsLocale;
  displayTimezone: string | null;
  dateFormat: SettingsDateFormat;
  theme: SettingsTheme;
}

export type UpdateOwnPreferencesInput = UpdateOwnPreferencesRequest;