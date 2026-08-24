import { calculateAttendanceSummary, canEditAttendance } from "./attendance";

describe("attendance rules", () => {
  it("keeps visitors outside the denominator", () => {
    expect(calculateAttendanceSummary(["PRESENT", "ABSENT", "EXCUSED", "UNMARKED"], 2, "COMPLETED")).toEqual({
      eligibleCount: 4,
      presentParticipants: 1,
      absentParticipants: 1,
      excusedParticipants: 1,
      unmarkedParticipants: 1,
      visitorCount: 2,
      totalPresent: 3,
      markingProgress: 75,
      attendancePercentage: 25,
      isOperational: true
    });
  });

  it("uses null percentages for an empty eligible list", () => {
    expect(calculateAttendanceSummary([], 1, "CANCELED")).toMatchObject({ markingProgress: null, attendancePercentage: null, isOperational: false });
  });

  it("allows drafts for scheduled and completed meetings", () => {
    expect(canEditAttendance("SCHEDULED")).toBe(true);
    expect(canEditAttendance("COMPLETED")).toBe(true);
    expect(canEditAttendance("CANCELED")).toBe(false);
  });
});
