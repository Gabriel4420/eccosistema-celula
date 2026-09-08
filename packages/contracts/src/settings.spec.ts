import {
  accessibilityContrasts,
  accessibilityFocusModes,
  accessibilityMotions,
  accessibilityTextScales,
  reportDeadlineHoursSchema,
  settingsDateFormats,
  settingsLocales,
  settingsThemes,
  updateChurchSettingsRequestSchema,
  updateOwnPreferencesRequestSchema,
  userPreferencesEnvelopeSchema,
  userPreferencesResponseSchema
} from ".";

describe("settings contracts", () => {
  it("defines closed vocabularies", () => {
    expect(settingsLocales).toEqual(["pt-BR", "en", "es"]);
    expect(settingsDateFormats).toEqual([
      "dd/MM/yyyy",
      "MM/dd/yyyy",
      "yyyy-MM-dd"
    ]);
    expect(settingsThemes).toEqual(["light", "dark", "system"]);
    expect(accessibilityContrasts).toEqual(["system", "standard", "high"]);
    expect(accessibilityTextScales).toEqual(["standard", "large", "extra-large"]);
    expect(accessibilityMotions).toEqual(["system", "reduce"]);
    expect(accessibilityFocusModes).toEqual(["standard", "enhanced"]);
  });

  it("coerces and validates reportDeadlineHours", () => {
    expect(reportDeadlineHoursSchema.parse("72")).toBe(72);
    expect(reportDeadlineHoursSchema.parse(1)).toBe(1);
    expect(() => reportDeadlineHoursSchema.parse(0)).toThrow();
    expect(() => reportDeadlineHoursSchema.parse(721)).toThrow();
    expect(() => reportDeadlineHoursSchema.parse(48.5)).toThrow();
  });

  it("accepts reportDeadlineHours in church settings updates", () => {
    const input = updateChurchSettingsRequestSchema.parse({
      reportDeadlineHours: "96"
    });
    expect(input.reportDeadlineHours).toBe(96);
    expect(updateChurchSettingsRequestSchema.parse({ timezone: "America/Sao_Paulo" })).toMatchObject({
      timezone: "America/Sao_Paulo"
    });
    expect(() => updateChurchSettingsRequestSchema.parse({ reportDeadlineHours: 0 })).toThrow();
    expect(() => updateChurchSettingsRequestSchema.parse({ extra: true })).toThrow();
    expect(() => updateChurchSettingsRequestSchema.parse({})).toThrow();
  });

  it("validates the full user preferences update payload", () => {
    const valid = updateOwnPreferencesRequestSchema.parse({
      language: "en",
      displayTimezone: "America/New_York",
      dateFormat: "yyyy-MM-dd",
      theme: "dark",
      accessibilityContrast: "high",
      accessibilityTextScale: "large",
      accessibilityMotion: "reduce",
      accessibilityFocus: "enhanced"
    });
    expect(valid).toEqual({
      language: "en",
      displayTimezone: "America/New_York",
      dateFormat: "yyyy-MM-dd",
      theme: "dark",
      accessibilityContrast: "high",
      accessibilityTextScale: "large",
      accessibilityMotion: "reduce",
      accessibilityFocus: "enhanced"
    });

    const inheritTz = updateOwnPreferencesRequestSchema.parse({
      displayTimezone: null
    });
    expect(inheritTz.displayTimezone).toBeNull();

    expect(() => updateOwnPreferencesRequestSchema.parse({ language: "fr" })).toThrow();
    expect(() => updateOwnPreferencesRequestSchema.parse({ theme: "blue" })).toThrow();
    expect(() => updateOwnPreferencesRequestSchema.parse({ accessibilityContrast: "low" })).toThrow();
    expect(() => updateOwnPreferencesRequestSchema.parse({ displayTimezone: "Not/AZone" })).toThrow();
    expect(() => updateOwnPreferencesRequestSchema.parse({ extra: true })).toThrow();
    expect(() => updateOwnPreferencesRequestSchema.parse({})).toThrow();
  });

  it("round-trips the preferences response envelope", () => {
    const data = {
      language: "pt-BR",
      displayTimezone: null,
      dateFormat: "dd/MM/yyyy",
      theme: "system",
      accessibilityContrast: "system",
      accessibilityTextScale: "standard",
      accessibilityMotion: "system",
      accessibilityFocus: "standard"
    };
    expect(userPreferencesResponseSchema.parse(data)).toEqual(data);
    expect(userPreferencesEnvelopeSchema.parse({ data, meta: {} })).toEqual({ data, meta: {} });
    expect(() =>
      userPreferencesEnvelopeSchema.parse({
        data: { ...data, language: "fr" },
        meta: {}
      })
    ).toThrow();
  });
});
