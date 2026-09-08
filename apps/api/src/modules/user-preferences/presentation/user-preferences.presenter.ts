import type { ManagedUserPreferences } from "../application/user-preferences.types";

export function presentUserPreferences(preferences: ManagedUserPreferences) {
  return {
    language: preferences.language,
    displayTimezone: preferences.displayTimezone,
    dateFormat: preferences.dateFormat,
    theme: preferences.theme,
    accessibilityContrast: preferences.accessibilityContrast,
    accessibilityTextScale: preferences.accessibilityTextScale,
    accessibilityMotion: preferences.accessibilityMotion,
    accessibilityFocus: preferences.accessibilityFocus
  };
}
