import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { DashboardAnalyticsAuthorization } from "./application/dashboard-analytics.authorization";
import { DASHBOARD_ANALYTICS_NOW, DASHBOARD_ANALYTICS_REPOSITORY, type DashboardAnalyticsRepository } from "./application/dashboard-analytics.port";
import { DashboardAnalyticsQueries } from "./application/dashboard-analytics.queries";
import { DashboardAnalyticsScopePolicy } from "./domain/dashboard-analytics.policy";
import { PrismaDashboardAnalyticsRepository } from "./infrastructure/prisma-dashboard-analytics.repository";
import { DashboardAnalyticsController } from "./presentation/dashboard-analytics.controller";

@Module({ imports: [IdentityModule], controllers: [DashboardAnalyticsController], providers: [
  PrismaDashboardAnalyticsRepository,
  { provide: DASHBOARD_ANALYTICS_REPOSITORY, useExisting: PrismaDashboardAnalyticsRepository },
  { provide: DASHBOARD_ANALYTICS_NOW, useValue: () => new Date() },
  { provide: DashboardAnalyticsAuthorization, useFactory: () => new DashboardAnalyticsAuthorization(new DashboardAnalyticsScopePolicy()) },
  { provide: DashboardAnalyticsQueries, inject: [DASHBOARD_ANALYTICS_REPOSITORY, DashboardAnalyticsAuthorization, DASHBOARD_ANALYTICS_NOW], useFactory: (repository: DashboardAnalyticsRepository, authorization: DashboardAnalyticsAuthorization, now: () => Date) => new DashboardAnalyticsQueries(repository, authorization, now) }
] })
export class DashboardAnalyticsModule {}
