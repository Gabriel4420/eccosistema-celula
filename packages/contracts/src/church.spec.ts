import {
  churchEnvelopeSchema,
  churchResponseSchema,
  churchSettingsEnvelopeSchema,
  isIanaTimezone,
  normalizeChurchSlug,
  updateChurchRequestSchema,
  updateChurchSettingsRequestSchema
} from "./church";

const baseChurch = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Missão Atos",
  slug: "missao-atos",
  email: "contato@missaoatos.example",
  phone: "+5511999999999",
  address: {
    line: "Rua Central",
    number: "100",
    complement: null,
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    postalCode: "01001000",
    country: "BR"
  },
  createdAt: "2026-08-03T12:00:00.000Z",
  updatedAt: "2026-08-03T12:00:00.000Z"
};

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

  it("parses a church response with presenter parity", () => {
    expect(churchResponseSchema.parse(baseChurch)).toEqual(baseChurch);
    expect(
      churchEnvelopeSchema.parse({ data: baseChurch, meta: {} }).data
    ).toEqual(baseChurch);
  });

  it("accepts nullable institutional fields and rejects unknown keys", () => {
    const minimal = {
      ...baseChurch,
      email: null,
      phone: null,
      address: {
        ...baseChurch.address,
        line: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        postalCode: null
      }
    };
    expect(churchResponseSchema.parse(minimal)).toEqual(minimal);
    expect(() =>
      churchResponseSchema.parse({ ...baseChurch, churchId: crypto.randomUUID() })
    ).toThrow();
  });

  it("parses church settings envelopes", () => {
    const settings = { timezone: "America/Sao_Paulo", weekStartsOn: "SUNDAY" };
    expect(
      churchSettingsEnvelopeSchema.parse({ data: settings, meta: {} }).data
    ).toEqual(settings);
    expect(() =>
      churchSettingsEnvelopeSchema.parse({
        data: { ...settings, weekStartsOn: "MONDAY?" },
        meta: {}
      })
    ).toThrow();
  });
});

