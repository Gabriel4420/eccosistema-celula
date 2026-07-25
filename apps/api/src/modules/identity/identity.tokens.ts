import type { AuthenticationEnvironment } from "@mission-atos/config/server";

export const AUTHENTICATION_ENVIRONMENT = Symbol(
  "AUTHENTICATION_ENVIRONMENT"
);
export const DATABASE_CLIENT = Symbol("DATABASE_CLIENT");
export type AuthEnvironment = AuthenticationEnvironment;
