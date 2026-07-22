import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("returns only the public health status", () => {
    const service = new HealthService();

    expect(service.getStatus()).toEqual({ status: "ok" });
  });
});
