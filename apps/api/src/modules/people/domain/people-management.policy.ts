import type { AuthenticatedPrincipal, Policy } from "@mission-atos/domain";

export interface PersonAuthorizationResource {
  churchId: string;
}

export class ViewPersonPolicy implements Policy<PersonAuthorizationResource> {
  evaluate(principal: AuthenticatedPrincipal, resource: PersonAuthorizationResource): boolean {
    return principal.churchId === resource.churchId;
  }
}

export class ViewInactivePeoplePolicy {
  evaluate(principal: AuthenticatedPrincipal): boolean {
    return principal.roles.includes("ADMIN");
  }
}

export class ViewPersonObservationsPolicy {
  evaluate(principal: AuthenticatedPrincipal): boolean {
    return principal.roles.some((role) => role === "ADMIN" || role === "PASTOR");
  }
}

export class ManagePersonPolicy {
  evaluate(principal: AuthenticatedPrincipal, currentRole: boolean): boolean {
    return currentRole && principal.roles.some((role) => role === "ADMIN" || role === "PASTOR");
  }
}

export class ManagePersonStatusPolicy {
  evaluate(principal: AuthenticatedPrincipal, currentRole: boolean): boolean {
    return currentRole && principal.roles.includes("ADMIN");
  }
}
