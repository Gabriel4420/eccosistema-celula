import {
  authResponseSchema
} from "@mission-atos/contracts";
import type { AuthResponse } from "@mission-atos/contracts";
import { normalizeHttpError } from "@/src/shared/api/api-error";
import { httpRequest } from "@/src/shared/api/http-client";

export async function postLogin(
  baseUrl: string,
  input: { readonly email: string; readonly password: string }
): Promise<AuthResponse> {
  const result = await httpRequest<AuthResponse>({
    method: "POST",
    url: `${baseUrl}/auth/login`,
    body: input
  });
  if (result.status === 200) {
    return authResponseSchema.parse(result.data);
  }
  throw normalizeHttpError(result.status, result.data);
}

export async function postRefresh(baseUrl: string): Promise<AuthResponse | null> {
  const result = await httpRequest<AuthResponse>({
    method: "POST",
    url: `${baseUrl}/auth/refresh`
  });
  if (result.status === 200) {
    return authResponseSchema.parse(result.data);
  }
  return null;
}

export async function postLogout(baseUrl: string): Promise<void> {
  try {
    const result = await httpRequest({
      method: "POST",
      url: `${baseUrl}/auth/logout`
    });
    if (result.status >= 200 && result.status < 300) return;
  } catch {
    // Best effort: local state is cleared regardless of server result.
  }
}
