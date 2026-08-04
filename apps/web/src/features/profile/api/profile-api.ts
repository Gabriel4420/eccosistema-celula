import {
  changePasswordRequestSchema,
  updateOwnProfileRequestSchema,
  userItemEnvelopeSchema
} from "@mission-atos/contracts";
import type { UpdateOwnProfileRequest, UserResponse } from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export async function getMyProfile(api: ApiClient): Promise<UserResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/users/me",
    bearer: true,
    schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function updateMyProfile(
  api: ApiClient,
  input: UpdateOwnProfileRequest
): Promise<UserResponse> {
  const payload = updateOwnProfileRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: "/users/me",
    body: payload,
    bearer: true,
    schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function changeMyPassword(
  api: ApiClient,
  input: { readonly currentPassword: string; readonly newPassword: string }
): Promise<void> {
  const payload = changePasswordRequestSchema.parse(input);
  await api.request({
    method: "POST",
    path: "/auth/change-password",
    body: payload,
    bearer: true
  });
}
