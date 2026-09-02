import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { ReportsError } from "./reports.error";
import type { ReportsScope } from "./reports.types";
import type { ReportsScopePolicy } from "../domain/reports.policy";

export class ReportsAuthorization {
  constructor(private readonly scopePolicy: ReportsScopePolicy) {}

  resolveListScope(principal: AuthenticatedPrincipal): ReportsScope {
    const scope = this.scopePolicy.evaluate(principal);
    if (!scope) this.forbidden();
    return scope;
  }

  private forbidden(): never {
    throw new ReportsError("AUTH_FORBIDDEN", "Access is not allowed");
  }
}
