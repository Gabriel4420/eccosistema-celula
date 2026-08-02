import type { ManagedPerson } from "../application/people-management.types";
import { presentPerson } from "./people.presenter";

const person: ManagedPerson = {
  id: "person", churchId: "church", fullName: "Pessoa", phone: null,
  email: null, birthDate: new Date("2000-01-02T00:00:00.000Z"), gender: null,
  observations: "restrita", deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z")
};

describe("people presenter", () => {
  it("uses an allowlist and hides observations from leaders", () => {
    const output = presentPerson(person, false);
    expect(output).not.toHaveProperty("churchId");
    expect(output).not.toHaveProperty("deletedAt");
    expect(output).not.toHaveProperty("observations");
    expect(output.birthDate).toBe("2000-01-02");
  });

  it("shows observations to pastors", () => {
    expect(presentPerson(person, true)).toHaveProperty("observations", "restrita");
  });
});
