import { formatUserMenuIdentity } from "@/src/shared/navigation/user-menu-presentation";

describe("formatUserMenuIdentity", () => {
  it("shows the first name and only the surname initial", () => {
    expect(formatUserMenuIdentity("Mateus", "Almeida Silva")).toEqual({
      displayName: "Mateus A.",
      initials: "MA"
    });
  });

  it("normalizes whitespace and handles a missing surname", () => {
    expect(formatUserMenuIdentity("  Ana  ", "  ")).toEqual({
      displayName: "Ana",
      initials: "A"
    });
  });
});
