import type { ReactNode } from "react";
import { SkipLink } from "@/src/shared/navigation/skip-link";
import { ThemeToggle } from "@/src/shared/theme/theme-toggle";

export default function PublicLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="shell">
      <SkipLink />
      <div className="public-theme-toggle"><ThemeToggle /></div>
      <main id="main-content">{children}</main>
    </div>
  );
}
