import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { cellsSummaryQuerySchema, overviewQuerySchema, seriesQuerySchema } from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { DashboardAnalyticsQueries } from "../application/dashboard-analytics.queries";
import { presentCellsSummary, presentOverview, presentSeries } from "./dashboard-analytics.presenter";

@ApiTags("dashboard") @ApiBearerAuth() @Controller("dashboard")
export class DashboardAnalyticsController {
  constructor(
    @Inject(DashboardAnalyticsQueries) private readonly queries: DashboardAnalyticsQueries
  ) {}

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("overview")
  @ApiOperation({ summary: "Overview indicators scoped to the authenticated church and hierarchy" })
  @ApiQuery({ name: "period", required: false, enum: ["30d"] })
  @ApiQuery({ name: "from", required: false, type: String, description: "Civil date YYYY-MM-DD" })
  @ApiQuery({ name: "to", required: false, type: String, description: "Civil date YYYY-MM-DD" })
  @ApiResponse({ status: 200, description: "Overview indicators", schema: overviewEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid query", schema: { type: "object" } })
  @ApiResponse({ status: 401, description: "Authentication required", schema: { type: "object" } })
  @ApiResponse({ status: 403, description: "Role is not allowed", schema: { type: "object" } })
  async overview(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = overviewQuerySchema.parse(query);
    return { data: presentOverview(await this.queries.overview(principal, { from: input.from, to: input.to })), meta: {} };
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("series")
  @ApiOperation({ summary: "Monthly series of meetings and attendance" })
  @ApiQuery({ name: "from", required: false, type: String, description: "Civil date YYYY-MM-DD" })
  @ApiQuery({ name: "to", required: false, type: String, description: "Civil date YYYY-MM-DD" })
  @ApiQuery({ name: "granularity", required: false, enum: ["monthly"] })
  @ApiResponse({ status: 200, description: "Monthly series", schema: seriesEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid query", schema: { type: "object" } })
  @ApiResponse({ status: 401, description: "Authentication required", schema: { type: "object" } })
  @ApiResponse({ status: 403, description: "Role is not allowed", schema: { type: "object" } })
  async series(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = seriesQuerySchema.parse(query);
    return { data: presentSeries(await this.queries.series(principal, { from: input.from, to: input.to })), meta: {} };
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("cells/summary")
  @ApiOperation({ summary: "Cell summary with last completed meeting and member counts" })
  @ApiQuery({ name: "windowDays", required: false, type: Number, minimum: 2, maximum: 90 })
  @ApiQuery({ name: "status", required: false, enum: ["FORMING", "ACTIVE", "SUSPENDED", "CLOSED"] })
  @ApiResponse({ status: 200, description: "Cell summary", schema: cellsSummaryEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid query", schema: { type: "object" } })
  @ApiResponse({ status: 401, description: "Authentication required", schema: { type: "object" } })
  @ApiResponse({ status: 403, description: "Role is not allowed", schema: { type: "object" } })
  async cellsSummary(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = cellsSummaryQuerySchema.parse(query);
    return { data: presentCellsSummary(await this.queries.cellsSummary(principal, input)), meta: {} };
  }
}

function envelope(data: object) {
  return { type: "object", required: ["data", "meta"], properties: { data, meta: { type: "object", additionalProperties: false } } };
}

function overviewEnvelopeSchema() {
  return envelope({
    type: "object", required: ["period", "totals", "meetings", "attendance", "visitors"], properties: {
      period: { type: "object" }, totals: { type: "object" }, meetings: { type: "object" },
      attendance: { type: "object" }, visitors: { type: "object" }, delta: { type: "object", nullable: true }
    }
  });
}

function seriesEnvelopeSchema() {
  return envelope({
    type: "array",
    items: { type: "object", required: ["month", "meetings", "completed", "presentMembers", "visitors"], properties: {
      month: { type: "string" }, meetings: { type: "integer" }, completed: { type: "integer" },
      presentMembers: { type: "integer" }, visitors: { type: "integer" }
    } }
  });
}

function cellsSummaryEnvelopeSchema() {
  return envelope({
    type: "object", required: ["cells", "withoutRecentMeeting", "recentMeetingWindowDays"], properties: {
      cells: { type: "array", items: { type: "object" } },
      withoutRecentMeeting: { type: "integer" }, recentMeetingWindowDays: { type: "integer" }
    }
  });
}
