import { attendanceStatuses, daysOfWeek, userStatuses } from "./enums";

describe("domain enums", () => {
  it("exposes only the initial persistence states", () => {
    expect(userStatuses).toEqual(["ACTIVE", "BLOCKED"]);
    expect(attendanceStatuses).toEqual(["PRESENT", "ABSENT", "EXCUSED"]);
    expect(daysOfWeek).toHaveLength(7);
  });
});
