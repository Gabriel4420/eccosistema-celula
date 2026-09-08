import type {
  SettingsDateFormat,
  SettingsLocale,
  SettingsTheme,
  AccessibilityContrast,
  AccessibilityFocusMode,
  AccessibilityMotion,
  AccessibilityTextScale,
  UpdateOwnPreferencesRequest
} from "@mission-atos/contracts";

export interface ManagedUserPreferences {
  language: SettingsLocale;
  displayTimezone: string | null;
  dateFormat: SettingsDateFormat;
  theme: SettingsTheme;
  accessibilityContrast: AccessibilityContrast;
  accessibilityTextScale: AccessibilityTextScale;
  accessibilityMotion: AccessibilityMotion;
  accessibilityFocus: AccessibilityFocusMode;
}

export type UpdateOwnPreferencesInput = UpdateOwnPreferencesRequest;
