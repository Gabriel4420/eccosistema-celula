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
