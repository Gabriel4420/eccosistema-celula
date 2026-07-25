import {
  Inject,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedPrincipal, Policy } from "@mission-atos/domain";
import type { Request } from "express";
import { POLICIES_KEY } from "../decorators/check-policies.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

type PolicyRequest = Request & {
  principal?: AuthenticatedPrincipal;
  authorizationResource?: unknown;
};

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass()
      ])
    ) {
      return true;
    }
    const policies = this.reflector.getAllAndOverride<Array<Policy<unknown>>>(
      POLICIES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!policies?.length) return true;
    const request = context.switchToHttp().getRequest<PolicyRequest>();
    if (!request.principal) throw forbidden();
    for (const policy of policies) {
      if (
        !(await policy.evaluate(
          request.principal,
          request.authorizationResource
        ))
      ) {
        throw forbidden();
      }
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
