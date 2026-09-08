"use client";

import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { Sidebar } from "./sidebar";
import { SkipLink } from "./skip-link";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/src/shared/theme/theme-toggle";
import { useI18n } from "@/src/shared/i18n/language-provider";

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="shell">
      <SkipLink />
      <div className="shell__body">
        <Sidebar />
        <div className="shell__workspace">
          <header className="header">
            <div className="header__context">
              <span className="header__section">{t("shell.section")}</span>
              <Breadcrumbs />
            </div>
            <div className="header__actions">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="shell__content" id="main-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
