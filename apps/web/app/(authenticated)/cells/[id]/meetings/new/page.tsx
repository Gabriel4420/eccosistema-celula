import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_LEADER, ROLE_PASTOR } from "@/src/shared/auth/session";
import { CreateMeetingFormPage } from "./create-meeting-form-page";

export default function NewMeetingPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR, ROLE_LEADER]}>
      <CreateMeetingFormPage />
    </RequireRole>
  );
}
