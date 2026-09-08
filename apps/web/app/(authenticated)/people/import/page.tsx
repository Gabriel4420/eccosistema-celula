"use client";

import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";
import { BulkImportGuide } from "@/src/features/bulk-import/components/bulk-import-guide";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_PASTOR } from "@/src/shared/auth/session";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function ImportPeoplePage() {
  const { t } = useI18n();
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR]}>
      <BulkImportGuide domain="people" />
      <BulkImportForm
        domain="people"
        title={t("people.import.title")}
        description={t("people.import.subtitle")}
        backHref="/people"
        templateHref="/templates/imports/people.csv"
      />
    </RequireRole>
  );
}
