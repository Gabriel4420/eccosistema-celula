"use client";

import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { Sidebar } from "./sidebar";
import { SkipLink } from "./skip-link";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/src/shared/theme/theme-toggle";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";
import { toast } from "@/src/shared/toast/toast-store";
import { useAccessibilityShortcuts } from "@/src/shared/accessibility/use-accessibility-shortcuts";

const accessibilityOptionKeys: Record<string, TranslationKey> = {
  system: "settings.accessibility.system",
  standard: "settings.accessibility.standard",
  high: "settings.accessibility.high",
  large: "settings.accessibility.large",
  "extra-large": "settings.accessibility.extraLarge",
  reduce: "settings.accessibility.reduce",
  enhanced: "settings.accessibility.enhanced"
};

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { t } = useI18n();
  useAccessibilityShortcuts((preferences) => {
    toast({
      kind: "info",
      title: t("settings.section.accessibility"),
      description: [
        t("settings.accessibility.shortcut.contrast", {
          value: t(accessibilityOptionKeys[preferences.accessibilityContrast]!)
        }),
        t("settings.accessibility.shortcut.scale", {
          value: t(accessibilityOptionKeys[preferences.accessibilityTextScale]!)
        })
      ].join(" · ")
    });
  });
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
