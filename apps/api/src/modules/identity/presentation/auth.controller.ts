import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  Res
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  type AuthResponse
} from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { Request, Response } from "express";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Public } from "../../permissions/presentation/decorators/public.decorator";
import { ChangePasswordUseCase } from "../application/use-cases/change-password.use-case";
import { LoginUseCase } from "../application/use-cases/login.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { RefreshSessionUseCase } from "../application/use-cases/refresh-session.use-case";
import {
  AUTHENTICATION_ENVIRONMENT,
  type AuthEnvironment
} from "../identity.tokens";
import { RefreshCookieService } from "./cookies/refresh-cookie.service";
import { LoginRateLimiter } from "./login-rate-limiter";
import { toAuthResponse } from "./mappers/auth-response.mapper";

@Controller("auth")
@ApiTags("authentication")
export class AuthController {
  constructor(
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    @Inject(RefreshSessionUseCase)
    private readonly refreshUseCase: RefreshSessionUseCase,
    @Inject(LogoutUseCase)
    private readonly logoutUseCase: LogoutUseCase,
    @Inject(ChangePasswordUseCase)
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(RefreshCookieService)
    private readonly cookies: RefreshCookieService,
    @Inject(LoginRateLimiter)
    private readonly loginRateLimiter: LoginRateLimiter,
    @Inject(AUTHENTICATION_ENVIRONMENT)
    private readonly environment: AuthEnvironment
  ) {}

  @Public()
  @Throttle({
    default: {
      limit: Number(process.env.AUTH_LOGIN_IP_LIMIT ?? 10),
      ttl: 900_000
    }
  })
  @Post("login")
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", maxLength: 320 },
        password: { type: "string", maxLength: 128 }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Authenticated" })
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    const input = loginRequestSchema.parse(body);
    this.loginRateLimiter.assertAllowed(request.ip ?? "unknown", input.email);
    const result = await this.loginUseCase.execute({
      churchId: this.environment.AUTH_CHURCH_ID,
      email: input.email,
      password: input.password,
      refreshTtlSeconds: this.environment.REFRESH_TOKEN_TTL_SECONDS
    });
    this.cookies.write(response, result.refreshToken);
    return toAuthResponse(result);
  }

  @Public()
  @Post("refresh")
  @ApiResponse({ status: 200, description: "Session rotated" })
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponse> {
    this.cookies.assertAllowedOrigin(request);
    const token = this.cookies.read(request);
    if (!token) {
      const result = await this.refreshUseCase.execute({
        refreshToken: "",
        refreshTtlSeconds: this.environment.REFRESH_TOKEN_TTL_SECONDS
      });
      return toAuthResponse(result);
    }
    const result = await this.refreshUseCase.execute({
      refreshToken: token,
      refreshTtlSeconds: this.environment.REFRESH_TOKEN_TTL_SECONDS
    });
    this.cookies.write(response, result.refreshToken);
    return toAuthResponse(result);
  }

  @Public()
  @Post("logout")
  @ApiResponse({ status: 204, description: "Session revoked" })
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    this.cookies.assertAllowedOrigin(request);
    await this.logoutUseCase.execute(this.cookies.read(request));
    this.cookies.clear(response);
  }

  @Post("change-password")
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: { type: "string", maxLength: 128 },
        newPassword: { type: "string", minLength: 12, maxLength: 128 }
      }
    }
  })
  @ApiResponse({ status: 204, description: "Password changed" })
  @HttpCode(204)
  async changePassword(
    @Body() body: unknown,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const input = changePasswordRequestSchema.parse(body);
    await this.changePasswordUseCase.execute({
      churchId: principal.churchId,
      userId: principal.userId,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword
    });
    this.cookies.clear(response);
  }
}
