import { Controller, Get, Inject } from "@nestjs/common";
import { HealthService } from "./health.service";
import type { HealthStatus } from "./health.service";
import { Public } from "./modules/permissions/presentation/decorators/public.decorator";

@Controller("health")
@Public()
export class HealthController {
  public constructor(
    @Inject(HealthService) private readonly healthService: HealthService
  ) {}

  @Get()
  public getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
