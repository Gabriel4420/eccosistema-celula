"use client";

import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { Sidebar } from "./sidebar";
import { SkipLink } from "./skip-link";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="shell">
      <SkipLink />
      <div className="shell__body">
        <Sidebar />
        <div className="shell__content">
          <header className="header">
            <Breadcrumbs />
            <div className="header__actions">
              <UserMenu />
            </div>
          </header>
          <main id="main-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
