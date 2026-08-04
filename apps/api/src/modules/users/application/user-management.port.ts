import type {
  ListUsersInput,
  ManagedUser,
  ManagedRole,
  UserPage
} from "./user-management.types";

export const USER_MANAGEMENT_REPOSITORY = Symbol("USER_MANAGEMENT_REPOSITORY");
export const USER_MANAGEMENT_UNIT_OF_WORK = Symbol("USER_MANAGEMENT_UNIT_OF_WORK");

export type AuditValue =
  | string
  | number
  | boolean
  | null
  | AuditValue[]
  | { [key: string]: AuditValue };

export interface UserManagementRepository {
  isActiveAdministrator(churchId: string, userId: string): Promise<boolean>;
  managedRoles(churchId: string): Promise<ManagedRole[]>;
  list(churchId: string, query: ListUsersInput): Promise<UserPage>;
  find(churchId: string, userId: string): Promise<ManagedUser | null>;
}

export interface UserManagementTransaction {
  isActiveAdministrator(userId: string): Promise<boolean>;
  findUser(userId: string): Promise<ManagedUser | null>;
  findRoles(roleIds: readonly string[]): Promise<ManagedRole[]>;
  countActiveAdministrators(): Promise<number>;
  createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleIds: readonly string[];
  }): Promise<ManagedUser>;
  updateUser(input: {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<ManagedUser>;
  updateStatus(input: {
    userId: string;
    status: "ACTIVE" | "BLOCKED";
  }): Promise<ManagedUser>;
  replaceRoles(input: {
    userId: string;
    roleIds: readonly string[];
  }): Promise<ManagedUser>;
  updatePassword(input: {
    userId: string;
    passwordHash: string;
  }): Promise<void>;
  revokeSessions(input: {
    userId: string;
    reason: "PASSWORD_CHANGED" | "USER_INACTIVE";
  }): Promise<number>;
  recordAudit(input: {
    actorId: string;
    entityId: string;
    action: string;
    before?: { [key: string]: AuditValue };
    after?: { [key: string]: AuditValue };
  }): Promise<void>;
}

export interface UserManagementUnitOfWork {
  execute<T>(
    churchId: string,
    work: (transaction: UserManagementTransaction) => Promise<T>
  ): Promise<T>;
}
