"use client";

import Link from "next/link";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main className="auth-shell">
      <div className="empty-state">
        <p className="empty-state__title">{t("notFound.title")}</p>
        <p>{t("notFound.description")}</p>
        <Link className="button button--secondary" href="/">
          {t("notFound.home")}
        </Link>
      </div>
    </main>
  );
}