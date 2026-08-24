import { Body, Controller, Delete, Get, Headers, HttpCode, Inject, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { attendanceParamsSchema, attendanceVisitorParamsSchema, createMeetingVisitorRequestSchema, idempotencyKeySchema, saveAttendanceRequestSchema } from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { AttendanceService } from "../application/attendance.service";

@ApiTags("attendance")
@ApiBearerAuth()
@Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")
@Controller("cells/:cellId/meetings/:meetingId/attendance")
export class AttendanceController {
  constructor(@Inject(AttendanceService) private readonly attendance: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: "Get eligible participants, attendance, visitors and meeting summary" })
  @ApiResponse({ status: 200, description: "Attendance snapshot" })
  async get(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown) {
    const { cellId, meetingId } = attendanceParamsSchema.parse(params);
    return { data: await this.attendance.get(principal, cellId, meetingId), meta: {} };
  }

  @Put()
  @ApiOperation({ summary: "Atomically replace participant attendance using optimistic revision" })
  @ApiResponse({ status: 200, description: "Updated attendance snapshot" })
  @ApiResponse({ status: 409, description: "Revision conflict or canceled meeting" })
  async save(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown, @Body() body: unknown) {
    const { cellId, meetingId } = attendanceParamsSchema.parse(params);
    const input = saveAttendanceRequestSchema.parse(body);
    return { data: await this.attendance.save(principal, cellId, meetingId, input), meta: {} };
  }

  @Post("visitors")
  @HttpCode(201)
  @ApiHeader({ name: "Idempotency-Key", required: true, description: "UUID scoped to actor and visitor creation" })
  @ApiOperation({ summary: "Register an existing or quick-created person as a visitor" })
  async addVisitor(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown, @Headers("Idempotency-Key") key: string | undefined, @Body() body: unknown) {
    const { cellId, meetingId } = attendanceParamsSchema.parse(params);
    const input = createMeetingVisitorRequestSchema.parse(body);
    return { data: await this.attendance.addVisitor(principal, cellId, meetingId, idempotencyKeySchema.parse(key), input), meta: {} };
  }

  @Delete("visitors/:personId")
  @HttpCode(204)
  @ApiOperation({ summary: "Soft-delete a visitor and its meeting attendance" })
  async removeVisitor(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param() params: unknown): Promise<void> {
    const { cellId, meetingId, personId } = attendanceVisitorParamsSchema.parse(params);
    await this.attendance.removeVisitor(principal, cellId, meetingId, personId);
  }
}
