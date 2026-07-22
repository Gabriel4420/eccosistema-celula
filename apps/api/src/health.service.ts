import { Injectable } from "@nestjs/common";

export interface HealthStatus {
  readonly status: "ok";
}

@Injectable()
export class HealthService {
  public getStatus(): HealthStatus {
    return { status: "ok" };
  }
}
