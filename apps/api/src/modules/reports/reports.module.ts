import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { ReportsAuthorization } from "./application/reports.authorization";
import { REPORTS_NOW, REPORTS_REPOSITORY, type ReportsRepository } from "./application/reports.port";
import { ReportsQueries } from "./application/reports.queries";
import { ReportsScopePolicy } from "./domain/reports.policy";
import { PrismaReportsRepository } from "./infrastructure/prisma-reports.repository";
import { ReportsController } from "./presentation/reports.controller";

@Module({
  imports: [IdentityModule],
  controllers: [ReportsController],
  providers: [
    PrismaReportsRepository,
    { provide: REPORTS_REPOSITORY, useExisting: PrismaReportsRepository },
    { provide: REPORTS_NOW, useValue: () => new Date() },
    { provide: ReportsAuthorization, useFactory: () => new ReportsAuthorization(new ReportsScopePolicy()) },
    {
      provide: ReportsQueries,
      inject: [REPORTS_REPOSITORY, ReportsAuthorization, REPORTS_NOW],
      useFactory: (repository: ReportsRepository, authorization: ReportsAuthorization, now: () => Date) =>
        new ReportsQueries(repository, authorization, now)
    }
  ]
})
export class ReportsModule {}
