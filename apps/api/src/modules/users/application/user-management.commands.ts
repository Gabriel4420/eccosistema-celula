import type { AuthenticatedPrincipal, UserStatus } from "@mission-atos/domain";
import { managedRoleNames } from "@mission-atos/contracts";
import type { PasswordHasher } from "../../identity/application/ports";
import type {
  UserManagementTransaction,
  UserManagementUnitOfWork
} from "./user-management.port";
import type {
  CreateUserInput,
  ManagedUser,
  UpdateOwnProfileInput,
  UpdateUserInput
} from "./user-management.types";
import type { ProfilePhoto } from "./user-management.types";
import type { UserManagementAuthorization } from "./user-management.authorization";
import { UserManagementError } from "./user-management.error";
import {
  ManageRolePolicy,
  PreserveLastAdministratorPolicy
} from "../domain/user-management.policy";

export class UserManagementCommands {
  constructor(
    private readonly unitOfWork: UserManagementUnitOfWork,
    private readonly passwords: PasswordHasher,
    private readonly authorization: UserManagementAuthorization,
    private readonly manageRoles = new ManageRolePolicy(managedRoleNames),
    private readonly preserveLastAdministrator = new PreserveLastAdministratorPolicy()
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    input: CreateUserInput
  ): Promise<ManagedUser> {
    await this.authorization.assertAdministrator(principal);
    const passwordHash = await this.passwords.hash(input.initialPassword);
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      await this.assertRoles(transaction, input.roleIds);
      const user = await transaction.createUser({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        roleIds: input.roleIds
      });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: user.id,
        action: "USER_CREATED",
        after: publicAudit(user)
      });
      return user;
    });
  }

  async update(
    principal: AuthenticatedPrincipal,
    userId: string,
    input: UpdateUserInput
  ): Promise<ManagedUser> {
    await this.authorization.assertAdministrator(principal);
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      const before = await this.requireUser(transaction, userId);
      this.authorization.assertResource(principal, before);
      const user = await transaction.updateUser({ ...input, userId });
      const changes = changedFields(before, user, [
        "firstName",
        "lastName",
        "email"
      ]);
      if (changes) {
        await transaction.recordAudit({
          actorId: principal.userId,
          entityId: userId,
          action: "USER_UPDATED",
          ...changes
        });
      }
      return user;
    });
  }

  async updateOwn(
    principal: AuthenticatedPrincipal,
    input: UpdateOwnProfileInput
  ): Promise<ManagedUser> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const before = await this.requireUser(transaction, principal.userId);
      const user = await transaction.updateUser({
        ...input,
        userId: principal.userId
      });
      const changes = changedFields(before, user, ["firstName", "lastName"]);
      if (changes) {
        await transaction.recordAudit({
          actorId: principal.userId,
          entityId: principal.userId,
          action: "USER_PROFILE_UPDATED",
          ...changes
        });
      }
      return user;
    });
  }

  async updateOwnProfilePhoto(
    principal: AuthenticatedPrincipal,
    photo: ProfilePhoto | null
  ): Promise<ManagedUser> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const before = await this.requireUser(transaction, principal.userId);
      const user = await transaction.updateProfilePhoto({ userId: principal.userId, photo });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: principal.userId,
        action: photo ? "USER_PROFILE_PHOTO_UPDATED" : "USER_PROFILE_PHOTO_REMOVED",
        before: { hasProfilePhoto: before.hasProfilePhoto },
        after: { hasProfilePhoto: user.hasProfilePhoto }
      });
      return user;
    });
  }

  async updateStatus(
    principal: AuthenticatedPrincipal,
    userId: string,
    status: UserStatus
  ): Promise<ManagedUser> {
    await this.authorization.assertAdministrator(principal);
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      const before = await this.requireUser(transaction, userId);
      this.authorization.assertResource(principal, before);
      if (before.status === status) return before;
      if (status === "BLOCKED") {
        await this.assertCanRemoveActiveAdministrator(transaction, before);
      }
      const user = await transaction.updateStatus({ userId, status });
      if (status === "BLOCKED") {
        await transaction.revokeSessions({ userId, reason: "USER_INACTIVE" });
      }
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: userId,
        action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        before: { status: before.status },
        after: { status }
      });
      return user;
    });
  }

  async replaceRoles(
    principal: AuthenticatedPrincipal,
    userId: string,
    roleIds: string[]
  ): Promise<ManagedUser> {
    await this.authorization.assertAdministrator(principal);
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      const before = await this.requireUser(transaction, userId);
      this.authorization.assertResource(principal, before);
      const roles = await this.assertRoles(transaction, roleIds);
      if (
        before.roles.some((role) => role.name === "ADMIN") &&
        !roles.some((role) => role.name === "ADMIN")
      ) {
        await this.assertCanRemoveActiveAdministrator(transaction, before);
      }
      const user = await transaction.replaceRoles({ userId, roleIds });
      const beforeIds = new Set(before.roles.map((role) => role.id));
      const afterIds = new Set(user.roles.map((role) => role.id));
      for (const role of user.roles.filter((role) => !beforeIds.has(role.id))) {
        await transaction.recordAudit({
          actorId: principal.userId,
          entityId: userId,
          action: "USER_ROLE_ASSIGNED",
          after: { roleId: role.id }
        });
      }
      for (const role of before.roles.filter((role) => !afterIds.has(role.id))) {
        await transaction.recordAudit({
          actorId: principal.userId,
          entityId: userId,
          action: "USER_ROLE_REMOVED",
          after: { roleId: role.id }
        });
      }
      return user;
    });
  }

  async resetPassword(
    principal: AuthenticatedPrincipal,
    userId: string,
    newPassword: string
  ): Promise<void> {
    await this.authorization.assertAdministrator(principal);
    const passwordHash = await this.passwords.hash(newPassword);
    await this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertCurrentAdministrator(transaction, principal);
      const user = await this.requireUser(transaction, userId);
      this.authorization.assertResource(principal, user);
      await transaction.updatePassword({ userId, passwordHash });
      await transaction.revokeSessions({ userId, reason: "PASSWORD_CHANGED" });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: userId,
        action: "USER_PASSWORD_RESET",
        after: { sessionsRevoked: true }
      });
    });
  }

  private async requireUser(
    transaction: UserManagementTransaction,
    userId: string
  ): Promise<ManagedUser> {
    const user = await transaction.findUser(userId);
    if (!user) {
      throw new UserManagementError("USER_NOT_FOUND", "User not found");
    }
    return user;
  }

  private async assertCurrentAdministrator(
    transaction: UserManagementTransaction,
    principal: AuthenticatedPrincipal
  ): Promise<void> {
    this.authorization.assertCurrentAdministrator(
      principal,
      await transaction.isActiveAdministrator(principal.userId)
    );
  }

  private async assertRoles(
    transaction: UserManagementTransaction,
    roleIds: readonly string[]
  ) {
    const roles = await transaction.findRoles(roleIds);
    if (
      roles.length !== roleIds.length ||
      !this.manageRoles.evaluate(roles.map((role) => role.name))
    ) {
      throw new UserManagementError("ROLE_NOT_FOUND", "Role not found");
    }
    return roles;
  }

  private async assertCanRemoveActiveAdministrator(
    transaction: UserManagementTransaction,
    target: ManagedUser
  ): Promise<void> {
    const targetIsAdministrator = target.roles.some(
      (role) => role.name === "ADMIN"
    );
    if (!targetIsAdministrator || target.status !== "ACTIVE") return;

    const allowed = this.preserveLastAdministrator.canRemove({
      targetIsAdministrator,
      targetIsActive: true,
      activeAdministratorCount: await transaction.countActiveAdministrators()
    });
    if (!allowed) {
      throw new UserManagementError(
        "LAST_ACTIVE_ADMIN",
        "The last active administrator must be preserved"
      );
    }
  }
}

function publicAudit(user: ManagedUser) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    roleIds: user.roles.map((role) => role.id)
  };
}

function changedFields(
  before: ManagedUser,
  after: ManagedUser,
  keys: ReadonlyArray<"firstName" | "lastName" | "email">
) {
  const previous: Record<string, string> = {};
  const current: Record<string, string> = {};
  for (const key of keys) {
    if (before[key] !== after[key]) {
      previous[key] = before[key];
      current[key] = after[key];
    }
  }
  return Object.keys(previous).length
    ? { before: previous, after: current }
    : undefined;
}
