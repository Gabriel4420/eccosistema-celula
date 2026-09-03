import {
  importPersonItemSchema,
  importCellItemSchema,
  importUserItemSchema,
  importPeopleRequestSchema,
  importCellsRequestSchema,
  importUsersRequestSchema,
  importRowResultSchema,
  importResultEnvelopeSchema
} from "./bulk-import";

describe("bulk-import contracts", () => {
  describe("importPersonItemSchema", () => {
    it("accepts minimum valid person", () => {
      const result = importPersonItemSchema.parse({ fullName: "Maria da Silva" });
      expect(result.fullName).toBe("Maria da Silva");
    });

    it("normalizes fullName", () => {
      const result = importPersonItemSchema.parse({ fullName: "   Maria   da Silva " });
      expect(result.fullName).toBe("Maria da Silva");
    });

    it("accepts optional fields and cellCode", () => {
      const result = importPersonItemSchema.parse({
        fullName: "João",
        phone: "+5511999998888",
        email: "JOAO@X.COM",
        birthDate: "1990-01-01",
        gender: "M",
        observations: "obs",
        cellCode: "celula-1"
      });
      expect(result.email).toBe("joao@x.com");
      expect(result.cellCode).toBe("CELULA-1");
    });

    it("rejects unknown fields", () => {
      expect(() => importPersonItemSchema.parse({ fullName: "X", extra: 1 })).toThrow();
    });

    it("rejects invalid phone", () => {
      expect(() => importPersonItemSchema.parse({ fullName: "X", phone: "11999" })).toThrow();
    });

    it("rejects future birthDate", () => {
      const future = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10);
      expect(() => importPersonItemSchema.parse({ fullName: "X", birthDate: future })).toThrow();
    });
  });

  describe("importCellItemSchema", () => {
    it("accepts cell with defaults (FORMING)", () => {
      const result = importCellItemSchema.parse({
        code: "Cel-01",
        name: "Célula Jovens",
        meetingDay: "MONDAY",
        meetingTime: "19:30",
        address: "Rua X"
      });
      expect(result.code).toBe("CEL-01");
      expect(result.status).toBe("FORMING");
    });

    it("requires leader and supervisor when ACTIVE", () => {
      expect(() =>
        importCellItemSchema.parse({
          code: "C-1",
          name: "C",
          meetingDay: "MONDAY",
          meetingTime: "19:00",
          address: "A",
          status: "ACTIVE"
        })
      ).toThrow();
    });

    it("accepts ACTIVE with leader and supervisor", () => {
      const leader = "a7f2c1d0-0000-4000-8000-000000000001";
      const supervisor = "a7f2c1d0-0000-4000-8000-000000000002";
      const result = importCellItemSchema.parse({
        code: "C-1",
        name: "C",
        meetingDay: "MONDAY",
        meetingTime: "19:00",
        address: "A",
        status: "ACTIVE",
        leaderId: leader,
        supervisorId: supervisor
      });
      expect(result.status).toBe("ACTIVE");
    });
  });

  describe("importUserItemSchema", () => {
    it("accepts user with role names", () => {
      const result = importUserItemSchema.parse({
        firstName: "Ana",
        lastName: "Pereira",
        email: "ANA@X.COM",
        initialPassword: "Senha#Forte1",
        roles: ["LEADER", "SUPERVISOR"]
      });
      expect(result.email).toBe("ana@x.com");
      expect(result.roles).toEqual(["LEADER", "SUPERVISOR"]);
    });

    it("rejects weak password", () => {
      expect(() =>
        importUserItemSchema.parse({
          firstName: "Ana",
          lastName: "Pereira",
          email: "ana@x.com",
          initialPassword: "fraca",
          roles: ["LEADER"]
        })
      ).toThrow();
    });

    it("rejects duplicate role names", () => {
      expect(() =>
        importUserItemSchema.parse({
          firstName: "Ana",
          lastName: "Pereira",
          email: "ana@x.com",
          initialPassword: "Senha#Forte1",
          roles: ["LEADER", "LEADER"]
        })
      ).toThrow();
    });

    it("rejects more than 4 roles", () => {
      expect(() =>
        importUserItemSchema.parse({
          firstName: "Ana",
          lastName: "Pereira",
          email: "ana@x.com",
          initialPassword: "Senha#Forte1",
          roles: ["ADMIN", "PASTOR", "SUPERVISOR", "LEADER", "ADMIN"]
        })
      ).toThrow();
    });
  });

  describe("request envelopes", () => {
    it("people requires at least one item", () => {
      expect(() => importPeopleRequestSchema.parse({ items: [] })).toThrow();
    });

    it("people rejects unknown body keys", () => {
      expect(() => importPeopleRequestSchema.parse({ items: [], x: 1 })).toThrow();
    });

    it("users requires at least one item", () => {
      expect(() => importUsersRequestSchema.parse({ items: [] })).toThrow();
    });

    it("cells accepts items", () => {
      const result = importCellsRequestSchema.parse({
        items: [{ code: "C-1", name: "C", meetingDay: "MONDAY", meetingTime: "19:00", address: "A" }]
      });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("importRowResultSchema & envelope", () => {
    it("accepts a created row", () => {
      const result = importRowResultSchema.parse({ row: 1, status: "created" });
      expect(result.status).toBe("created");
    });

    it("accepts an error row with errors", () => {
      const result = importRowResultSchema.parse({ row: 2, status: "error", message: "failed", errors: ["fullName"] });
      expect(result.errors).toEqual(["fullName"]);
    });

    it("rejects unknown status", () => {
      expect(() => importRowResultSchema.parse({ row: 1, status: "other" })).toThrow();
    });
  });

  describe("importResultEnvelopeSchema", () => {
    it("accepts a full result envelope", () => {
      const result = importResultEnvelopeSchema.parse({
        data: {
          domain: "people",
          fileName: "pessoas.csv",
          format: "csv",
          processed: 2,
          created: 1,
          failed: 1,
          resultsPerRow: [
            { row: 1, status: "created" },
            { row: 2, status: "error", message: "dup", errors: ["email"] }
          ]
        },
        meta: {}
      });
      expect(result.data.created).toBe(1);
    });
  });
});