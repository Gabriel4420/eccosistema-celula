import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_LEADER, ROLE_PASTOR, ROLE_SUPERVISOR } from "@/src/shared/auth/session";
import { AttendanceEditor } from "@/src/features/attendance/components/attendance-editor";

export default function AttendanceRoute() {
  return <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR, ROLE_SUPERVISOR, ROLE_LEADER]}><AttendanceEditor /></RequireRole>;
}
