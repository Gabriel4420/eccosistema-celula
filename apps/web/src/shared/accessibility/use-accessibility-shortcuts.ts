"use client";

import { useEffect } from "react";
import {
  ACCESSIBILITY_STORAGE_KEY,
  applyAccessibilityPreferences,
  defaultAccessibilityPreferences
} from "./accessibility-preferences";
import type { AccessibilityPreferences } from "./accessibility-preferences";
import type {
  AccessibilityContrast,
  AccessibilityTextScale
} from "@mission-atos/contracts";

function readPreferences(): AccessibilityPreferences {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) || "null"
    );
    if (saved && typeof saved === "object") {
      return {
        accessibilityContrast: saved.accessibilityContrast as AccessibilityContrast ?? defaultAccessibilityPreferences.accessibilityContrast,
        accessibilityTextScale: saved.accessibilityTextScale as AccessibilityTextScale ?? defaultAccessibilityPreferences.accessibilityTextScale,
        accessibilityMotion: saved.accessibilityMotion ?? defaultAccessibilityPreferences.accessibilityMotion,
        accessibilityFocus: saved.accessibilityFocus ?? defaultAccessibilityPreferences.accessibilityFocus
      };
    }
  } catch {
    /* ignore malformed storage */
  }
  return defaultAccessibilityPreferences;
}

const CONTRAST_CYCLE: readonly AccessibilityContrast[] = ["system", "standard", "high"];
const TEXT_SCALES: readonly AccessibilityTextScale[] = ["standard", "large", "extra-large"];

export function useAccessibilityShortcuts(onChange?: (preferences: AccessibilityPreferences) => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) return;

      const withModifier = event.ctrlKey || event.metaKey;
      if (!withModifier || !event.shiftKey) return;

      const current = readPreferences();
      let next: AccessibilityPreferences | null = null;

      if (event.key.toLowerCase() === "c") {
        const index = CONTRAST_CYCLE.indexOf(current.accessibilityContrast);
        const contrast = CONTRAST_CYCLE[(index + 1) % CONTRAST_CYCLE.length]!;
        next = { ...current, accessibilityContrast: contrast };
      } else if (event.key === "+" || event.key === "=") {
        const index = TEXT_SCALES.indexOf(current.accessibilityTextScale);
        const textScale = TEXT_SCALES[Math.min(index + 1, TEXT_SCALES.length - 1)]!;
        next = { ...current, accessibilityTextScale: textScale };
      } else if (event.key === "-" || event.key === "_") {
        const index = TEXT_SCALES.indexOf(current.accessibilityTextScale);
        const textScale = TEXT_SCALES[Math.max(index - 1, 0)]!;
        next = { ...current, accessibilityTextScale: textScale };
      }

      if (next) {
        event.preventDefault();
        applyAccessibilityPreferences(next);
        onChange?.(next);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onChange]);
}
