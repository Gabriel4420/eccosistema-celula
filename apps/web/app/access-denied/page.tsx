"use client";

import Link from "next/link";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function AccessDeniedPage() {
  const { t } = useI18n();
  return (
    <main className="auth-shell">
      <div className="empty-state">
        <p className="empty-state__title">{t("accessDenied.title")}</p>
        <p>{t("accessDenied.description")}</p>
        <Link className="button button--secondary" href="/dashboard">
          {t("accessDenied.back")}
        </Link>
      </div>
    </main>
  );
}