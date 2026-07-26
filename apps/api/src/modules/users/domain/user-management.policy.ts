import type { AuthenticatedPrincipal, AuthorizationResource, Policy } from "@mission-atos/domain";

export class ManageUserPolicy implements Policy<unknown> {
  evaluate(
    principal: AuthenticatedPrincipal,
    resource?: unknown
  ): boolean {
    return (
      principal.roles.includes("ADMIN") &&
      isAuthorizationResource(resource) &&
      principal.churchId === resource.churchId
    );
  }
}

function isAuthorizationResource(value: unknown): value is AuthorizationResource {
  return (
    typeof value === "object" &&
    value !== null &&
    "churchId" in value &&
    typeof value.churchId === "string"
  );
}

export class ManageRolePolicy {
  constructor(private readonly managedRoleNames: readonly string[]) {}

  evaluate(roleNames: readonly string[]): boolean {
    return roleNames.every((role) => this.managedRoleNames.includes(role));
  }
}

export class PreserveLastAdministratorPolicy {
  canRemove(input: {
    targetIsAdministrator: boolean;
    targetIsActive: boolean;
    activeAdministratorCount: number;
  }): boolean {
    return (
      !input.targetIsAdministrator ||
      !input.targetIsActive ||
      input.activeAdministratorCount > 1
    );
  }
}
