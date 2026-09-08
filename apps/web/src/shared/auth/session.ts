import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

export type SessionStatus =
  | "bootstrapping"
  | "anonymous"
  | "authenticated"
  | "refreshing"
  | "ending";

export interface SessionPrincipal {
  readonly userId: string;
  readonly churchId: string;
  readonly roles: readonly string[];
}

export interface SessionState {
  readonly status: SessionStatus;
  readonly principal: SessionPrincipal | null;
}

export const ROLE_ADMIN = "ADMIN";
export const ROLE_PASTOR = "PASTOR";
export const ROLE_SUPERVISOR = "SUPERVISOR";
export const ROLE_LEADER = "LEADER";

const ROLE_KEYS: Record<string, TranslationKey> = {
  [ROLE_ADMIN]: "role.admin",
  [ROLE_PASTOR]: "role.pastor",
  [ROLE_SUPERVISOR]: "role.supervisor",
  [ROLE_LEADER]: "role.leader",
};

export function roleLabel(
  name: string,
  t: (key: TranslationKey, params?: TranslationParams) => string
): string {
  const key = ROLE_KEYS[name];
  return key ? t(key) : name;
}