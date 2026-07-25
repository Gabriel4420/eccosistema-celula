export interface AuthenticatedPrincipal {
  userId: string;
  churchId: string;
  sessionId: string;
  roles: readonly string[];
}

export interface AuthorizationResource {
  churchId: string;
}

export interface Policy<TResource = void> {
  evaluate(
    principal: AuthenticatedPrincipal,
    resource: TResource
  ): boolean | Promise<boolean>;
}

export function belongsToPrincipalChurch(
  principal: AuthenticatedPrincipal,
  resource: AuthorizationResource
): boolean {
  return principal.churchId === resource.churchId;
}
