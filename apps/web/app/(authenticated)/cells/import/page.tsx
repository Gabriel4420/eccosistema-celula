"use client";

import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";
import { BulkImportGuide } from "@/src/features/bulk-import/components/bulk-import-guide";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_PASTOR } from "@/src/shared/auth/session";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function ImportCellsPage() {
  const { t } = useI18n();
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR]}>
      <BulkImportGuide domain="cells" />
      <BulkImportForm
        domain="cells"
        title={t("cells.import.title")}
        description={t("cells.import.subtitle")}
        backHref="/cells"
        templateHref="/templates/imports/cells.csv"
      />
    </RequireRole>
  );
}
