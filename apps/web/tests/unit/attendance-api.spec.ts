import type { ApiClient } from "@/src/shared/api/api-client";
import { addAttendanceVisitor, getAttendance, removeAttendanceVisitor, saveAttendance } from "@/src/features/attendance/api/attendance-api";

const snapshot = {
  meeting: { id: "11111111-1111-4111-8111-111111111111", cellId: "22222222-2222-4222-8222-222222222222", cellName: "Esperança", meetingDate: "2026-08-22", status: "SCHEDULED" },
  revision: 0, isReadOnly: false, canEdit: true, participants: [], visitors: [],
  summary: { eligibleCount: 0, presentParticipants: 0, absentParticipants: 0, excusedParticipants: 0, unmarkedParticipants: 0, visitorCount: 0, totalPresent: 0, markingProgress: null, attendancePercentage: null, isOperational: true }
} as const;

describe("attendance API", () => {
  const request = jest.fn();
  const api = { request } as unknown as ApiClient;
  beforeEach(() => {
    request.mockReset();
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: { randomUUID: () => "44444444-4444-4444-8444-444444444444" } });
  });

  it("uses one GET snapshot and one PUT batch", async () => {
    request.mockResolvedValue({ data: snapshot, meta: {} });
    await getAttendance(api, snapshot.meeting.cellId, snapshot.meeting.id);
    await saveAttendance(api, snapshot.meeting.cellId, snapshot.meeting.id, { expectedRevision: 0, attendance: [] });
    expect(request.mock.calls.map(([options]) => options.method)).toEqual(["GET", "PUT"]);
  });

  it("uses visitor endpoints without sending churchId", async () => {
    request.mockResolvedValueOnce({ data: snapshot, meta: {} }).mockResolvedValueOnce(undefined);
    await addAttendanceVisitor(api, snapshot.meeting.cellId, snapshot.meeting.id, { kind: "quick-create", name: "Visitante" });
    await removeAttendanceVisitor(api, snapshot.meeting.cellId, snapshot.meeting.id, "33333333-3333-4333-8333-333333333333");
    expect(request.mock.calls[0]?.[0]).not.toHaveProperty("body.churchId");
    expect(request.mock.calls[1]?.[0].method).toBe("DELETE");
  });
});
