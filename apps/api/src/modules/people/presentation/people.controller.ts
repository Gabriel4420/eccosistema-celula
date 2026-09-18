import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { createPersonRequestSchema, listPeopleQuerySchema, personIdParamsSchema, updatePersonRequestSchema, updatePersonStatusRequestSchema } from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { PeopleManagementCommands } from "../application/people-management.commands";
import { PeopleManagementAuthorization } from "../application/people-management.authorization";
import { PeopleManagementQueries } from "../application/people-management.queries";
import { presentPerson, presentPersonPage } from "./people.presenter";

@ApiTags("people") @ApiBearerAuth() @Controller("people")
export class PeopleController {
  constructor(
    @Inject(PeopleManagementQueries) private readonly queries: PeopleManagementQueries,
    @Inject(PeopleManagementCommands) private readonly commands: PeopleManagementCommands,
    @Inject(PeopleManagementAuthorization) private readonly authorization: PeopleManagementAuthorization
  ) {}

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get()
  @ApiOperation({ summary: "List people from the authenticated church" })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "gender", required: false, type: String })
  @ApiQuery({ name: "sortBy", required: false, enum: ["fullName", "birthDate", "createdAt"] })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] })
  @ApiResponse({ status: 200, description: "Paginated people; observations are restricted to ADMIN and PASTOR", schema: peoplePageEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid filters", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "Inactive people require ADMIN", schema: errorEnvelopeSchema() })
  async list(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = listPeopleQuerySchema.parse(query);
    return presentPersonPage(await this.queries.list(principal, input), this.authorization.canViewObservations(principal), input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get(":id")
  @ApiOperation({ summary: "Get an active person" }) @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Person returned; observations are restricted to ADMIN and PASTOR", schema: personEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "Role is not allowed", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Person not found in the authenticated church", schema: errorEnvelopeSchema() })
  async get(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown) {
    const { id } = personIdParamsSchema.parse(params);
    return { data: presentPerson(await this.queries.get(principal, id), this.authorization.canViewObservations(principal)), meta: {} };
  }

  @Roles("ADMIN", "PASTOR") @Post()
  @ApiOperation({ summary: "Create a person" }) @ApiBody({ schema: personBodySchema(true) })
  @ApiResponse({ status: 201, description: "Person created by ADMIN or PASTOR", schema: personEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Active duplicate", schema: errorEnvelopeSchema() })
  async create(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: unknown) {
    const input = createPersonRequestSchema.parse(body);
    const command = { fullName: input.fullName, phone: input.phone ?? null, email: input.email ?? null, birthDate: input.birthDate ?? null, gender: input.gender ?? null, observations: input.observations ?? null };
    return { data: presentPerson(await this.commands.create(principal, command, input.cellCode), this.authorization.canViewObservations(principal)), meta: {} };
  }

  @Roles("ADMIN", "PASTOR") @Patch(":id")
  @ApiOperation({ summary: "Update an active person" }) @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ schema: personBodySchema(false) }) @ApiResponse({ status: 200, description: "Active person updated by ADMIN or PASTOR", schema: personEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Active person not found in the authenticated church", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Active duplicate", schema: errorEnvelopeSchema() })
  async update(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown, @Body() body: unknown) {
    const { id } = personIdParamsSchema.parse(params);
    const input = updatePersonRequestSchema.parse(body);
    return { data: presentPerson(await this.commands.update(principal, id, input), this.authorization.canViewObservations(principal)), meta: {} };
  }

  @Roles("ADMIN") @Patch(":id/status")
  @ApiOperation({ summary: "Deactivate or reactivate a person" }) @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ schema: { type: "object", required: ["status"], additionalProperties: false, properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE"] } } } })
  @ApiResponse({ status: 200, description: "Person status updated", schema: personEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid body or UUID", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "Active ADMIN required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "Person not found in the authenticated church", schema: errorEnvelopeSchema() })
  async updateStatus(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown, @Body() body: unknown) {
    const { id } = personIdParamsSchema.parse(params);
    const { status } = updatePersonStatusRequestSchema.parse(body);
    return { data: presentPerson(await this.commands.updateStatus(principal, id, status), this.authorization.canViewObservations(principal)), meta: {} };
  }
}

function personBodySchema(required: boolean) {
  return { type: "object", additionalProperties: false, ...(required ? { required: ["fullName"] } : { minProperties: 1 }), properties: {
    fullName: { type: "string", minLength: 1, maxLength: 200 }, phone: { type: "string", nullable: true, maxLength: 32 },
    email: { type: "string", nullable: true, format: "email", maxLength: 320 }, birthDate: { type: "string", nullable: true, format: "date" },
    gender: { type: "string", nullable: true, maxLength: 50 }, observations: { type: "string", nullable: true, maxLength: 10000 },
    cellCode: { type: "string", nullable: true, minLength: 1, maxLength: 50, description: "Optional cell to link on creation" }
  } };
}

function cellLinkSchema() { return { type: "object", additionalProperties: false, required: ["id", "code", "name"], properties: { id: { type: "string", format: "uuid" }, code: { type: "string" }, name: { type: "string" } } }; }

function personSchema() { return { type: "object", additionalProperties: false, required: ["id", "fullName", "phone", "email", "birthDate", "gender", "currentCell", "status", "createdAt", "updatedAt"], properties: {
  id: { type: "string", format: "uuid" }, fullName: { type: "string" },
  phone: { type: "string", nullable: true }, email: { type: "string", nullable: true },
  birthDate: { type: "string", format: "date", nullable: true }, gender: { type: "string", nullable: true },
  currentCell: { ...cellLinkSchema(), nullable: true },
  status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
  createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
  observations: { type: "string", nullable: true, description: "Only ADMIN and PASTOR" }
} }; }
function personEnvelopeSchema() { return { type: "object", required: ["data", "meta"], properties: { data: personSchema(), meta: { type: "object", additionalProperties: false } } }; }
function peoplePageEnvelopeSchema() { return { type: "object", required: ["data", "meta"], properties: { data: { type: "array", items: personSchema() }, meta: { type: "object", required: ["page", "pageSize", "totalItems", "totalPages"], properties: { page: { type: "integer" }, pageSize: { type: "integer" }, totalItems: { type: "integer" }, totalPages: { type: "integer" } } } } }; }
function errorEnvelopeSchema() { return { type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message", "details"], properties: { code: { type: "string" }, message: { type: "string" }, details: { type: "object" } } } } }; }
