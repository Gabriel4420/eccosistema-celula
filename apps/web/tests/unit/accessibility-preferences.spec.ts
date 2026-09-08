import {
  ACCESSIBILITY_STORAGE_KEY,
  applyAccessibilityPreferences,
  defaultAccessibilityPreferences
} from "@/src/shared/accessibility/accessibility-preferences";

describe("accessibility preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.accessibilityContrast;
    delete document.documentElement.dataset.accessibilityTextScale;
    delete document.documentElement.dataset.accessibilityMotion;
    delete document.documentElement.dataset.accessibilityFocus;
  });

  it("has explicit defaults respecting the system by default", () => {
    expect(defaultAccessibilityPreferences).toEqual({
      accessibilityContrast: "system",
      accessibilityTextScale: "standard",
      accessibilityMotion: "system",
      accessibilityFocus: "standard"
    });
  });

  it("applies root attributes and persists preferences", () => {
    const preferences = {
      accessibilityContrast: "high",
      accessibilityTextScale: "large",
      accessibilityMotion: "reduce",
      accessibilityFocus: "enhanced"
    } as const;

    applyAccessibilityPreferences(preferences);

    const root = document.documentElement;
    expect(root.dataset.accessibilityContrast).toBe("high");
    expect(root.dataset.accessibilityTextScale).toBe("large");
    expect(root.dataset.accessibilityMotion).toBe("reduce");
    expect(root.dataset.accessibilityFocus).toBe("enhanced");
    expect(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)).toBe(
      JSON.stringify(preferences)
    );
  });
});
