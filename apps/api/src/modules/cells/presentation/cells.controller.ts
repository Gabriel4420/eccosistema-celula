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
  cellIdParamsSchema,
  createCellRequestSchema,
  idempotencyKeySchema,
  listCellsQuerySchema,
  updateCellLeaderRequestSchema,
  updateCellRequestSchema,
  updateCellStatusRequestSchema,
  updateCellTraineeLeaderRequestSchema
} from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { CellsManagementCommands } from "../application/cells-management.commands";
import { CellsManagementQueries } from "../application/cells-management.queries";
import { presentCellItem, presentCellPage } from "./cells.presenter";

const cellStatuses = ["FORMING", "ACTIVE", "SUSPENDED", "CLOSED"] as const;
const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;

@ApiTags("cells")
@ApiBearerAuth()
@Controller("cells")
export class CellsController {
  constructor(
    @Inject(CellsManagementQueries)
    private readonly queries: CellsManagementQueries,
    @Inject(CellsManagementCommands)
    private readonly commands: CellsManagementCommands
  ) {}

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Get()
  @ApiOperation({ summary: "List cells within the authenticated actor scope" })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiQuery({ name: "search", required: false, type: String, maxLength: 160 })
  @ApiQuery({ name: "status", required: false, enum: [...cellStatuses] })
  @ApiQuery({ name: "leaderId", required: false, type: String, format: "uuid" })
  @ApiQuery({ name: "meetingDay", required: false, enum: [...daysOfWeek] })
  @ApiQuery({ name: "sortBy", required: false, enum: ["name", "code", "meetingDay", "createdAt"] })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] })
  @ApiResponse({ status: 200, description: "Paginated cells within the actor scope", schema: cellsPageEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid filters", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "Role is not allowed", schema: errorEnvelopeSchema() })
  async list(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: unknown
  ) {
    const input = listCellsQuerySchema.parse(query);
    return presentCellPage(
      await this.queries.list(principal, input),
      input.page,
      input.pageSize
    );
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
  @Get(":id")
  @ApiOperation({ summary: "Get a cell from the authenticated church" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Cell returned", schema: cellEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "Cell is outside the actor scope", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Cell not found in the authenticated church", schema: errorEnvelopeSchema() })
  async get(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown
  ) {
    const { id } = cellIdParamsSchema.parse(params);
    return presentCellItem(await this.queries.get(principal, id));
  }

  @Roles("ADMIN", "PASTOR")
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a cell; replay-safe with Idempotency-Key" })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    description: "UUID unique per actor, church and create operation"
  })
  @ApiBody({ schema: createCellBodySchema() })
  @ApiResponse({ status: 201, description: "Cell created or replayed idempotently", schema: cellEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or missing/invalid Idempotency-Key", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Leadership candidate not found", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Code, leadership, supervisor or idempotency conflict", schema: errorEnvelopeSchema() })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Headers("Idempotency-Key") idempotencyKey: string | undefined,
    @Body() body: unknown
  ) {
    const input = createCellRequestSchema.parse(body);
    return presentCellItem(
      await this.commands.create(
        principal,
        requireIdempotencyKey(idempotencyKey),
        {
          code: input.code,
          name: input.name,
          status: input.status,
          leaderId: input.leaderId ?? null,
          supervisorId: input.supervisorId ?? null,
          traineeLeaderId: input.traineeLeaderId ?? null,
          meetingDay: input.meetingDay,
          meetingTime: input.meetingTime,
          address: input.address
        }
      )
    );
  }

  @Roles("ADMIN", "PASTOR")
  @Patch(":id")
  @ApiOperation({ summary: "Update cell general data" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ schema: updateCellBodySchema() })
  @ApiResponse({ status: 200, description: "Cell updated", schema: cellEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Cell not found in the authenticated church", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Code already in use", schema: errorEnvelopeSchema() })
  async update(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = cellIdParamsSchema.parse(params);
    const input = updateCellRequestSchema.parse(body);
    return presentCellItem(await this.commands.update(principal, id, input));
  }

  @Roles("ADMIN", "PASTOR")
  @Patch(":id/status")
  @ApiOperation({ summary: "Activate or suspend a cell" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["status"],
      additionalProperties: false,
      properties: { status: { type: "string", enum: ["ACTIVE", "SUSPENDED"] } }
    }
  })
  @ApiResponse({ status: 200, description: "Cell status updated", schema: cellEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Cell not found in the authenticated church", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Status transition invalid or ACTIVE without leader", schema: errorEnvelopeSchema() })
  async updateStatus(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = cellIdParamsSchema.parse(params);
    const { status } = updateCellStatusRequestSchema.parse(body);
    return presentCellItem(await this.commands.updateStatus(principal, id, status));
  }

  @Roles("ADMIN", "PASTOR")
  @Patch(":id/leader")
  @ApiOperation({ summary: "Change the responsible leader and its supervisor" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["leaderId", "supervisorId"],
      additionalProperties: false,
      properties: {
        leaderId: { type: "string", format: "uuid" },
        supervisorId: { type: "string", format: "uuid" }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Cell leader changed", schema: cellEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Cell or candidate not found", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Leader, trainee or supervisor conflict", schema: errorEnvelopeSchema() })
  async updateLeader(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = cellIdParamsSchema.parse(params);
    const input = updateCellLeaderRequestSchema.parse(body);
    return presentCellItem(
      await this.commands.updateLeader(principal, id, input.leaderId, input.supervisorId)
    );
  }

  @Roles("ADMIN", "PASTOR")
  @Patch(":id/trainee-leader")
  @ApiOperation({ summary: "Assign or remove the trainee leader" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["traineeLeaderId"],
      additionalProperties: false,
      properties: { traineeLeaderId: { type: "string", format: "uuid", nullable: true } }
    }
  })
  @ApiResponse({ status: 200, description: "Trainee leader changed", schema: cellEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Cell or candidate not found", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Leader equals trainee leader", schema: errorEnvelopeSchema() })
  async updateTraineeLeader(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = cellIdParamsSchema.parse(params);
    const { traineeLeaderId } = updateCellTraineeLeaderRequestSchema.parse(body);
    return presentCellItem(
      await this.commands.updateTraineeLeader(principal, id, traineeLeaderId)
    );
  }
}

function requireIdempotencyKey(value: string | undefined): string {
  return idempotencyKeySchema.parse(value);
}

function cellSchema() {
  const relatedUser = {
    type: "object",
    required: ["id", "name"],
    additionalProperties: false,
    properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } }
  };
  return {
    type: "object",
    required: [
      "id", "code", "name", "status", "leader", "supervisor", "traineeLeader",
      "meetingDay", "meetingTime", "address", "createdAt", "updatedAt"
    ],
    additionalProperties: false,
    properties: {
      id: { type: "string", format: "uuid" },
      code: { type: "string" },
      name: { type: "string" },
      status: { type: "string", enum: [...cellStatuses] },
      leader: { ...relatedUser, nullable: true },
      supervisor: { ...relatedUser, nullable: true },
      traineeLeader: { ...relatedUser, nullable: true },
      meetingDay: { type: "string", enum: [...daysOfWeek] },
      meetingTime: { type: "string", example: "19:30" },
      address: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  };
}

function cellEnvelopeSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: cellSchema(),
      meta: { type: "object", additionalProperties: false }
    }
  };
}

function cellsPageEnvelopeSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: cellSchema() },
      meta: {
        type: "object",
        required: ["page", "pageSize", "totalItems", "totalPages"],
        properties: {
          page: { type: "integer", minimum: 1 },
          pageSize: { type: "integer", minimum: 1 },
          totalItems: { type: "integer", minimum: 0 },
          totalPages: { type: "integer", minimum: 0 }
        }
      }
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

function createCellBodySchema() {
  const statuses = ["FORMING", "ACTIVE", "SUSPENDED"] as const;
  return {
    type: "object",
    required: ["code", "name", "meetingDay", "meetingTime", "address"],
    additionalProperties: false,
    properties: {
      code: { type: "string", minLength: 1, maxLength: 50, example: "CEL-001" },
      name: { type: "string", minLength: 1, maxLength: 160 },
      status: { type: "string", enum: [...statuses], default: "FORMING" },
      leaderId: { type: "string", format: "uuid", nullable: true },
      supervisorId: { type: "string", format: "uuid", nullable: true },
      traineeLeaderId: { type: "string", format: "uuid", nullable: true },
      meetingDay: { type: "string", enum: [...daysOfWeek] },
      meetingTime: { type: "string", example: "19:30" },
      address: { type: "string", minLength: 1, maxLength: 500 }
    }
  };
}

function updateCellBodySchema() {
  return {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      code: { type: "string", minLength: 1, maxLength: 50 },
      name: { type: "string", minLength: 1, maxLength: 160 },
      meetingDay: { type: "string", enum: [...daysOfWeek] },
      meetingTime: { type: "string", example: "19:30" },
      address: { type: "string", minLength: 1, maxLength: 500 }
    }
  };
}
