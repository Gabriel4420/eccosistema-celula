import { presentUserPreferences } from "./user-preferences.presenter";

const preferences = {
  language: "pt-BR" as const,
  displayTimezone: null,
  dateFormat: "dd/MM/yyyy" as const,
  theme: "system" as const
};

describe("user preferences presenter", () => {
  it("returns an explicit allowlist without persistence fields", () => {
    const result = presentUserPreferences(preferences);
    expect(result).toEqual(preferences);
    expect(result).not.toHaveProperty("userId");
    expect(result).not.toHaveProperty("churchId");
    expect(result).not.toHaveProperty("deletedAt");
  });
});