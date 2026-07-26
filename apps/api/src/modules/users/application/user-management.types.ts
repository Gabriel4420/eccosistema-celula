import type { UserStatus } from "@mission-atos/domain";

export interface ManagedRole {
  id: string;
  name: string;
}

export interface ManagedUser {
  id: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  roles: ManagedRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPage {
  items: ManagedUser[];
  totalItems: number;
}

export interface ListUsersInput {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
  roleId?: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  initialPassword: string;
  roleIds: string[];
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UpdateOwnProfileInput {
  firstName?: string;
  lastName?: string;
}
