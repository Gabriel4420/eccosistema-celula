import { createMeetingVisitorRequestSchema, saveAttendanceRequestSchema } from "./attendance";

describe("attendance contracts", () => {
  it("rejects duplicate person ids", () => {
    const personId = "11111111-1111-4111-8111-111111111111";
    expect(saveAttendanceRequestSchema.safeParse({ expectedRevision: 0, attendance: [{ personId, status: "PRESENT" }, { personId, status: "ABSENT" }] }).success).toBe(false);
  });

  it("rejects more than 500 entries", () => {
    const attendance = Array.from({ length: 501 }, (_, index) => ({ personId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, status: "PRESENT" }));
    expect(saveAttendanceRequestSchema.safeParse({ expectedRevision: 0, attendance }).success).toBe(false);
  });

  it("accepts quick visitor with only a name", () => {
    expect(createMeetingVisitorRequestSchema.safeParse({ kind: "quick-create", name: "Visitante" }).success).toBe(true);
  });
});
