"use client";

import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";
import { BulkImportGuide } from "@/src/features/bulk-import/components/bulk-import-guide";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN } from "@/src/shared/auth/session";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function ImportUsersPage() {
  const { t } = useI18n();
  return (
    <RequireRole allow={[ROLE_ADMIN]}>
      <BulkImportGuide domain="users" />
      <BulkImportForm
        domain="users"
        title={t("users.import.title")}
        description={t("users.import.subtitle")}
        backHref="/users"
        templateHref="/templates/imports/users.csv"
      />
    </RequireRole>
  );
}
