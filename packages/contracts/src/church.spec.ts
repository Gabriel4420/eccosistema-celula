import {
  isIanaTimezone,
  normalizeChurchSlug,
  updateChurchRequestSchema,
  updateChurchSettingsRequestSchema
} from "./church";

describe("church contracts", () => {
  it("normalizes institutional fields", () => {
    expect(
      updateChurchRequestSchema.parse({
        name: "  Igreja   Central ",
        slug: " Igreja Ágape ",
        email: " CONTATO@EXAMPLE.TEST ",
        phone: "+55 (11) 99999-9999",
        state: " sp ",
        postalCode: "01001-000"
      })
    ).toEqual({
      name: "Igreja Central",
      slug: "igreja-agape",
      email: "contato@example.test",
      phone: "+5511999999999",
      state: "SP",
      postalCode: "01001000"
    });
  });

  it("distinguishes omitted fields from explicit null", () => {
    expect(updateChurchRequestSchema.parse({ email: null })).toEqual({
      email: null
    });
    expect(updateChurchRequestSchema.parse({ name: "Igreja" })).not.toHaveProperty(
      "email"
    );
  });

  it("rejects empty payloads, unknown fields and reserved slugs", () => {
    expect(() => updateChurchRequestSchema.parse({})).toThrow();
    expect(() =>
      updateChurchRequestSchema.parse({ churchId: crypto.randomUUID() })
    ).toThrow();
    expect(() => updateChurchRequestSchema.parse({ slug: "admin" })).toThrow();
  });

  it("validates settings", () => {
    expect(isIanaTimezone("America/Sao_Paulo")).toBe(true);
    expect(isIanaTimezone("Mars/Olympus")).toBe(false);
    expect(
      updateChurchSettingsRequestSchema.parse({
        timezone: "America/Sao_Paulo",
        weekStartsOn: "SUNDAY"
      })
    ).toEqual({
      timezone: "America/Sao_Paulo",
      weekStartsOn: "SUNDAY"
    });
    expect(() =>
      updateChurchSettingsRequestSchema.parse({ timezone: "Mars/Olympus" })
    ).toThrow();
  });

  it("normalizes accented and punctuated slugs deterministically", () => {
    expect(normalizeChurchSlug("  Missão -- Atos! ")).toBe("missao-atos");
  });
});

