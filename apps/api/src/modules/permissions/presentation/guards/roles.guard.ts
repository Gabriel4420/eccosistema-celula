import {
  Inject,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";

type AuthenticatedRequest = Request & {
  principal?: AuthenticatedPrincipal;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass()
      ])
    ) {
      return true;
    }
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required?.length) return true;
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (
      !request.principal ||
      !required.some((role) => request.principal?.roles.includes(role))
    ) {
      throw forbidden();
    }
    return true;
  }
}

function forbidden(): ForbiddenException {
  return new ForbiddenException({
    error: {
      code: "AUTH_FORBIDDEN",
      message: "Access is not allowed",
      details: {}
    }
  });
}
