import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { ChurchManagementAuthorization } from "./church-management.authorization";
import { ChurchManagementError } from "./church-management.error";
import type { ChurchManagementRepository } from "./church-management.port";
import type { ManagedChurch } from "./church-management.types";

export class ChurchManagementQueries {
  constructor(
    private readonly churches: ChurchManagementRepository,
    private readonly authorization: ChurchManagementAuthorization
  ) {}

  async get(principal: AuthenticatedPrincipal): Promise<ManagedChurch> {
    const church = await this.churches.find(principal.churchId);
    if (!church) {
      throw new ChurchManagementError("CHURCH_NOT_FOUND", "Church not found");
    }
    this.authorization.assertView(principal, church);
    return church;
  }

  async getSettings(
    principal: AuthenticatedPrincipal
  ): Promise<Pick<ManagedChurch, "timezone" | "weekStartsOn">> {
    const church = await this.get(principal);
    return {
      timezone: church.timezone,
      weekStartsOn: church.weekStartsOn
    };
  }
}

