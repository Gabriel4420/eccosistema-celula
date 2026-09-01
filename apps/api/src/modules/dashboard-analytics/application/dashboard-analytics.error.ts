import { PublicApplicationError } from "@mission-atos/domain";

export type DashboardAnalyticsErrorCode = "AUTH_FORBIDDEN";

export class DashboardAnalyticsError extends PublicApplicationError<DashboardAnalyticsErrorCode> {
  constructor(code: DashboardAnalyticsErrorCode, message: string) {
    super(code, message);
    this.name = "DashboardAnalyticsError";
  }
}
