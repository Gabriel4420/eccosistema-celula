import {
  canTransitionCellStatus,
  hasConflictingLeadership,
  isWritableCellStatus,
  isValidCellCode,
  normalizeCellCode,
  normalizeCellText,
  requiresLeader
} from "./cells";

describe("domain cell rules", () => {
  describe("code normalization", () => {
    it.each([
      ["  célula   Esperança ", "CELULA-ESPERANCA"],
      ["Célula 02", "CELULA-02"],
      ["açúcar & café", "ACUCAR-CAFE"],
      ["código_1.5", "CODIGO-1-5"],
      ["--- código ----", "CODIGO"]
    ])("normalizes %j to %j", (input, expected) => {
      expect(normalizeCellCode(input)).toBe(expected);
    });
  });

  describe("code validation", () => {
    it("accepts canonical codes", () => {
      expect(isValidCellCode("CEL-001")).toBe(true);
      expect(isValidCellCode("A")).toBe(true);
      expect(isValidCellCode("A0B".repeat(16))).toBe(true);
    });

    it("rejects non-canonical codes", () => {
      expect(isValidCellCode("")).toBe(false);
      expect(isValidCellCode("a")).toBe(false);
      expect(isValidCellCode("A B")).toBe(false);
      expect(isValidCellCode("A".repeat(51))).toBe(false);
      expect(isValidCellCode("-A")).toBe(false);
      expect(isValidCellCode("A-")).toBe(false);
    });
  });

  describe("text normalization", () => {
    it("collapses whitespace and trims", () => {
      expect(normalizeCellText("  Célula   Esperança  ")).toBe("Célula Esperança");
    });
  });

  describe("status transitions", () => {
    it("allows idempotent same-state transitions", () => {
      expect(canTransitionCellStatus("ACTIVE", "ACTIVE")).toBe(true);
      expect(canTransitionCellStatus("SUSPENDED", "SUSPENDED")).toBe(true);
      expect(canTransitionCellStatus("CLOSED", "CLOSED")).toBe(true);
      expect(canTransitionCellStatus("FORMING", "FORMING")).toBe(true);
    });

    it("allows activation and suspension from non-closed states", () => {
      expect(canTransitionCellStatus("FORMING", "ACTIVE")).toBe(true);
      expect(canTransitionCellStatus("SUSPENDED", "ACTIVE")).toBe(true);
      expect(canTransitionCellStatus("FORMING", "SUSPENDED")).toBe(true);
      expect(canTransitionCellStatus("ACTIVE", "SUSPENDED")).toBe(true);
    });

    it("rejects transitions from closed and to closed", () => {
      expect(canTransitionCellStatus("CLOSED", "ACTIVE")).toBe(false);
      expect(canTransitionCellStatus("CLOSED", "SUSPENDED")).toBe(false);
      expect(canTransitionCellStatus("ACTIVE", "CLOSED")).toBe(false);
      expect(canTransitionCellStatus("FORMING", "CLOSED")).toBe(false);
    });
  });

  describe("writable statuses", () => {
    it("exposes only ACTIVE and SUSPENDED as writable", () => {
      expect(isWritableCellStatus("ACTIVE")).toBe(true);
      expect(isWritableCellStatus("SUSPENDED")).toBe(true);
      expect(isWritableCellStatus("FORMING")).toBe(false);
      expect(isWritableCellStatus("CLOSED")).toBe(false);
    });
  });

  describe("leader requirements", () => {
    it("requires a leader only when active", () => {
      expect(requiresLeader("ACTIVE")).toBe(true);
      expect(requiresLeader("FORMING")).toBe(false);
      expect(requiresLeader("SUSPENDED")).toBe(false);
      expect(requiresLeader("CLOSED")).toBe(false);
    });

    it("detects leader equals trainee conflict", () => {
      const id = "user-1";
      expect(hasConflictingLeadership(id, id)).toBe(true);
      expect(hasConflictingLeadership(id, null)).toBe(false);
      expect(hasConflictingLeadership(null, null)).toBe(false);
      expect(hasConflictingLeadership(null, id)).toBe(false);
    });
  });
});
