import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { IdentityModule } from "./modules/identity/identity.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 1_000 }
    ]),
    IdentityModule,
    PermissionsModule
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
