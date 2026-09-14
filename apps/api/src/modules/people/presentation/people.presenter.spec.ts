import type { ManagedPerson } from "../application/people-management.types";
import { presentPerson } from "./people.presenter";

const person: ManagedPerson = {
  id: "person", churchId: "church", fullName: "Pessoa", phone: null,
  email: null, birthDate: new Date("2000-01-02T00:00:00.000Z"), gender: null,
  observations: "restrita", currentCell: null, deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z")
};

describe("people presenter", () => {
  it("uses an allowlist and hides observations from leaders", () => {
    const output = presentPerson(person, false);
    expect(output).not.toHaveProperty("churchId");
    expect(output).not.toHaveProperty("deletedAt");
    expect(output).not.toHaveProperty("observations");
    expect(output.birthDate).toBe("2000-01-02");
    expect(output.currentCell).toBeNull();
  });

  it("shows observations to pastors", () => {
    expect(presentPerson(person, true)).toHaveProperty("observations", "restrita");
  });

  it("exposes the active cell link without observations for leaders", () => {
    const linked = { ...person, currentCell: { id: "cell", code: "CEL-001", name: "Célula Esperança" } };
    const output = presentPerson(linked, false);
    expect(output.currentCell).toEqual({ id: "cell", code: "CEL-001", name: "Célula Esperança" });
  });
});
