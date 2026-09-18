import {
  createPersonRequestSchema,
  listPeopleQuerySchema,
  peoplePageEnvelopeSchema,
  personItemEnvelopeSchema,
  updatePersonRequestSchema
} from "./people";

describe("people contracts", () => {
  it("normalizes person input", () => {
    expect(createPersonRequestSchema.parse({
      fullName: "  Maria   Silva ",
      phone: "+55 (11) 99999-9999",
      email: " MARIA@EXAMPLE.COM "
    })).toMatchObject({
      fullName: "Maria Silva",
      phone: "+5511999999999",
      email: "maria@example.com"
    });
  });

  it("applies pagination defaults", () => {
    expect(listPeopleQuerySchema.parse({})).toEqual({
      page: 1, pageSize: 20, status: "ACTIVE", sortBy: "fullName", sortOrder: "asc"
    });
  });

  it.each([
    [{ sortBy: "birthDate", sortOrder: "desc" }, { sortBy: "birthDate", sortOrder: "desc" }],
    [{ sortBy: "createdAt", sortOrder: "asc" }, { sortBy: "createdAt", sortOrder: "asc" }],
    [{ sortOrder: "desc" }, { sortOrder: "desc" }],
    [{ sortBy: "fullName", sortOrder: "desc" }, { sortBy: "fullName", sortOrder: "desc" }]
  ])("parses valid sort criteria %j into %j", (input, expected) => {
    expect(listPeopleQuerySchema.parse(input)).toMatchObject(expected);
  });

  it("rejects unknown sort fields and directions", () => {
    expect(() => listPeopleQuerySchema.parse({ sortBy: "gender" })).toThrow();
    expect(() => listPeopleQuerySchema.parse({ sortOrder: "up" })).toThrow();
  });

  it("rejects empty patches and unknown fields", () => {
    expect(() => updatePersonRequestSchema.parse({})).toThrow();
    expect(() => createPersonRequestSchema.parse({ fullName: "A", churchId: crypto.randomUUID() })).toThrow();
  });

  it.each([
    [{ fullName: "Pessoa", phone: "123" }, "phone"],
    [{ fullName: "Pessoa", email: "invalid" }, "email"],
    [{ fullName: "Pessoa", birthDate: "2999-01-01" }, "birthDate"],
    [{ fullName: "Pessoa", gender: "x".repeat(51) }, "gender"],
    [{ fullName: "Pessoa", observations: "x".repeat(10_001) }, "observations"]
  ])("rejects invalid %s input", (input) => {
    expect(() => createPersonRequestSchema.parse(input)).toThrow();
  });

  it("preserves omitted fields and converts explicit empty optionals to null", () => {
    expect(updatePersonRequestSchema.parse({ phone: "", email: "", observations: "" })).toEqual({
      phone: null, email: null, observations: null
    });
    expect(updatePersonRequestSchema.parse({ fullName: "Pessoa" })).toEqual({ fullName: "Pessoa" });
  });

  it("enforces query bounds and strict query fields", () => {
    expect(() => listPeopleQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => listPeopleQuerySchema.parse({ pageSize: 101 })).toThrow();
    expect(() => listPeopleQuerySchema.parse({ churchId: crypto.randomUUID() })).toThrow();
  });

  it("validates public item and collection envelopes", () => {
    const data = {
      id: crypto.randomUUID(), fullName: "Pessoa", phone: null, email: null,
      birthDate: null, gender: null, status: "ACTIVE",
      currentCell: { id: crypto.randomUUID(), code: "CEL-001", name: "Célula Esperança" },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    expect(personItemEnvelopeSchema.parse({ data, meta: {} }).data).toEqual(data);
    expect(peoplePageEnvelopeSchema.parse({ data: [data], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).data).toHaveLength(1);
    expect(() => personItemEnvelopeSchema.parse({ data: { ...data, churchId: crypto.randomUUID() }, meta: {} })).toThrow();
  });

  it("normalizes an optional cellCode on create and rejects unknown membership payloads", () => {
    expect(createPersonRequestSchema.parse({
      fullName: "Pessoa", cellCode: "  célula   esperança "
    }).cellCode).toBe("CELULA-ESPERANCA");
    expect(createPersonRequestSchema.parse({ fullName: "Pessoa" }).cellCode).toBeUndefined();
    expect(() => createPersonRequestSchema.parse({
      fullName: "Pessoa", cellCode: "!!!"
    })).toThrow();
    expect(() => updatePersonRequestSchema.parse({ cellCode: "CEL-001" })).toThrow();
  });
});
