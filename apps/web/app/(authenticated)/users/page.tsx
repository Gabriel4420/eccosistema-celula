import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN } from "@/src/shared/auth/session";
import { UsersList } from "@/src/features/users/components/users-list";

export default function UsersPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN]}>
      <Suspense
        fallback={
          <div aria-label="Carregando usuários">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        }
      >
        <UsersList />
      </Suspense>
    </RequireRole>
  );
}
