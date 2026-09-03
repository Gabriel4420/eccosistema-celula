import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_PASTOR } from "@/src/shared/auth/session";

export default function ImportCellsPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR]}>
      <BulkImportForm
        domain="cells"
        title="Importar células"
        description="Cadastre células em formação ou ativas usando dados já preparados."
        backHref="/cells"
        templateHref="/templates/imports/cells.csv"
      />
    </RequireRole>
  );
}
