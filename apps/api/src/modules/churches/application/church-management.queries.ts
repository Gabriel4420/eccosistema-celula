import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { ChurchManagementAuthorization } from "./church-management.authorization";
import { ChurchManagementError } from "./church-management.error";
import type { ChurchManagementRepository } from "./church-management.port";
import type {
  ManagedChurch,
  ManagedChurchSettings
} from "./church-management.types";

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
  ): Promise<ManagedChurchSettings> {
    await this.get(principal);
    const settings = await this.churches.findSettings(principal.churchId);
    if (!settings) {
      throw new ChurchManagementError(
        "CHURCH_NOT_FOUND",
        "Church settings not found"
      );
    }
    return settings;
  }
}

