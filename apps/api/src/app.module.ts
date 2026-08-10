import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { CellsModule } from "./modules/cells/cells.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { UsersModule } from "./modules/users/users.module";
import { ChurchesModule } from "./modules/churches/churches.module";
import { PeopleModule } from "./modules/people/people.module";

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
    CellsModule
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
