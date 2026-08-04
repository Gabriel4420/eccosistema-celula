import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN } from "@/src/shared/auth/session";
import { UserDetail } from "@/src/features/users/components/user-detail";

export default function UserDetailPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN]}>
      <UserDetail />
    </RequireRole>
  );
}
