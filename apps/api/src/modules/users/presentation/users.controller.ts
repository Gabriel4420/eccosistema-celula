import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Delete,
  Query
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import {
  createUserRequestSchema,
  listCellAssignmentOptionsQuerySchema,
  listUsersQuerySchema,
  managedRoleNames,
  replaceUserRolesRequestSchema,
  resetUserPasswordRequestSchema,
  updateOwnProfileRequestSchema,
  updateUserRequestSchema,
  updateUserStatusRequestSchema,
  userIdParamsSchema
} from "@mission-atos/contracts";
import { profilePhotoRequestSchema } from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { UserManagementCommands } from "../application/user-management.commands";
import { UserManagementError } from "../application/user-management.error";
import { UserManagementQueries } from "../application/user-management.queries";
import { presentUser, presentUserPage } from "./user.presenter";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(
    @Inject(UserManagementQueries)
    private readonly queries: UserManagementQueries,
    @Inject(UserManagementCommands)
    private readonly commands: UserManagementCommands
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Get the authenticated user profile" })
  @ApiResponse({ status: 200, description: "Profile returned without security fields", schema: userEnvelopeSchema() })
  async getOwn(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return { data: presentUser(await this.queries.getOwn(principal)), meta: {} };
  }

  @Patch("me")
  @ApiOperation({ summary: "Update the authenticated user profile" })
  @ApiBody({ schema: profileBodySchema() })
  @ApiResponse({ status: 200, description: "Profile updated", schema: userEnvelopeSchema() })
  async updateOwn(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: unknown
  ) {
    const input = updateOwnProfileRequestSchema.parse(body);
    return {
      data: presentUser(await this.commands.updateOwn(principal, input)),
      meta: {}
    };
  }

  @Get("me/profile-photo")
  @Header("Cache-Control", "private, no-store")
  async getOwnProfilePhoto(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const photo = await this.queries.getOwnProfilePhoto(principal);
    return {
      data: photo
        ? { contentType: photo.contentType, base64: Buffer.from(photo.data).toString("base64") }
        : null,
      meta: {}
    };
  }

  @Put("me/profile-photo")
  async updateOwnProfilePhoto(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() body: unknown) {
    const input = profilePhotoRequestSchema.parse(body);
    const data = Buffer.from(input.base64, "base64");
    if (data.byteLength > 512_000 || !matchesImageSignature(data, input.contentType)) {
      throw new UserManagementError("INVALID_PROFILE_PHOTO", "Invalid profile photo");
    }
    return { data: presentUser(await this.commands.updateOwnProfilePhoto(principal, { contentType: input.contentType, data })), meta: {} };
  }

  @Delete("me/profile-photo")
  async removeOwnProfilePhoto(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return { data: presentUser(await this.commands.updateOwnProfilePhoto(principal, null)), meta: {} };
  }

  @Roles("ADMIN")
  @Get("managed-roles")
  @ApiOperation({ summary: "List canonical managed roles available in the authenticated church" })
  @ApiResponse({ status: 200, description: "Managed roles catalog", schema: managedRolesEnvelopeSchema() })
  async managedRoles(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return { data: await this.queries.managedRoles(principal), meta: {} };
  }

  @Roles("ADMIN", "PASTOR")
  @Get("cell-assignment-options")
  @ApiOperation({ summary: "List candidate users for cell leadership assignment" })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiQuery({ name: "search", required: false, type: String, maxLength: 160 })
  @ApiQuery({ name: "kind", required: true, enum: ["SUPERVISOR", "LEADER", "TRAINEE"] })
  @ApiResponse({ status: 200, description: "Paginated candidates from the authenticated church", schema: assignmentOptionsEnvelopeSchema() })
  @ApiResponse({ status: 400, description: "Invalid filters", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 401, description: "Authentication required", schema: errorEnvelopeSchema() })
  @ApiResponse({ status: 403, description: "ADMIN or PASTOR required", schema: errorEnvelopeSchema() })
  async cellAssignmentOptions(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: unknown
  ) {
    const input = listCellAssignmentOptionsQuerySchema.parse(query);
    const page = await this.queries.listCellAssignmentOptions(principal, input);
    return {
      data: page.items,
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: page.totalItems,
        totalPages: Math.ceil(page.totalItems / input.pageSize)
      }
    };
  }

  @Roles("ADMIN")
  @Get()
  @ApiOperation({ summary: "List users from the authenticated church" })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "BLOCKED"] })
  @ApiQuery({ name: "roleId", required: false, type: String, format: "uuid" })
  @ApiResponse({ status: 200, description: "Paginated users", schema: userPageSchema() })
  async list(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: unknown
  ) {
    const input = listUsersQuerySchema.parse(query);
    return presentUserPage(await this.queries.list(principal, input), input.page, input.pageSize);
  }

  @Roles("ADMIN")
  @Get(":id")
  @ApiOperation({ summary: "Get a user from the authenticated church" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "User returned", schema: userEnvelopeSchema() })
  @ApiResponse({ status: 404, description: "User not found", schema: errorEnvelopeSchema() })
  async get(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown
  ) {
    const { id } = userIdParamsSchema.parse(params);
    return { data: presentUser(await this.queries.get(principal, id)), meta: {} };
  }

  @Roles("ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a user in the authenticated church" })
  @ApiBody({ schema: createUserBodySchema() })
  @ApiResponse({ status: 201, description: "User created", schema: userEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Normalized email already exists", schema: errorEnvelopeSchema() })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: unknown
  ) {
    const input = createUserRequestSchema.parse(body);
    return { data: presentUser(await this.commands.create(principal, input)), meta: {} };
  }

  @Roles("ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a user" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ schema: updateUserBodySchema() })
  @ApiResponse({ status: 200, description: "User updated", schema: userEnvelopeSchema() })
  async update(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = userIdParamsSchema.parse(params);
    const input = updateUserRequestSchema.parse(body);
    return { data: presentUser(await this.commands.update(principal, id, input)), meta: {} };
  }

  @Roles("ADMIN")
  @Patch(":id/status")
  @ApiOperation({ summary: "Activate or deactivate a user" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["status"],
      additionalProperties: false,
      properties: { status: { type: "string", enum: ["ACTIVE", "BLOCKED"] } }
    }
  })
  @ApiResponse({ status: 200, description: "Status updated", schema: userEnvelopeSchema() })
  @ApiResponse({ status: 409, description: "Last active administrator protected", schema: errorEnvelopeSchema() })
  async updateStatus(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = userIdParamsSchema.parse(params);
    const input = updateUserStatusRequestSchema.parse(body);
    return {
      data: presentUser(await this.commands.updateStatus(principal, id, input.status)),
      meta: {}
    };
  }

  @Roles("ADMIN")
  @Put(":id/roles")
  @ApiOperation({ summary: "Replace a user's managed roles" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ schema: roleIdsBodySchema() })
  @ApiResponse({ status: 200, description: "Roles replaced", schema: userEnvelopeSchema() })
  async replaceRoles(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ) {
    const { id } = userIdParamsSchema.parse(params);
    const input = replaceUserRolesRequestSchema.parse(body);
    return {
      data: presentUser(await this.commands.replaceRoles(principal, id, input.roleIds)),
      meta: {}
    };
  }

  @Roles("ADMIN")
  @Post(":id/reset-password")
  @ApiOperation({ summary: "Reset a user password and revoke sessions" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["newPassword"],
      additionalProperties: false,
      properties: {
        newPassword: { type: "string", minLength: 12, maxLength: 128 }
      }
    }
  })
  @ApiResponse({ status: 204, description: "Password reset and sessions revoked" })
  @HttpCode(204)
  async resetPassword(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() params: unknown,
    @Body() body: unknown
  ): Promise<void> {
    const { id } = userIdParamsSchema.parse(params);
    const input = resetUserPasswordRequestSchema.parse(body);
    await this.commands.resetPassword(principal, id, input.newPassword);
  }
}

function profileBodySchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      firstName: { type: "string", minLength: 1, maxLength: 100 },
      lastName: { type: "string", minLength: 1, maxLength: 100 }
    }
  };
}

function updateUserBodySchema() {
  return {
    ...profileBodySchema(),
    properties: {
      ...profileBodySchema().properties,
      email: { type: "string", format: "email", maxLength: 320 }
    }
  };
}

function roleIdsBodySchema() {
  return {
    type: "object",
    required: ["roleIds"],
    additionalProperties: false,
    properties: {
      roleIds: {
        type: "array",
        maxItems: 4,
        uniqueItems: true,
        items: { type: "string", format: "uuid" }
      }
    }
  };
}

function createUserBodySchema() {
  return {
    type: "object",
    required: ["firstName", "lastName", "email", "initialPassword", "roleIds"],
    additionalProperties: false,
    properties: {
      ...updateUserBodySchema().properties,
      initialPassword: {
        type: "string",
        minLength: 12,
        maxLength: 128,
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\\\s]).+$",
        description: "Must contain uppercase, lowercase, number and special character"
      },
      roleIds: roleIdsBodySchema().properties.roleIds
    }
  };
}

function userSchema() {
  return {
    type: "object",
    required: ["id", "firstName", "lastName", "email", "status", "roles", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      email: { type: "string", format: "email" },
      status: { type: "string", enum: ["ACTIVE", "BLOCKED"] },
      roles: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" }
          }
        }
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  };
}

function managedRolesEnvelopeSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", enum: [...managedRoleNames] }
          }
        }
      },
      meta: { type: "object" }
    }
  };
}

function assignmentOptionsEnvelopeSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" }
          }
        }
      },
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

function userEnvelopeSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: { data: userSchema(), meta: { type: "object" } }
  };
}

function userPageSchema() {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: userSchema() },
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

function matchesImageSignature(data: Uint8Array, contentType: string): boolean {
  if (contentType === "image/jpeg") return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (contentType === "image/png") return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
  return contentType === "image/webp" && Buffer.from(data.subarray(0, 4)).toString("ascii") === "RIFF" && Buffer.from(data.subarray(8, 12)).toString("ascii") === "WEBP";
}
