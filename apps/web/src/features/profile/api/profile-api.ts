import {
  changePasswordRequestSchema,
  updateOwnProfileRequestSchema,
  userItemEnvelopeSchema
} from "@mission-atos/contracts";
import { profilePhotoEnvelopeSchema, profilePhotoRequestSchema } from "@mission-atos/contracts";
import type { ProfilePhotoRequest } from "@mission-atos/contracts";
import type { UpdateOwnProfileRequest, UserResponse } from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export async function getMyProfile(api: ApiClient): Promise<UserResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/users/me",
    bearer: true,
    allowRetry: true,
    schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function getMyProfilePhoto(api: ApiClient): Promise<string> {
  const envelope = await api.request({
    method: "GET", path: "/users/me/profile-photo", bearer: true,
    allowRetry: true, schema: profilePhotoEnvelopeSchema
  });
  return `data:${envelope.data.contentType};base64,${envelope.data.base64}`;
}

export async function updateMyProfilePhoto(api: ApiClient, input: ProfilePhotoRequest): Promise<UserResponse> {
  const payload = profilePhotoRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PUT", path: "/users/me/profile-photo", body: payload,
    bearer: true, schema: userItemEnvelopeSchema
  });
  return envelope.data;
}

export async function removeMyProfilePhoto(api: ApiClient): Promise<UserResponse> {
  const envelope = await api.request({
    method: "DELETE", path: "/users/me/profile-photo", bearer: true,
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
