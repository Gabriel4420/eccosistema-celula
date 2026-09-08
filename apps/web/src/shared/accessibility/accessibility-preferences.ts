"use client";

import type {
  AccessibilityContrast,
  AccessibilityFocusMode,
  AccessibilityMotion,
  AccessibilityTextScale
} from "@mission-atos/contracts";

export const ACCESSIBILITY_STORAGE_KEY = "mission-atos-accessibility";

export interface AccessibilityPreferences {
  readonly accessibilityContrast: AccessibilityContrast;
  readonly accessibilityTextScale: AccessibilityTextScale;
  readonly accessibilityMotion: AccessibilityMotion;
  readonly accessibilityFocus: AccessibilityFocusMode;
}

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  accessibilityContrast: "system",
  accessibilityTextScale: "standard",
  accessibilityMotion: "system",
  accessibilityFocus: "standard"
};

export function applyAccessibilityAttributes(preferences: AccessibilityPreferences): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.dataset.accessibilityContrast = preferences.accessibilityContrast;
  root.dataset.accessibilityTextScale = preferences.accessibilityTextScale;
  root.dataset.accessibilityMotion = preferences.accessibilityMotion;
  root.dataset.accessibilityFocus = preferences.accessibilityFocus;
}

export function saveAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
}

export function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window === "undefined") return;
  applyAccessibilityAttributes(preferences);
  saveAccessibilityPreferences(preferences);
}

export const accessibilityInitializationScript = `
  try {
    const saved = JSON.parse(localStorage.getItem(${JSON.stringify(ACCESSIBILITY_STORAGE_KEY)}) || "null");
    const preferences = saved && typeof saved === "object" ? saved : ${JSON.stringify(defaultAccessibilityPreferences)};
    const root = document.documentElement;
    root.dataset.accessibilityContrast = preferences.accessibilityContrast || "system";
    root.dataset.accessibilityTextScale = preferences.accessibilityTextScale || "standard";
    root.dataset.accessibilityMotion = preferences.accessibilityMotion || "system";
    root.dataset.accessibilityFocus = preferences.accessibilityFocus || "standard";
  } catch {}
`;
