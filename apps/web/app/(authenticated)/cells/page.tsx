import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_LEADER, ROLE_PASTOR, ROLE_SUPERVISOR } from "@/src/shared/auth/session";
import { CellsList } from "@/src/features/cells/components/cells-list";

export default function CellsPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR, ROLE_SUPERVISOR, ROLE_LEADER]}>
      <Suspense
        fallback={
          <div aria-label="Carregando células">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        }
      >
        <CellsList />
      </Suspense>
    </RequireRole>
  );
}
