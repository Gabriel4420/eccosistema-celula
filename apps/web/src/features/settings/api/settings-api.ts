import {
  updateOwnPreferencesRequestSchema,
  userPreferencesEnvelopeSchema
} from "@mission-atos/contracts";
import type {
  UpdateOwnPreferencesRequest,
  UserPreferencesResponse
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export async function getOwnPreferences(api: ApiClient): Promise<UserPreferencesResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/settings/me",
    bearer: true,
    allowRetry: true,
    schema: userPreferencesEnvelopeSchema
  });
  return envelope.data;
}

export async function updateOwnPreferences(
  api: ApiClient,
  input: UpdateOwnPreferencesRequest
): Promise<UserPreferencesResponse> {
  const payload = updateOwnPreferencesRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: "/settings/me",
    body: payload,
    bearer: true,
    schema: userPreferencesEnvelopeSchema
  });
  return envelope.data;
}