import { Body, Controller, Get, Inject, Patch } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import {
  settingsDateFormats,
  settingsLocales,
  settingsThemes,
  updateOwnPreferencesRequestSchema
} from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { UserPreferencesCommands } from "../application/user-preferences.commands";
import { UserPreferencesQueries } from "../application/user-preferences.queries";
import { presentUserPreferences } from "./user-preferences.presenter";

@ApiTags("settings")
@ApiBearerAuth()
@Controller("settings")
export class UserPreferencesController {
  constructor(
    @Inject(UserPreferencesQueries)
    private readonly queries: UserPreferencesQueries,
    @Inject(UserPreferencesCommands)
    private readonly commands: UserPreferencesCommands
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Get the authenticated user preferences" })
  @ApiResponse({ status: 200, schema: preferencesEnvelopeSchema() })
  async getOwn(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return {
      data: presentUserPreferences(await this.queries.getOwn(principal)),
      meta: {}
    };
  }

  @Patch("me")
  @ApiOperation({ summary: "Update the authenticated user preferences" })
  @ApiBody({ schema: updatePreferencesBodySchema() })
  @ApiResponse({ status: 200, schema: preferencesEnvelopeSchema() })
  @ApiResponse({ status: 400, schema: errorEnvelopeSchema() })
  async updateOwn(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: unknown
  ) {
    const input = updateOwnPreferencesRequestSchema.parse(body);
    return {
      data: presentUserPreferences(await this.commands.updateOwn(principal, input)),
      meta: {}
    };
  }
}

function updatePreferencesBodySchema() {
  return {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      language: { type: "string", enum: [...settingsLocales] },
      displayTimezone: {
        anyOf: [
          { type: "string", minLength: 1, maxLength: 64 },
          { type: "null" }
        ]
      },
      dateFormat: { type: "string", enum: [...settingsDateFormats] },
      theme: { type: "string", enum: [...settingsThemes] }
    }
  };
}

function preferencesSchema() {
  return {
    type: "object",
    required: ["language", "displayTimezone", "dateFormat", "theme"],
    properties: {
      language: { type: "string", enum: [...settingsLocales] },
      displayTimezone: { anyOf: [{ type: "string" }, { type: "null" }] },
      dateFormat: { type: "string", enum: [...settingsDateFormats] },
      theme: { type: "string", enum: [...settingsThemes] }
    }
  };
}

function preferencesEnvelopeSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: preferencesSchema(),
      meta: { type: "object" }
    }
  };
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