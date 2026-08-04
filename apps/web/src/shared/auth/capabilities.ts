import { ROLE_ADMIN, ROLE_PASTOR } from "./session";
import type { SessionPrincipal } from "./session";

export interface Capabilities {
  readonly manageUsers: boolean;
  readonly editChurch: boolean;
  readonly listInactivePeople: boolean;
  readonly editPeople: boolean;
  readonly changePersonStatus: boolean;
  readonly viewPersonObservations: boolean;
}

export function capabilitiesFor(principal: SessionPrincipal | null): Capabilities {
  const roles = principal ? principal.roles : [];
  return {
    manageUsers: hasRole(roles, ROLE_ADMIN),
    editChurch: hasRole(roles, ROLE_ADMIN),
    listInactivePeople: hasRole(roles, ROLE_ADMIN),
    editPeople: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR),
    changePersonStatus: hasRole(roles, ROLE_ADMIN),
    viewPersonObservations: hasRole(roles, ROLE_ADMIN) || hasRole(roles, ROLE_PASTOR)
  };
}

function hasRole(roles: readonly string[], role: string): boolean {
  return roles.includes(role);
}
