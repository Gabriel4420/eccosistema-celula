import {
  pendingReportsQuerySchema,
  attendanceSummaryQuerySchema,
  attendanceDetailQuerySchema,
  visitorsQuerySchema,
  meetingsReportQuerySchema,
  exportCellsQuerySchema,
  exportPeopleQuerySchema,
  exportAttendanceQuerySchema,
  exportMeetingsQuerySchema
} from "./reports";

describe("reports contracts", () => {
  describe("pendingReportsQuerySchema", () => {
    it("accepts empty query", () => {
      expect(pendingReportsQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    });

    it("accepts valid period", () => {
      const result = pendingReportsQuerySchema.parse({ from: "2026-01-01", to: "2026-01-31" });
      expect(result.from).toBe("2026-01-01");
      expect(result.to).toBe("2026-01-31");
    });

    it("rejects from without to", () => {
      expect(() => pendingReportsQuerySchema.parse({ from: "2026-01-01" })).toThrow();
    });

    it("rejects to without from", () => {
      expect(() => pendingReportsQuerySchema.parse({ to: "2026-01-31" })).toThrow();
    });

    it("rejects from > to", () => {
      expect(() => pendingReportsQuerySchema.parse({ from: "2026-02-01", to: "2026-01-01" })).toThrow();
    });

    it("accepts status filter", () => {
      const result = pendingReportsQuerySchema.parse({ status: "RETURNED" });
      expect(result.status).toBe("RETURNED");
    });

    it("accepts cellId filter", () => {
      const cellId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const result = pendingReportsQuerySchema.parse({ cellId });
      expect(result.cellId).toBe(cellId);
    });

    it("rejects unknown fields", () => {
      expect(() => pendingReportsQuerySchema.parse({ unknown: true })).toThrow();
    });

    it("coerces page and pageSize from strings", () => {
      const result = pendingReportsQuerySchema.parse({ page: "2", pageSize: "50" });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(50);
    });
  });

  describe("attendanceSummaryQuerySchema", () => {
    it("accepts empty query", () => {
      expect(attendanceSummaryQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    });

    it("accepts health filter", () => {
      const result = attendanceSummaryQuerySchema.parse({ health: "critical" });
      expect(result.health).toBe("critical");
    });

    it("accepts status filter", () => {
      const result = attendanceSummaryQuerySchema.parse({ status: "ACTIVE" });
      expect(result.status).toBe("ACTIVE");
    });
  });

  describe("attendanceDetailQuerySchema", () => {
    it("requires cellId", () => {
      expect(() => attendanceDetailQuerySchema.parse({})).toThrow();
    });

    it("accepts valid cellId", () => {
      const cellId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const result = attendanceDetailQuerySchema.parse({ cellId });
      expect(result.cellId).toBe(cellId);
    });
  });

  describe("visitorsQuerySchema", () => {
    it("accepts empty query", () => {
      expect(visitorsQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    });

    it("accepts contactPending filter", () => {
      const result = visitorsQuerySchema.parse({ contactPending: "true" });
      expect(result.contactPending).toBe(true);
    });
  });

  describe("meetingsReportQuerySchema", () => {
    it("accepts empty query", () => {
      expect(meetingsReportQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    });

    it("accepts status filter", () => {
      const result = meetingsReportQuerySchema.parse({ status: "COMPLETED" });
      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("export schemas", () => {
    it("exportCellsQuerySchema accepts csv and defaults locale", () => {
      expect(exportCellsQuerySchema.parse({ format: "csv" })).toEqual({ format: "csv", locale: "pt-BR" });
    });

    it("exportCellsQuerySchema accepts xlsx", () => {
      expect(exportCellsQuerySchema.parse({ format: "xlsx" })).toEqual({ format: "xlsx", locale: "pt-BR" });
    });

    it("exportCellsQuerySchema accepts pdf", () => {
      expect(exportCellsQuerySchema.parse({ format: "pdf" })).toEqual({ format: "pdf", locale: "pt-BR" });
    });

    it("exportCellsQuerySchema rejects invalid format", () => {
      expect(() => exportCellsQuerySchema.parse({ format: "doc" })).toThrow();
    });

    it("exportPeopleQuerySchema defaults status to ACTIVE", () => {
      const result = exportPeopleQuerySchema.parse({ format: "csv" });
      expect(result.status).toBe("ACTIVE");
    });

    it("exportAttendanceQuerySchema accepts period", () => {
      const result = exportAttendanceQuerySchema.parse({ format: "csv", from: "2026-01-01", to: "2026-01-31" });
      expect(result.from).toBe("2026-01-01");
    });

    it("exportMeetingsQuerySchema accepts cellId", () => {
      const cellId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const result = exportMeetingsQuerySchema.parse({ format: "pdf", cellId });
      expect(result.cellId).toBe(cellId);
    });
  });
});
