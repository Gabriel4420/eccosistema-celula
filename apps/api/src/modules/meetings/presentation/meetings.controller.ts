import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import {
  createMeetingRequestSchema,
  listMeetingsQuerySchema,
  meetingCellParamsSchema,
  meetingParamsSchema,
  meetingReportDraftRequestSchema,
  updateMeetingRequestSchema,
  updateMeetingStatusRequestSchema,
  idempotencyKeySchema
} from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { MeetingsManagementCommands } from "../application/meetings-management.commands";
import { MeetingsManagementQueries } from "../application/meetings-management.queries";
import { presentMeetingItem, presentMeetingPage, presentReport } from "./meetings.presenter";

const meetingStatuses = ["SCHEDULED", "COMPLETED", "CANCELED"] as const;

@ApiTags("meetings")
@ApiBearerAuth()
@Controller("cells/:cellId/meetings")
export class MeetingsController {
  constructor(
    @Inject(MeetingsManagementQueries)
    private readonly queries: MeetingsManagementQueries,
    @Inject(MeetingsManagementCommands)
    private readonly commands: MeetingsManagementCommands
  ) {}

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Get()
  @ApiOperation({ summary: "List meetings for a cell" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiQuery({ name: "from", required: false, type: String, description: "YYYY-MM-DD" })
  @ApiQuery({ name: "to", required: false, type: String, description: "YYYY-MM-DD" })
  @ApiQuery({ name: "status", required: false, enum: [...meetingStatuses] })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] })
  @ApiResponse({ status: 200, description: "Paginated meetings" })
  @ApiResponse({ status: 400, description: "Invalid filters" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async list(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Query() query: unknown
  ) {
    const { cellId } = meetingCellParamsSchema.parse(params);
    const input = listMeetingsQuerySchema.parse(query);
    const page = await this.queries.list(principal, cellId, input);
    return presentMeetingPage(page, input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Get(":meetingId")
  @ApiOperation({ summary: "Get a meeting detail" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiParam({ name: "meetingId", format: "uuid" })
  @ApiResponse({ status: 200, description: "Meeting returned" })
  @ApiResponse({ status: 400, description: "Invalid UUID" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Meeting is outside the actor scope" })
  @ApiResponse({ status: 404, description: "Meeting not found" })
  async get(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown
  ) {
    const { cellId, meetingId } = meetingParamsSchema.parse(params);
    return presentMeetingItem(await this.queries.get(principal, cellId, meetingId));
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a meeting; replay-safe with Idempotency-Key" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    description: "UUID unique per actor, cell and create operation"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["meetingDate"],
      additionalProperties: false,
      properties: {
        meetingDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2026-08-19" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Meeting created or replayed idempotently" })
  @ApiResponse({ status: 400, description: "Invalid body or missing/invalid Idempotency-Key" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "ADMIN, PASTOR, SUPERVISOR or LEADER required" })
  @ApiResponse({ status: 404, description: "Cell not found" })
  @ApiResponse({ status: 409, description: "Date conflict or idempotency conflict" })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Headers("Idempotency-Key") idempotencyKey: string | undefined,
    @Body() body: unknown
  ) {
    const { cellId } = meetingCellParamsSchema.parse(params);
    const input = createMeetingRequestSchema.parse(body);
    return presentMeetingItem(
      await this.commands.create(
        principal,
        cellId,
        requireIdempotencyKey(idempotencyKey),
        input
      )
    );
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Patch(":meetingId")
  @ApiOperation({ summary: "Update meeting date" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiParam({ name: "meetingId", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["meetingDate"],
      additionalProperties: false,
      properties: {
        meetingDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2026-08-19" }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Meeting updated" })
  @ApiResponse({ status: 400, description: "Invalid body or UUID" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Meeting is outside the actor scope" })
  @ApiResponse({ status: 404, description: "Meeting not found" })
  @ApiResponse({ status: 409, description: "Date conflict" })
  async update(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { cellId, meetingId } = meetingParamsSchema.parse(params);
    const input = updateMeetingRequestSchema.parse(body);
    return presentMeetingItem(
      await this.commands.updateDate(principal, cellId, meetingId, input)
    );
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Patch(":meetingId/status")
  @ApiOperation({ summary: "Complete or cancel a meeting" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiParam({ name: "meetingId", format: "uuid" })
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: "object",
          required: ["status"],
          additionalProperties: false,
          properties: { status: { type: "string", enum: ["COMPLETED"] } }
        },
        {
          type: "object",
          required: ["status", "cancellationReason"],
          additionalProperties: false,
          properties: {
            status: { type: "string", enum: ["CANCELED"] },
            cancellationReason: { type: "string", minLength: 1, maxLength: 1000 }
          }
        }
      ]
    }
  })
  @ApiResponse({ status: 200, description: "Meeting status updated" })
  @ApiResponse({ status: 400, description: "Invalid body or UUID" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Meeting is outside the actor scope" })
  @ApiResponse({ status: 404, description: "Meeting not found" })
  @ApiResponse({ status: 409, description: "Status transition not allowed" })
  async updateStatus(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { cellId, meetingId } = meetingParamsSchema.parse(params);
    const parsed = updateMeetingStatusRequestSchema.parse(body);
    return presentMeetingItem(
      await this.commands.updateStatus(
        principal,
        cellId,
        meetingId,
        parsed.status,
        parsed.status === "CANCELED" ? parsed.cancellationReason : undefined
      )
    );
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Get(":meetingId/report")
  @ApiOperation({ summary: "Get meeting report draft" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiParam({ name: "meetingId", format: "uuid" })
  @ApiResponse({ status: 200, description: "Report draft returned" })
  @ApiResponse({ status: 400, description: "Invalid UUID" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Meeting is outside the actor scope" })
  @ApiResponse({ status: 404, description: "Meeting not found" })
  async getReport(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown
  ) {
    const { cellId, meetingId } = meetingParamsSchema.parse(params);
    const report = await this.queries.getReport(principal, cellId, meetingId);
    return presentReport(report);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Put(":meetingId/report")
  @ApiOperation({ summary: "Create or update meeting report draft" })
  @ApiParam({ name: "cellId", format: "uuid" })
  @ApiParam({ name: "meetingId", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["observations"],
      additionalProperties: false,
      properties: {
        observations: { type: "string", maxLength: 5000, nullable: true }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Report draft saved" })
  @ApiResponse({ status: 400, description: "Invalid body or UUID" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Meeting is outside the actor scope" })
  @ApiResponse({ status: 404, description: "Meeting not found" })
  @ApiResponse({ status: 409, description: "Cannot edit report for canceled meeting" })
  async upsertReport(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { cellId, meetingId } = meetingParamsSchema.parse(params);
    const input = meetingReportDraftRequestSchema.parse(body);
    const report = await this.commands.upsertReport(
      principal,
      cellId,
      meetingId,
      input.observations
    );
    return presentReport(report);
  }
}

function requireIdempotencyKey(value: string | undefined): string {
  return idempotencyKeySchema.parse(value);
}
