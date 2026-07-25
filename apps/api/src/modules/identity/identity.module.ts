import { parseAuthenticationEnvironment } from "@mission-atos/config/server";
import { createRuntimeClient } from "@mission-atos/database";
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import {
  ACCESS_TOKEN_SERVICE,
  CLOCK,
  PASSWORD_HASHER,
  REFRESH_TOKEN_SERVICE,
  SESSION_REPOSITORY,
  USER_CREDENTIALS_REPOSITORY
} from "./application/ports";
import { ChangePasswordUseCase } from "./application/use-cases/change-password.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { RefreshSessionUseCase } from "./application/use-cases/refresh-session.use-case";
import {
  AUTHENTICATION_ENVIRONMENT,
  DATABASE_CLIENT
} from "./identity.tokens";
import { SystemClock } from "./infrastructure/clock/system-clock";
import { Argon2PasswordHasher } from "./infrastructure/crypto/argon2-password-hasher";
import { OpaqueRefreshTokenService } from "./infrastructure/crypto/opaque-refresh-token.service";
import { JwtAccessTokenService } from "./infrastructure/jwt/jwt-access-token.service";
import { DatabaseLifecycle } from "./infrastructure/prisma/database.provider";
import { PrismaSessionRepository } from "./infrastructure/prisma/prisma-session.repository";
import { PrismaUserCredentialsRepository } from "./infrastructure/prisma/prisma-user-credentials.repository";
import { AuthExceptionFilter } from "./presentation/auth-exception.filter";
import { AuthController } from "./presentation/auth.controller";
import { RefreshCookieService } from "./presentation/cookies/refresh-cookie.service";
import { LoginRateLimiter } from "./presentation/login-rate-limiter";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTHENTICATION_ENVIRONMENT,
      useFactory: () => parseAuthenticationEnvironment(process.env)
    },
    {
      provide: DATABASE_CLIENT,
      useFactory: () => createRuntimeClient(process.env)
    },
    DatabaseLifecycle,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    LoginRateLimiter,
    RefreshCookieService,
    {
      provide: USER_CREDENTIALS_REPOSITORY,
      useClass: PrismaUserCredentialsRepository
    },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: ACCESS_TOKEN_SERVICE, useClass: JwtAccessTokenService },
    { provide: REFRESH_TOKEN_SERVICE, useClass: OpaqueRefreshTokenService },
    { provide: CLOCK, useClass: SystemClock },
    { provide: APP_FILTER, useClass: AuthExceptionFilter }
  ],
  exports: [ACCESS_TOKEN_SERVICE]
})
export class IdentityModule {}
