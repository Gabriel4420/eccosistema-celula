import type { PasswordHasher } from "../../identity/application/ports";
import type {
  UserManagementRepository,
  UserManagementTransaction,
  UserManagementUnitOfWork
} from "./user-management.port";
import { UserManagementAuthorization } from "./user-management.authorization";
import { UserManagementCommands } from "./user-management.commands";
import { UserManagementQueries } from "./user-management.queries";
import { ManageUserPolicy } from "../domain/user-management.policy";
import type { ManagedUser } from "./user-management.types";

describe("user management application", () => {
  const principal = {
    userId: "00000000-0000-4000-8000-000000000001",
    churchId: "00000000-0000-4000-8000-000000000002",
    sessionId: "session",
    roles: ["ADMIN"]
  };

  it("hashes the initial password and derives tenant and actor from principal", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction, execute } = unitOfWorkMock();
    const passwords = passwordMock();
    const { commands } = application(repository, unitOfWork, passwords);
    await commands.create(principal, {
      firstName: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      initialPassword: "safe-password-123",
      roleIds: []
    });
    expect(transaction.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: "encoded"
      })
    );
    expect(execute).toHaveBeenCalledWith(
      principal.churchId,
      expect.any(Function)
    );
  });

  it("rejects an administrator whose current database role is inactive", async () => {
    const repository = repositoryMock();
    repository.isActiveAdministrator.mockResolvedValue(false);
    const { unitOfWork } = unitOfWorkMock();
    const { queries } = application(repository, unitOfWork, passwordMock());
    await expect(queries.list(principal, { page: 1, pageSize: 20 })).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN"
    });
  });

  it("derives the target for own-profile updates from the principal", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    const { commands } = application(repository, unitOfWork, passwordMock());
    await commands.updateOwn(principal, { firstName: "Updated" });
    expect(transaction.updateUser).toHaveBeenCalledWith({
      userId: principal.userId,
      firstName: "Updated"
    });
  });

  it("audits only fields changed by a profile update", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.updateUser.mockResolvedValue(
      managedUser({ firstName: "Updated" })
    );
    const { commands } = application(repository, unitOfWork, passwordMock());

    await commands.updateOwn(principal, { firstName: "Updated" });

    expect(transaction.recordAudit).toHaveBeenCalledWith({
      actorId: principal.userId,
      entityId: principal.userId,
      action: "USER_PROFILE_UPDATED",
      before: { firstName: "Ana" },
      after: { firstName: "Updated" }
    });
  });

  it("updates only the authenticated user's photo and audits metadata", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.updateProfilePhoto.mockResolvedValue(managedUser({
      hasProfilePhoto: true,
      profilePhotoUpdatedAt: new Date()
    }));
    const { commands } = application(repository, unitOfWork, passwordMock());
    const photo = { contentType: "image/jpeg" as const, data: new Uint8Array([0xff, 0xd8, 0xff]) };

    await commands.updateOwnProfilePhoto(principal, photo);

    expect(transaction.updateProfilePhoto).toHaveBeenCalledWith({ userId: principal.userId, photo });
    expect(transaction.recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      actorId: principal.userId,
      entityId: principal.userId,
      action: "USER_PROFILE_PHOTO_UPDATED",
      after: { hasProfilePhoto: true }
    }));
  });

  it("applies the resource policy to the user actually loaded", async () => {
    const repository = repositoryMock();
    repository.find.mockResolvedValue(
      managedUser({ churchId: "00000000-0000-4000-8000-000000000099" })
    );
    const { unitOfWork } = unitOfWorkMock();
    const { queries } = application(repository, unitOfWork, passwordMock());

    await expect(queries.get(principal, "target")).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN"
    });
  });

  it("coordinates status effects atomically after policy approval", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.findUser.mockResolvedValueOnce(managedUser({
      roles: [{ id: "admin-role", name: "ADMIN" }]
    }));
    transaction.countActiveAdministrators.mockResolvedValue(2);
    const { commands } = application(repository, unitOfWork, passwordMock());
    await commands.updateStatus(principal, "target", "BLOCKED");
    expect(transaction.updateStatus).toHaveBeenCalledWith({
      userId: "target",
      status: "BLOCKED"
    });
    expect(transaction.revokeSessions).toHaveBeenCalledWith({
      userId: "target",
      reason: "USER_INACTIVE"
    });
    expect(transaction.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: principal.userId,
        action: "USER_DEACTIVATED"
      })
    );
  });

  it("does not request effects when preserving the last administrator fails", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.findUser.mockResolvedValueOnce(managedUser({
      roles: [{ id: "admin-role", name: "ADMIN" }]
    }));
    transaction.countActiveAdministrators.mockResolvedValue(1);
    const { commands } = application(repository, unitOfWork, passwordMock());

    await expect(
      commands.updateStatus(principal, "target", "BLOCKED")
    ).rejects.toMatchObject({ code: "LAST_ACTIVE_ADMIN" });
    expect(transaction.updateStatus).not.toHaveBeenCalled();
    expect(transaction.revokeSessions).not.toHaveBeenCalled();
    expect(transaction.recordAudit).not.toHaveBeenCalled();
  });

  it("revalidates administrator authority inside the unit of work", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.isActiveAdministrator.mockResolvedValue(false);
    const { commands } = application(repository, unitOfWork, passwordMock());

    await expect(
      commands.updateStatus(principal, "target", "BLOCKED")
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN" });
    expect(transaction.findUser).not.toHaveBeenCalled();
    expect(transaction.updateStatus).not.toHaveBeenCalled();
    expect(transaction.recordAudit).not.toHaveBeenCalled();
  });

  it("validates managed roles before replacing relations or writing audits", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.findRoles.mockResolvedValue([{ id: "role", name: "UNKNOWN" }]);
    const { commands } = application(repository, unitOfWork, passwordMock());

    await expect(
      commands.replaceRoles(principal, "target", ["role"])
    ).rejects.toMatchObject({ code: "ROLE_NOT_FOUND" });
    expect(transaction.replaceRoles).not.toHaveBeenCalled();
    expect(transaction.recordAudit).not.toHaveBeenCalled();
  });

  it("coordinates role persistence and audit inside one unit of work", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    transaction.findRoles.mockResolvedValue([{ id: "role", name: "LEADER" }]);
    transaction.replaceRoles.mockResolvedValue(managedUser({
      roles: [{ id: "role", name: "LEADER" }]
    }));
    const { commands } = application(repository, unitOfWork, passwordMock());

    await commands.replaceRoles(principal, "target", ["role"]);
    expect(transaction.replaceRoles).toHaveBeenCalledWith({
      userId: "target",
      roleIds: ["role"]
    });
    expect(transaction.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "USER_ROLE_ASSIGNED" })
    );
  });

  it("hashes administrative password resets without forwarding clear text", async () => {
    const repository = repositoryMock();
    const { unitOfWork, transaction } = unitOfWorkMock();
    const passwords = passwordMock();
    const { commands } = application(repository, unitOfWork, passwords);
    await commands.resetPassword(principal, "target", "new-password-123");
    expect(transaction.updatePassword).toHaveBeenCalledWith({
      userId: "target",
      passwordHash: "encoded"
    });
    expect(transaction.updatePassword).not.toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: "new-password-123" })
    );
    expect(transaction.revokeSessions).toHaveBeenCalledWith({
      userId: "target",
      reason: "PASSWORD_CHANGED"
    });
  });
});

function application(
  repository: jest.Mocked<UserManagementRepository>,
  unitOfWork: UserManagementUnitOfWork,
  passwords: jest.Mocked<PasswordHasher>
) {
  const authorization = new UserManagementAuthorization(
    repository,
    new ManageUserPolicy()
  );
  return {
    commands: new UserManagementCommands(unitOfWork, passwords, authorization),
    queries: new UserManagementQueries(repository, authorization)
  };
}

function repositoryMock(): jest.Mocked<UserManagementRepository> {
  const user = {
    id: "user",
    churchId: "church",
    firstName: "Ana",
    lastName: "Silva",
    email: "ana@example.com",
    status: "ACTIVE" as const,
    hasProfilePhoto: false,
    profilePhotoUpdatedAt: null,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return {
    isActiveAdministrator: jest.fn().mockResolvedValue(true),
    managedRoles: jest.fn().mockResolvedValue([]),
    list: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    listCellAssignmentOptions: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    find: jest.fn().mockResolvedValue(user),
    getProfilePhoto: jest.fn().mockResolvedValue(null)
  };
}

function unitOfWorkMock(): {
  unitOfWork: UserManagementUnitOfWork;
  transaction: jest.Mocked<UserManagementTransaction>;
  execute: jest.Mock;
} {
  const user = managedUser();
  const transaction: jest.Mocked<UserManagementTransaction> = {
    isActiveAdministrator: jest.fn().mockResolvedValue(true),
    findUser: jest.fn().mockResolvedValue(user),
    findRoles: jest.fn().mockResolvedValue([]),
    countActiveAdministrators: jest.fn().mockResolvedValue(2),
    createUser: jest.fn().mockResolvedValue(user),
    updateUser: jest.fn().mockResolvedValue(user),
    updateStatus: jest.fn().mockResolvedValue(managedUser({ status: "BLOCKED" })),
    replaceRoles: jest.fn().mockResolvedValue(user),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    updateProfilePhoto: jest.fn().mockResolvedValue(user),
    revokeSessions: jest.fn().mockResolvedValue(1),
    recordAudit: jest.fn().mockResolvedValue(undefined)
  };
  const execute = jest.fn();
  const unitOfWork: UserManagementUnitOfWork = {
    execute<T>(
      churchId: string,
      work: (current: UserManagementTransaction) => Promise<T>
    ): Promise<T> {
      execute(churchId, work);
      return work(transaction);
    }
  };
  return { unitOfWork, transaction, execute };
}

function managedUser(overrides: Partial<ManagedUser> = {}): ManagedUser {
  return {
    id: "target",
    churchId: "00000000-0000-4000-8000-000000000002",
    firstName: "Ana",
    lastName: "Silva",
    email: "ana@example.com",
    status: "ACTIVE" as const,
    hasProfilePhoto: false,
    profilePhotoUpdatedAt: null,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function passwordMock(): jest.Mocked<PasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue("encoded"),
    verify: jest.fn(),
    needsRehash: jest.fn(),
    dummyVerify: jest.fn()
  };
}
