import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { AttendanceService } from "./application/attendance.service";
import { AttendancePolicy } from "./domain/attendance.policy";
import { AttendanceController } from "./presentation/attendance.controller";

@Module({
  imports: [IdentityModule],
  controllers: [AttendanceController],
  providers: [AttendancePolicy, AttendanceService]
})
export class AttendanceModule {}
