import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN } from "@/src/shared/auth/session";
import { CreateUserForm } from "@/src/features/users/components/create-user-form";

export default function NewUserPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN]}>
      <CreateUserForm />
    </RequireRole>
  );
}
