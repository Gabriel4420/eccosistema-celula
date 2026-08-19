import { ROLE_ADMIN, ROLE_PASTOR } from "./session";
import type { SessionPrincipal } from "./session";

export interface Capabilities {
  readonly manageUsers: boolean;
  readonly editChurch: boolean;
  readonly listInactivePeople: boolean;
  readonly editPeople: boolean;
  readonly changePersonStatus: boolean;
  readonly viewPersonObservations: boolean;
  readonly viewCells: boolean;
  readonly createCells: boolean;
  readonly editCellGeneralData: boolean;
  readonly editCellSchedule: boolean;
  readonly changeCellStatus: boolean;
  readonly changeCellLeadership: boolean;
  readonly viewMeetings: boolean;
  readonly createMeetings: boolean;
  readonly editMeetings: boolean;
  readonly changeMeetingStatus: boolean;
}

export function capabilitiesFor(principal: SessionPrincipal | null): Capabilities {
  const roles = principal ? principal.roles : [];
  return {
    manageUsers: hasRole(roles, ROLE_ADMIN),
    editChurch: hasRole(roles, ROLE_ADMIN),
    listInactivePeople: hasRole(roles, ROLE_ADMIN),
    editPeople: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    changePersonStatus: hasRole(roles, ROLE_ADMIN),
    viewPersonObservations: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    viewCells: principal !== null,
    createCells: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    editCellGeneralData: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    editCellSchedule: principal !== null,
    changeCellStatus: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    changeCellLeadership: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    viewMeetings: principal !== null,
    createMeetings: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR) || hasRole(roles, "LEADER"),
    editMeetings: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR) || hasRole(roles, "LEADER"),
    changeMeetingStatus: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR) || hasRole(roles, "LEADER")
  };
}

function hasRole(roles: readonly string[], role: string): boolean {
  return roles.includes(role);
}
