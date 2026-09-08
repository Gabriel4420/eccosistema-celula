import { PublicApplicationError } from "@mission-atos/domain";

export type UserPreferencesErrorCode = "USER_NOT_FOUND";

export class UserPreferencesError extends PublicApplicationError<UserPreferencesErrorCode> {
  constructor(code: UserPreferencesErrorCode, message: string) {
    super(code, message);
    this.name = "UserPreferencesError";
  }
}