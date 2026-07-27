import type {
  AuthenticatedPrincipal,
  AuthorizationResource,
  Policy
} from "@mission-atos/domain";

export class ViewChurchPolicy implements Policy<AuthorizationResource> {
  evaluate(
    principal: AuthenticatedPrincipal,
    resource: AuthorizationResource
  ): boolean {
    return principal.churchId === resource.churchId;
  }
}

export class ManageChurchPolicy {
  evaluate(
    principal: AuthenticatedPrincipal,
    isActiveAdministrator: boolean
  ): boolean {
    return (
      principal.roles.includes("ADMIN") &&
      isActiveAdministrator
    );
  }
}

