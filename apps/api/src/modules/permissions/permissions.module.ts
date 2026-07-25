import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { IdentityModule } from "../identity/identity.module";
import { AccessTokenGuard } from "./presentation/guards/access-token.guard";
import { PoliciesGuard } from "./presentation/guards/policies.guard";
import { RolesGuard } from "./presentation/guards/roles.guard";

@Module({
  imports: [IdentityModule],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard }
  ]
})
export class PermissionsModule {}
