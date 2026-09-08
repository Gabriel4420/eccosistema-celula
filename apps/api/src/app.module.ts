import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { CellsModule } from "./modules/cells/cells.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { MeetingsModule } from "./modules/meetings/meetings.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { UsersModule } from "./modules/users/users.module";
import { ChurchesModule } from "./modules/churches/churches.module";
import { PeopleModule } from "./modules/people/people.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { DashboardAnalyticsModule } from "./modules/dashboard-analytics/dashboard-analytics.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { BulkImportModule } from "./modules/bulk-import/bulk-import.module";
import { UserPreferencesModule } from "./modules/user-preferences/user-preferences.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 1_000 }
    ]),
    IdentityModule,
    PermissionsModule,
    UsersModule,
    ChurchesModule,
    PeopleModule,
    CellsModule,
    MeetingsModule,
    AttendanceModule,
    DashboardAnalyticsModule,
    ReportsModule,
    BulkImportModule,
    UserPreferencesModule
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
