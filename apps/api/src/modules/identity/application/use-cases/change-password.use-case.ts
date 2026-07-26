import { Inject, Injectable } from "@nestjs/common";
import { AuthError } from "../../domain/auth-error";
import {
  CLOCK,
  PASSWORD_HASHER,
  USER_CREDENTIALS_REPOSITORY,
  type Clock,
  type PasswordHasher,
  type UserCredentialsRepository
} from "../ports";

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_CREDENTIALS_REPOSITORY)
    private readonly users: UserCredentialsRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(CLOCK) private readonly clock: Clock
  ) {}

  async execute(input: {
    churchId: string;
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const user = await this.users.findById(input.churchId, input.userId);
    if (
      !user ||
      user.status !== "ACTIVE" ||
      !(await this.passwords.verify(user.passwordHash, input.currentPassword))
    ) {
      throw new AuthError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid current password"
      );
    }
    if (input.currentPassword === input.newPassword) {
      throw new AuthError("VALIDATION_ERROR", "Password must change");
    }
    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.users.changePasswordAndRevokeSessions({
      churchId: input.churchId,
      userId: input.userId,
      passwordHash,
      occurredAt: this.clock.now()
    });
  }
}
