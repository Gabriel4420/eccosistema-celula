import { Body, Controller, Get, Inject, Patch } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import {
  churchWeekDays,
  updateChurchRequestSchema,
  updateChurchSettingsRequestSchema
} from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { ChurchManagementCommands } from "../application/church-management.commands";
import { ChurchManagementQueries } from "../application/church-management.queries";
import { presentChurch, presentChurchSettings } from "./church.presenter";

@ApiTags("church")
@ApiBearerAuth()
@Controller("church")
export class ChurchController {
  constructor(
    @Inject(ChurchManagementQueries)
    private readonly queries: ChurchManagementQueries,
    @Inject(ChurchManagementCommands)
    private readonly commands: ChurchManagementCommands
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated church" })
  @ApiResponse({ status: 200, schema: churchEnvelopeSchema() })
  @ApiResponse({ status: 401, schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, schema: errorEnvelopeSchema() })
  async get(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return { data: presentChurch(await this.queries.get(principal)), meta: {} };
  }

  @Roles("ADMIN")
  @Patch()
  @ApiOperation({ summary: "Update the authenticated church" })
  @ApiBody({ schema: updateChurchBodySchema() })
  @ApiResponse({ status: 200, schema: churchEnvelopeSchema() })
  @ApiResponse({ status: 400, schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, schema: errorEnvelopeSchema() })
  async update(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: unknown
  ) {
    const input = updateChurchRequestSchema.parse(body);
    return {
      data: presentChurch(await this.commands.update(principal, input)),
      meta: {}
    };
  }

  @Get("settings")
  @ApiOperation({ summary: "Get the authenticated church settings" })
  @ApiResponse({ status: 200, schema: settingsEnvelopeSchema() })
  async getSettings(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return {
      data: presentChurchSettings(await this.queries.getSettings(principal)),
      meta: {}
    };
  }

  @Roles("ADMIN")
  @Patch("settings")
  @ApiOperation({ summary: "Update the authenticated church settings" })
  @ApiBody({ schema: updateSettingsBodySchema() })
  @ApiResponse({ status: 200, schema: settingsEnvelopeSchema() })
  @ApiResponse({ status: 400, schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, schema: errorEnvelopeSchema() })
  async updateSettings(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: unknown
  ) {
    const input = updateChurchSettingsRequestSchema.parse(body);
    const church = await this.commands.updateSettings(principal, input);
    return { data: presentChurchSettings(church), meta: {} };
  }
}

function nullableString(maxLength: number) {
  return { type: "string", nullable: true, maxLength };
}

function updateChurchBodySchema() {
  return {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1, maxLength: 160 },
      slug: { type: "string", minLength: 3, maxLength: 100 },
      email: { ...nullableString(320), format: "email" },
      phone: nullableString(32),
      addressLine: nullableString(200),
      addressNumber: nullableString(30),
      addressComplement: nullableString(120),
      neighborhood: nullableString(120),
      city: nullableString(120),
      state: nullableString(2),
      postalCode: nullableString(16),
      country: { type: "string", enum: ["BR"] }
    }
  };
}

function updateSettingsBodySchema() {
  return {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      timezone: { type: "string", minLength: 1, maxLength: 64 },
      weekStartsOn: { type: "string", enum: [...churchWeekDays] },
      reportDeadlineHours: { type: "integer", minimum: 1, maximum: 720 }
    }
  };
}

function churchSchema() {
  return {
    type: "object",
    required: [
      "id",
      "name",
      "slug",
      "email",
      "phone",
      "address",
      "createdAt",
      "updatedAt"
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      slug: { type: "string" },
      email: { type: "string", nullable: true, format: "email" },
      phone: { type: "string", nullable: true },
      address: {
        type: "object",
        required: [
          "line",
          "number",
          "complement",
          "neighborhood",
          "city",
          "state",
          "postalCode",
          "country"
        ],
        properties: {
          line: nullableString(200),
          number: nullableString(30),
          complement: nullableString(120),
          neighborhood: nullableString(120),
          city: nullableString(120),
          state: nullableString(2),
          postalCode: nullableString(16),
          country: { type: "string", enum: ["BR"] }
        }
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  };
}

function settingsSchema() {
  return {
    type: "object",
    required: ["timezone", "weekStartsOn", "reportDeadlineHours"],
    properties: {
      timezone: { type: "string" },
      weekStartsOn: { type: "string", enum: [...churchWeekDays] },
      reportDeadlineHours: { type: "integer" }
    }
  };
}

function envelope(data: object) {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: { data, meta: { type: "object" } }
  };
}

function churchEnvelopeSchema() {
  return envelope(churchSchema());
}

function settingsEnvelopeSchema() {
  return envelope(settingsSchema());
}

function errorEnvelopeSchema() {
  return {
    type: "object",
    required: ["error"],
    properties: {
      error: {
        type: "object",
        required: ["code", "message", "details"],
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "object" }
        }
      }
    }
  };
}

