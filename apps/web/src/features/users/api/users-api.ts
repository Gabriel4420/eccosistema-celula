import {
  createUserRequestSchema,
  listUsersQuerySchema,
  managedRolesEnvelopeSchema,
  replaceUserRolesRequestSchema,
  resetUserPasswordRequestSchema,
  updateUserRequestSchema,
  updateUserStatusRequestSchema,
  userItemEnvelopeSchema,
  userPageEnvelopeSchema
} from "@mission-atos/contracts";
import type {
  CreateUserRequest,
  ManagedRole,
  ReplaceUserRolesRequest,
  UpdateUserRequest,
  UserPageEnvelope,
  UserResponse
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export interface UserListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: "ACTIVE" | "BLOCKED";
  readonly roleId?: string;
}

export async function listUsers(
  api: ApiClient,
  params: UserListParams
): Promise<UserPageEnvelope> {
  const query = listUsersQuerySchema.parse(params);
  return api.request({
    method: "GET",
    path: "/users",
    query: {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search ?? "",
      status: query.status ?? "",
      roleId: query.roleId ?? ""
    },
    bearer: true,
    allowRetry: true,
    schema: userPageEnvelopeSchema
  });
}

export async function getManagedRoles(api: ApiClient): Promise<ManagedRole[]> {
  const envelope = await api.request({
    method: "GET",
    path: "/users/managed-roles",
    bearer: true,
    allowRetry: true,
    schema: managedRolesEnvelopeSchema
  });
  return envelope.data;
}

export async function getUser(api: ApiClient, id: string): Promise<UserResponse> {
  const envelope = await api.request({
    method: "GET",
    path: `/users/${id}`,
    bearer: true,
    allowRetry: true,
    schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function createUser(
  api: ApiClient,
  input: CreateUserRequest
): Promise<UserResponse> {
  const payload = createUserRequestSchema.parse(input);
  const envelope = await api.request({
    method: "POST",
    path: "/users",
    body: payload,
    bearer: true,
    schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateUser(
  api: ApiClient,
  id: string,
  input: UpdateUserRequest
): Promise<UserResponse> {
  const payload = updateUserRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: `/users/${id}`,
    body: payload,
    bearer: true,
    schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateUserStatus(
  api: ApiClient,
  id: string,
  status: "ACTIVE" | "BLOCKED"
): Promise<void> {
  const payload = updateUserStatusRequestSchema.parse({ status });
  await api.request({
    method: "PATCH",
    path: `/users/${id}/status`,
    body: payload,
    bearer: true
  });
}

export async function replaceUserRoles(
  api: ApiClient,
  id: string,
  input: ReplaceUserRolesRequest
): Promise<void> {
  const payload = replaceUserRolesRequestSchema.parse(input);
  await api.request({
    method: "PUT",
    path: `/users/${id}/roles`,
    body: payload,
    bearer: true
  });
}

export async function resetUserPassword(
  api: ApiClient,
  id: string,
  newPassword: string
): Promise<void> {
  const payload = resetUserPasswordRequestSchema.parse({ newPassword });
  await api.request({
    method: "POST",
    path: `/users/${id}/reset-password`,
    body: payload,
    bearer: true
  });
}
