import { Controller, Get, Inject } from "@nestjs/common";
import { HealthService } from "./health.service";
import type { HealthStatus } from "./health.service";

@Controller("health")
export class HealthController {
  public constructor(
    @Inject(HealthService) private readonly healthService: HealthService
  ) {}

  @Get()
  public getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
