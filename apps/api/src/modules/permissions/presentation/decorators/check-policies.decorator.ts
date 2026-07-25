import { SetMetadata } from "@nestjs/common";
import type { Policy } from "@mission-atos/domain";

export const POLICIES_KEY = "permissions:policies";
export const CheckPolicies = (
  ...policies: Array<Policy<unknown>>
): MethodDecorator & ClassDecorator => SetMetadata(POLICIES_KEY, policies);
