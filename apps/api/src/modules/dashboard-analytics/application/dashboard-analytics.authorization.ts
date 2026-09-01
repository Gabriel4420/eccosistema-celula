import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { DashboardAnalyticsError } from "./dashboard-analytics.error";
import type { DashboardListScope } from "./dashboard-analytics.types";
import type { DashboardAnalyticsScopePolicy } from "../domain/dashboard-analytics.policy";

export class DashboardAnalyticsAuthorization {
  constructor(private readonly scopePolicy: DashboardAnalyticsScopePolicy) {}

  resolveListScope(principal: AuthenticatedPrincipal): DashboardListScope {
    const scope = this.scopePolicy.evaluate(principal);
    if (!scope) this.forbidden();
    return scope;
  }

  private forbidden(): never {
    throw new DashboardAnalyticsError("AUTH_FORBIDDEN", "Access is not allowed");
  }
}
