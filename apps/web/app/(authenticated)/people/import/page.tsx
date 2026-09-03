import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN, ROLE_PASTOR } from "@/src/shared/auth/session";

export default function ImportPeoplePage() {
  return (
    <RequireRole allow={[ROLE_ADMIN, ROLE_PASTOR]}>
      <BulkImportForm
        domain="people"
        title="Importar pessoas"
        description="Cadastre várias pessoas e, opcionalmente, vincule-as a células pelo código."
        backHref="/people"
        templateHref="/templates/imports/people.csv"
      />
    </RequireRole>
  );
}
