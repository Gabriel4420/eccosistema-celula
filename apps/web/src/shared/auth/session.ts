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

const ROLE_LABELS: Record<string, string> = {
  [ROLE_ADMIN]: "Admin",
  [ROLE_PASTOR]: "Pastor",
  [ROLE_SUPERVISOR]: "Supervisor",
  [ROLE_LEADER]: "Líder",
};

export function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name;
}
