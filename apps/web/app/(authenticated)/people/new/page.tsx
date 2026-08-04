import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_PASTOR } from "@/src/shared/auth/session";
import { CreatePersonForm } from "@/src/features/people/components/create-person-form";

export default function NewPersonPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR]}>
      <CreatePersonForm />
    </RequireRole>
  );
}
