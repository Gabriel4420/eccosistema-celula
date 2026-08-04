import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { UserManagementError } from "./user-management.error";
import type { UserManagementRepository } from "./user-management.port";
import type {
  ListUsersInput,
  ManagedRole,
  ManagedUser,
  UserPage
} from "./user-management.types";
import type { UserManagementAuthorization } from "./user-management.authorization";

export class UserManagementQueries {
  constructor(
    private readonly users: UserManagementRepository,
    private readonly authorization: UserManagementAuthorization
  ) {}

  async list(
    principal: AuthenticatedPrincipal,
    query: ListUsersInput
  ): Promise<UserPage> {
    await this.authorization.assertAdministrator(principal);
    return this.users.list(principal.churchId, query);
  }

  async managedRoles(
    principal: AuthenticatedPrincipal
  ): Promise<ManagedRole[]> {
    await this.authorization.assertAdministrator(principal);
    return this.users.managedRoles(principal.churchId);
  }

  async get(
    principal: AuthenticatedPrincipal,
    userId: string
  ): Promise<ManagedUser> {
    await this.authorization.assertAdministrator(principal);
    const user = await this.findOrThrow(principal.churchId, userId);
    this.authorization.assertResource(principal, user);
    return user;
  }

  getOwn(principal: AuthenticatedPrincipal): Promise<ManagedUser> {
    return this.findOrThrow(principal.churchId, principal.userId);
  }

  private async findOrThrow(
    churchId: string,
    userId: string
  ): Promise<ManagedUser> {
    const user = await this.users.find(churchId, userId);
    if (!user) {
      throw new UserManagementError("USER_NOT_FOUND", "User not found");
    }
    return user;
  }
}
