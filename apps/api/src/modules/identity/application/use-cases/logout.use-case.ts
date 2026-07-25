import { Inject, Injectable } from "@nestjs/common";
import {
  CLOCK,
  REFRESH_TOKEN_SERVICE,
  SESSION_REPOSITORY,
  type Clock,
  type RefreshTokenService,
  type SessionRepository
} from "../ports";

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepository,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokens: RefreshTokenService,
    @Inject(CLOCK) private readonly clock: Clock
  ) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.sessions.revokeCurrent(
      this.refreshTokens.hash(refreshToken),
      this.clock.now()
    );
  }
}
