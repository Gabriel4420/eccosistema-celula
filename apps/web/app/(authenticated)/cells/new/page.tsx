import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_PASTOR } from "@/src/shared/auth/session";
import { CreateCellForm } from "@/src/features/cells/components/create-cell-form";

export default function NewCellPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR]}>
      <CreateCellForm />
    </RequireRole>
  );
}
