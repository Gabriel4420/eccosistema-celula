import type { ReactNode } from "react";
import { SkipLink } from "@/src/shared/navigation/skip-link";

export default function PublicLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="shell">
      <SkipLink />
      <main id="main-content">{children}</main>
    </div>
  );
}
