"use client";

import { Button } from "@/src/shared/components";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/src/shared/i18n/language-provider";

interface ErrorPageProps {
  readonly error: Error;
  readonly reset: () => void;
}

export default function GlobalErrorBoundary({ reset }: ErrorPageProps) {
  const { t } = useI18n();
  return (
    <main className="auth-shell">
      <div className="error-state" role="alert">
        <h1 className="error-state__title">{t("errorPage.title")}</h1>
        <p>{t("errorPage.description")}</p>
        <Button icon={RotateCcw} onClick={reset}>{t("errorPage.retry")}</Button>
      </div>
    </main>
  );
}
