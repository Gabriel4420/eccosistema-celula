import { AttendancePolicy } from "./attendance.policy";

const base = { churchId: "church", sessionId: "session", email: "user@example.com", status: "ACTIVE" as const };
describe("AttendancePolicy", () => {
  const policy = new AttendancePolicy();
  const scope = { leaderId: "leader", traineeLeaderId: "trainee", supervisorIds: ["supervisor"] };
  it("allows responsible leader to edit and trainee only to view", () => {
    expect(policy.canEdit({ ...base, userId: "leader", roles: ["LEADER"] }, scope)).toBe(true);
    expect(policy.canView({ ...base, userId: "trainee", roles: ["LEADER"] }, scope)).toBe(true);
    expect(policy.canEdit({ ...base, userId: "trainee", roles: ["LEADER"] }, scope)).toBe(false);
  });
  it("allows supervisor to view assigned cells only", () => {
    expect(policy.canView({ ...base, userId: "supervisor", roles: ["SUPERVISOR"] }, scope)).toBe(true);
    expect(policy.canEdit({ ...base, userId: "supervisor", roles: ["SUPERVISOR"] }, scope)).toBe(false);
  });
});
