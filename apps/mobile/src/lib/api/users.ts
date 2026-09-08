import type { UserResponse } from "@mission-atos/contracts";
import { API_URL } from "../config";
import { apiRequest } from "./client";

type UserEnvelope = { data: UserResponse; meta: Record<string, never> };

export async function getMe(): Promise<UserEnvelope> {
  return apiRequest<UserEnvelope>(`${API_URL}/users/me`);
}