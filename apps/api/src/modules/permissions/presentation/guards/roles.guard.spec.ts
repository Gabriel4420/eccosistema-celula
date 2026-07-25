import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import type { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  it("denies a role that is not present in the tenant principal", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["ADMIN"])
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = new ExecutionContextHost([
      { principal: { roles: ["LEADER"], churchId: "church" } }
    ]);
    context.setType("http");
    expect(() => guard.canActivate(context)).toThrow();
  });
});
