import { PublicApplicationError } from "@mission-atos/domain";

export type UserManagementErrorCode =
  | "USER_NOT_FOUND"
  | "ROLE_NOT_FOUND"
  | "USER_EMAIL_CONFLICT"
  | "LAST_ACTIVE_ADMIN"
  | "USER_ROLE_CONFLICT"
  | "INVALID_PROFILE_PHOTO"
  | "AUTH_FORBIDDEN";

export class UserManagementError extends PublicApplicationError<UserManagementErrorCode> {
  constructor(
    code: UserManagementErrorCode,
    message: string
  ) {
    super(code, message);
    this.name = "UserManagementError";
  }
}
