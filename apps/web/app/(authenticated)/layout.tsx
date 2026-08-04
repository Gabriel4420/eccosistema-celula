import type { ReactNode } from "react";
import { RequireSession } from "@/src/shared/auth/guards";
import { AppShell } from "@/src/shared/navigation/app-shell";

export default function AuthenticatedLayout({ children }: { readonly children: ReactNode }) {
  return (
    <RequireSession>
      <AppShell>{children}</AppShell>
    </RequireSession>
  );
}
