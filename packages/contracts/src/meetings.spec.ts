import {
  createMeetingRequestSchema,
  listMeetingsQuerySchema,
  meetingCellParamsSchema,
  meetingParamsSchema,
  updateMeetingRequestSchema,
  updateMeetingStatusRequestSchema,
  meetingReportDraftRequestSchema
} from "./meetings";

const UUID1 = "10000000-0000-4000-8000-000000000001";
const UUID2 = "20000000-0000-4000-8000-000000000002";

describe("meeting contracts", () => {
  describe("meetingCellParamsSchema", () => {
    it("accepts a valid UUID", () => {
      expect(meetingCellParamsSchema.parse({ cellId: UUID1 })).toEqual({ cellId: UUID1 });
    });

    it("rejects invalid UUID", () => {
      expect(() => meetingCellParamsSchema.parse({ cellId: "not-a-uuid" })).toThrow();
    });

    it("rejects extra fields", () => {
      expect(() =>
        meetingCellParamsSchema.parse({
          cellId: UUID1,
          extra: true
        })
      ).toThrow();
    });
  });

  describe("meetingParamsSchema", () => {
    it("accepts valid cellId and meetingId", () => {
      const result = meetingParamsSchema.parse({
        cellId: UUID1,
        meetingId: UUID2
      });
      expect(result.cellId).toBe(UUID1);
      expect(result.meetingId).toBe(UUID2);
    });
  });

  describe("listMeetingsQuerySchema", () => {
    it("applies defaults", () => {
      const result = listMeetingsQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.sortOrder).toBe("desc");
    });

    it("accepts valid status filter", () => {
      const result = listMeetingsQuerySchema.parse({ status: "SCHEDULED" });
      expect(result.status).toBe("SCHEDULED");
    });

    it("accepts valid date range", () => {
      const result = listMeetingsQuerySchema.parse({
        from: "2026-01-01",
        to: "2026-12-31"
      });
      expect(result.from).toBe("2026-01-01");
      expect(result.to).toBe("2026-12-31");
    });

    it("rejects from > to", () => {
      expect(() =>
        listMeetingsQuerySchema.parse({ from: "2026-12-31", to: "2026-01-01" })
      ).toThrow();
    });

    it("rejects invalid date format", () => {
      expect(() =>
        listMeetingsQuerySchema.parse({ from: "01-01-2026" })
      ).toThrow();
    });

    it("rejects invalid status", () => {
      expect(() =>
        listMeetingsQuerySchema.parse({ status: "INVALID" })
      ).toThrow();
    });
  });

  describe("createMeetingRequestSchema", () => {
    it("accepts a valid date", () => {
      const result = createMeetingRequestSchema.parse({ meetingDate: "2026-08-19" });
      expect(result.meetingDate).toBe("2026-08-19");
    });

    it("trims whitespace", () => {
      const result = createMeetingRequestSchema.parse({ meetingDate: "  2026-08-19  " });
      expect(result.meetingDate).toBe("2026-08-19");
    });

    it("rejects invalid calendar date", () => {
      expect(() =>
        createMeetingRequestSchema.parse({ meetingDate: "2026-02-30" })
      ).toThrow();
    });

    it("rejects extra fields", () => {
      expect(() =>
        createMeetingRequestSchema.parse({
          meetingDate: "2026-08-19",
          status: "COMPLETED"
        })
      ).toThrow();
    });
  });

  describe("updateMeetingRequestSchema", () => {
    it("accepts a valid date", () => {
      const result = updateMeetingRequestSchema.parse({ meetingDate: "2026-09-01" });
      expect(result.meetingDate).toBe("2026-09-01");
    });
  });

  describe("updateMeetingStatusRequestSchema", () => {
    it("accepts COMPLETED without reason", () => {
      const result = updateMeetingStatusRequestSchema.parse({ status: "COMPLETED" });
      expect(result.status).toBe("COMPLETED");
    });

    it("accepts CANCELED with reason", () => {
      const result = updateMeetingStatusRequestSchema.parse({
        status: "CANCELED",
        cancellationReason: "Church building unavailable"
      });
      expect(result.status).toBe("CANCELED");
      expect(result.cancellationReason).toBe("Church building unavailable");
    });

    it("rejects CANCELED without reason", () => {
      expect(() =>
        updateMeetingStatusRequestSchema.parse({ status: "CANCELED" })
      ).toThrow();
    });

    it("rejects SCHEDULED as target", () => {
      expect(() =>
        updateMeetingStatusRequestSchema.parse({ status: "SCHEDULED" })
      ).toThrow();
    });
  });

  describe("meetingReportDraftRequestSchema", () => {
    it("accepts observations", () => {
      const result = meetingReportDraftRequestSchema.parse({
        observations: "Great meeting today"
      });
      expect(result.observations).toBe("Great meeting today");
    });

    it("accepts null observations", () => {
      const result = meetingReportDraftRequestSchema.parse({ observations: null });
      expect(result.observations).toBeNull();
    });

    it("rejects extra fields", () => {
      expect(() =>
        meetingReportDraftRequestSchema.parse({
          observations: "test",
          status: "SUBMITTED"
        })
      ).toThrow();
    });
  });
});
