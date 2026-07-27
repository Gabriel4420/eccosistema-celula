import { presentChurch, presentChurchSettings } from "./church.presenter";

const church = {
  id: crypto.randomUUID(),
  name: "Igreja Exemplo",
  slug: "igreja-exemplo",
  email: null,
  phone: null,
  addressLine: null,
  addressNumber: null,
  addressComplement: null,
  neighborhood: null,
  city: null,
  state: null,
  postalCode: null,
  country: "BR",
  timezone: "America/Sao_Paulo",
  weekStartsOn: "SUNDAY" as const,
  createdAt: new Date("2026-07-26T00:00:00.000Z"),
  updatedAt: new Date("2026-07-26T00:00:00.000Z")
};

describe("church presenter", () => {
  it("returns an explicit institutional allowlist", () => {
    const result = presentChurch(church);
    expect(result).not.toHaveProperty("deletedAt");
    expect(result).not.toHaveProperty("passwordHash");
    expect(result.address.country).toBe("BR");
  });

  it("returns only approved settings", () => {
    expect(presentChurchSettings(church)).toEqual({
      timezone: "America/Sao_Paulo",
      weekStartsOn: "SUNDAY"
    });
  });
});
