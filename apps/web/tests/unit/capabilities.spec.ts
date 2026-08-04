import { capabilitiesFor } from "@/src/shared/auth/capabilities";

describe("capabilitiesFor", () => {
  it("denies everything by default (fail-closed)", () => {
    expect(capabilitiesFor(null)).toEqual({
      manageUsers: false,
      editChurch: false,
      listInactivePeople: false,
      editPeople: false,
      changePersonStatus: false,
      viewPersonObservations: false
    });
  });

  it("grants only the capabilities of the known roles", () => {
    const capabilities = capabilitiesFor({
      userId: "u",
      churchId: "c",
      roles: ["ADMIN"]
    });
    expect(capabilities).toEqual({
      manageUsers: true,
      editChurch: true,
      listInactivePeople: true,
      editPeople: true,
      changePersonStatus: true,
      viewPersonObservations: true
    });
  });

  it("separates pastor-only person editing from admin status control", () => {
    const pastor = capabilitiesFor({ userId: "u", churchId: "c", roles: ["PASTOR"] });
    expect(pastor.editPeople).toBe(true);
    expect(pastor.manageUsers).toBe(false);
    expect(pastor.changePersonStatus).toBe(false);
    expect(pastor.listInactivePeople).toBe(false);
  });

  it("treats unknown roles as read-only person viewers", () => {
    const leader = capabilitiesFor({ userId: "u", churchId: "c", roles: ["LEADER"] });
    expect(leader.editPeople).toBe(false);
    expect(leader.viewPersonObservations).toBe(false);
    expect(leader.manageUsers).toBe(false);
  });
});
