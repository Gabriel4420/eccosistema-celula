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
  hasProfilePhoto: boolean;
  profilePhotoUpdatedAt: Date | null;
  roles: ManagedRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfilePhoto {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  data: Uint8Array;
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

export type CellAssignmentKind = "SUPERVISOR" | "LEADER" | "TRAINEE";

export interface ListCellAssignmentOptionsInput {
  page: number;
  pageSize: number;
  search?: string;
  kind: CellAssignmentKind;
}

export interface CellAssignmentOption {
  id: string;
  name: string;
}

export interface CellAssignmentOptionsPage {
  items: CellAssignmentOption[];
  totalItems: number;
}
