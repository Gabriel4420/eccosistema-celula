import {
  canTransitionMeetingStatus,
  isMeetingEditable,
  isTerminalStatus,
  isValidCancellationReason,
  isValidMeetingDate,
  normalizeCancellationReason,
  normalizeMeetingDate,
  normalizeObservations
} from "./meetings";

describe("meeting domain rules", () => {
  describe("isValidMeetingDate", () => {
    it("accepts a valid date", () => {
      expect(isValidMeetingDate("2026-08-19")).toBe(true);
    });

    it("accepts leap year date", () => {
      expect(isValidMeetingDate("2024-02-29")).toBe(true);
    });

    it("rejects non-leap year Feb 29", () => {
      expect(isValidMeetingDate("2026-02-29")).toBe(false);
    });

    it("rejects Feb 30", () => {
      expect(isValidMeetingDate("2026-02-30")).toBe(false);
    });

    it("rejects Apr 31", () => {
      expect(isValidMeetingDate("2026-04-31")).toBe(false);
    });

    it("rejects invalid format", () => {
      expect(isValidMeetingDate("19-08-2026")).toBe(false);
      expect(isValidMeetingDate("2026/08/19")).toBe(false);
      expect(isValidMeetingDate("not-a-date")).toBe(false);
    });
  });

  describe("normalizeMeetingDate", () => {
    it("trims whitespace", () => {
      expect(normalizeMeetingDate("  2026-08-19  ")).toBe("2026-08-19");
    });
  });

  describe("canTransitionMeetingStatus", () => {
    it("allows SCHEDULED to COMPLETED", () => {
      expect(canTransitionMeetingStatus("SCHEDULED", "COMPLETED")).toBe(true);
    });

    it("allows SCHEDULED to CANCELED", () => {
      expect(canTransitionMeetingStatus("SCHEDULED", "CANCELED")).toBe(true);
    });

    it("allows same status (no-op)", () => {
      expect(canTransitionMeetingStatus("SCHEDULED", "SCHEDULED")).toBe(true);
      expect(canTransitionMeetingStatus("COMPLETED", "COMPLETED")).toBe(true);
      expect(canTransitionMeetingStatus("CANCELED", "CANCELED")).toBe(true);
    });

    it("rejects COMPLETED to anything", () => {
      expect(canTransitionMeetingStatus("COMPLETED", "SCHEDULED")).toBe(false);
      expect(canTransitionMeetingStatus("COMPLETED", "CANCELED")).toBe(false);
    });

    it("rejects CANCELED to anything", () => {
      expect(canTransitionMeetingStatus("CANCELED", "SCHEDULED")).toBe(false);
      expect(canTransitionMeetingStatus("CANCELED", "COMPLETED")).toBe(false);
    });
  });

  describe("isMeetingEditable", () => {
    it("returns true for SCHEDULED", () => {
      expect(isMeetingEditable("SCHEDULED")).toBe(true);
    });

    it("returns false for terminal statuses", () => {
      expect(isMeetingEditable("COMPLETED")).toBe(false);
      expect(isMeetingEditable("CANCELED")).toBe(false);
    });
  });

  describe("isTerminalStatus", () => {
    it("identifies terminal statuses", () => {
      expect(isTerminalStatus("COMPLETED")).toBe(true);
      expect(isTerminalStatus("CANCELED")).toBe(true);
      expect(isTerminalStatus("SCHEDULED")).toBe(false);
    });
  });

  describe("isValidCancellationReason", () => {
    it("accepts valid text", () => {
      expect(isValidCancellationReason("Building unavailable")).toBe(true);
    });

    it("rejects empty string", () => {
      expect(isValidCancellationReason("")).toBe(false);
      expect(isValidCancellationReason("   ")).toBe(false);
    });

    it("rejects string exceeding max length", () => {
      expect(isValidCancellationReason("x".repeat(1001))).toBe(false);
    });
  });

  describe("normalizeCancellationReason", () => {
    it("trims and collapses whitespace", () => {
      expect(normalizeCancellationReason("  reason  with   spaces  ")).toBe(
        "reason with spaces"
      );
    });
  });

  describe("normalizeObservations", () => {
    it("trims and collapses whitespace", () => {
      expect(normalizeObservations("  text  with   spaces  ")).toBe(
        "text with spaces"
      );
    });
  });
});
