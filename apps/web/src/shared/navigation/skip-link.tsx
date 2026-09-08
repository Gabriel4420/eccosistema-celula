"use client";

import { useI18n } from "@/src/shared/i18n/language-provider";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a className="skip-link" href="#main-content">
      {t("shell.skip")}
    </a>
  );
}
