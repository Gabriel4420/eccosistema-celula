import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_LEADER, ROLE_PASTOR, ROLE_SUPERVISOR } from "@/src/shared/auth/session";
import { MeetingsListPage } from "./meetings-list-page";

export default function MeetingsPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR, ROLE_SUPERVISOR, ROLE_LEADER]}>
      <MeetingsListPage />
    </RequireRole>
  );
}
