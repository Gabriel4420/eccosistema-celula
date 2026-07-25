import {
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { Request } from "express";
import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService
} from "../../../identity/application/ports";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

type AuthenticatedRequest = Request & {
  principal?: AuthenticatedPrincipal;
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly tokens: AccessTokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        error: {
          code: "AUTH_UNAUTHENTICATED",
          message: "Authentication is required",
          details: {}
        }
      });
    }
    try {
      request.principal = await this.tokens.verify(authorization.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException({
        error: {
          code: "AUTH_UNAUTHENTICATED",
          message: "Authentication is required",
          details: {}
        }
      });
    }
  }
}
