import type { AuthResponse } from "@mission-atos/contracts";
import { API_URL } from "../config";
import { apiRequest } from "./client";

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    body: { email, password }
  });
}

export async function logout(): Promise<void> {
  try {
    await apiRequest(`${API_URL}/auth/logout`, { method: "POST" });
  } catch {
    // Best-effort logout
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest(`${API_URL}/auth/change-password`, {
    method: "POST",
    body: { currentPassword, newPassword }
  });
}