import {
  churchEnvelopeSchema,
  churchSettingsEnvelopeSchema,
  updateChurchRequestSchema,
  updateChurchSettingsRequestSchema
} from "@mission-atos/contracts";
import type {
  ChurchResponse,
  ChurchSettingsResponse,
  UpdateChurchRequest,
  UpdateChurchSettingsRequest
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export async function getChurch(api: ApiClient): Promise<ChurchResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/church",
    bearer: true,
    schema: churchEnvelopeSchema
  });
  return envelope.data;
}

export async function updateChurch(
  api: ApiClient,
  input: UpdateChurchRequest
): Promise<ChurchResponse> {
  const payload = updateChurchRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: "/church",
    body: payload,
    bearer: true,
    schema: churchEnvelopeSchema
  });
  return envelope.data;
}

export async function getChurchSettings(api: ApiClient): Promise<ChurchSettingsResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/church/settings",
    bearer: true,
    schema: churchSettingsEnvelopeSchema
  });
  return envelope.data;
}

export async function updateChurchSettings(
  api: ApiClient,
  input: UpdateChurchSettingsRequest
): Promise<ChurchSettingsResponse> {
  const payload = updateChurchSettingsRequestSchema.parse(input);
  const envelope = await api.request({
    method: "PATCH",
    path: "/church/settings",
    body: payload,
    bearer: true,
    schema: churchSettingsEnvelopeSchema
  });
  return envelope.data;
}
