import type { AuthResponse } from "@mission-atos/contracts";
import type { AuthTokensResult } from "../../application/auth.types";

export function toAuthResponse(result: AuthTokensResult): AuthResponse {
  return {
    data: {
      accessToken: result.accessToken,
      tokenType: "Bearer",
      expiresIn: result.expiresIn,
      user: {
        id: result.user.id,
        churchId: result.user.churchId,
        roles: [...result.user.roles]
      }
    },
    meta: {}
  };
}
