import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";
import { RequireRole } from "@/src/shared/auth/guards";
import { ROLE_ADMIN } from "@/src/shared/auth/session";

export default function ImportUsersPage() {
  return (
    <RequireRole allow={[ROLE_ADMIN]}>
      <BulkImportForm
        domain="users"
        title="Importar usuários"
        description="Crie contas em lote informando senha inicial e nomes dos papéis de acesso."
        backHref="/users"
        templateHref="/templates/imports/users.csv"
      />
    </RequireRole>
  );
}
