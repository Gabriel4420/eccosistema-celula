import { PublicApplicationError } from "@mission-atos/domain";

export type PeopleManagementErrorCode =
  | "PERSON_NOT_FOUND"
  | "PERSON_DUPLICATE"
  | "AUTH_FORBIDDEN";

export class PeopleManagementError extends PublicApplicationError<PeopleManagementErrorCode> {
  constructor(code: PeopleManagementErrorCode, message: string) {
    super(code, message);
    this.name = "PeopleManagementError";
  }
}
