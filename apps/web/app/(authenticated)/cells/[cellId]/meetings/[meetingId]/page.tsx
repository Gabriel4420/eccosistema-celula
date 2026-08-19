import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_LEADER, ROLE_PASTOR, ROLE_SUPERVISOR } from "@/src/shared/auth/session";
import { MeetingDetailPage } from "./meeting-detail-page";

export default function MeetingDetailRoute() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR, ROLE_SUPERVISOR, ROLE_LEADER]}>
      <MeetingDetailPage />
    </RequireRole>
  );
}
