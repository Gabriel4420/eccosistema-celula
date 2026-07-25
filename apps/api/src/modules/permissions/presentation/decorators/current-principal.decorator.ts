import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { Request } from "express";

type AuthenticatedRequest = Request & {
  principal?: AuthenticatedPrincipal;
};

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.principal) {
      throw new Error("Authenticated principal is unavailable");
    }
    return request.principal;
  }
);
