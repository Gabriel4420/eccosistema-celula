import { capabilitiesFor } from "@/src/shared/auth/capabilities";

const NO_CELLS = {
  viewCells: false,
  createCells: false,
  editCellGeneralData: false,
  editCellSchedule: false,
  changeCellStatus: false,
  changeCellLeadership: false,
  manageCellMembers: false,
  requiresCellMemberReason: false,
  viewMeetings: false,
  createMeetings: false,
  editMeetings: false,
  changeMeetingStatus: false,
  viewAnalytics: false,
  viewReports: false
};

describe("capabilitiesFor", () => {
  it("denies everything by default (fail-closed)", () => {
    expect(capabilitiesFor(null)).toEqual({
      manageUsers: false,
      editChurch: false,
      listInactivePeople: false,
      editPeople: false,
      changePersonStatus: false,
      viewPersonObservations: false,
      ...NO_CELLS
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
      viewPersonObservations: true,
      ...NO_CELLS,
      viewCells: true,
      createCells: true,
      editCellGeneralData: true,
      editCellSchedule: true,
      changeCellStatus: true,
      changeCellLeadership: true,
      manageCellMembers: true,
      requiresCellMemberReason: false,
      viewMeetings: true,
      createMeetings: true,
      editMeetings: true,
      changeMeetingStatus: true,
      viewAnalytics: true,
      viewReports: true
    });
  });

  it("separates pastor-only person editing from admin status control", () => {
    const pastor = capabilitiesFor({ userId: "u", churchId: "c", roles: ["PASTOR"] });
    expect(pastor.editPeople).toBe(true);
    expect(pastor.manageUsers).toBe(false);
    expect(pastor.changePersonStatus).toBe(false);
    expect(pastor.listInactivePeople).toBe(false);
    expect(pastor.viewCells).toBe(true);
    expect(pastor.createCells).toBe(true);
    expect(pastor.changeCellStatus).toBe(true);
    expect(pastor.changeCellLeadership).toBe(true);
    expect(pastor.requiresCellMemberReason).toBe(true);
    expect(pastor.viewMeetings).toBe(true);
    expect(pastor.createMeetings).toBe(true);
    expect(pastor.editMeetings).toBe(true);
    expect(pastor.changeMeetingStatus).toBe(true);
  });

  it("treats unknown roles as read-only person viewers", () => {
    const leader = capabilitiesFor({ userId: "u", churchId: "c", roles: ["LEADER"] });
    expect(leader.editPeople).toBe(false);
    expect(leader.viewPersonObservations).toBe(false);
    expect(leader.manageUsers).toBe(false);
  });

  it("gives supervisors and leaders cells view and schedule editing only", () => {
    const supervisor = capabilitiesFor({ userId: "u", churchId: "c", roles: ["SUPERVISOR"] });
    expect(supervisor.viewCells).toBe(true);
    expect(supervisor.editCellSchedule).toBe(true);
    expect(supervisor.createCells).toBe(false);
    expect(supervisor.editCellGeneralData).toBe(false);
    expect(supervisor.changeCellStatus).toBe(false);
    expect(supervisor.changeCellLeadership).toBe(false);
    expect(supervisor.manageCellMembers).toBe(true);
    expect(supervisor.requiresCellMemberReason).toBe(false);
    expect(supervisor.viewMeetings).toBe(true);
    expect(supervisor.createMeetings).toBe(false);
    expect(supervisor.editMeetings).toBe(false);
    expect(supervisor.changeMeetingStatus).toBe(false);

    const leader = capabilitiesFor({ userId: "u", churchId: "c", roles: ["LEADER"] });
    expect(leader.viewCells).toBe(true);
    expect(leader.editCellSchedule).toBe(true);
    expect(leader.createCells).toBe(false);
    expect(leader.editCellGeneralData).toBe(false);
    expect(leader.changeCellStatus).toBe(false);
    expect(leader.changeCellLeadership).toBe(false);
    expect(leader.manageCellMembers).toBe(true);
    expect(leader.requiresCellMemberReason).toBe(true);
    expect(leader.viewMeetings).toBe(true);
    expect(leader.createMeetings).toBe(true);
    expect(leader.editMeetings).toBe(true);
    expect(leader.changeMeetingStatus).toBe(true);
  });
});
