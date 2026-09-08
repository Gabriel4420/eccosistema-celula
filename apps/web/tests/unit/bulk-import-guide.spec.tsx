import { screen, within } from "@testing-library/react";
import { BulkImportGuide } from "@/src/features/bulk-import/components/bulk-import-guide";
import { renderWithI18n } from "./helpers/render-with-i18n";

describe("BulkImportGuide", () => {
  it("explains the people columns and JSON shape", () => {
    renderWithI18n(<BulkImportGuide domain="people" />);

    expect(screen.getByRole("heading", { name: "Como preparar o arquivo" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Colunas aceitas para importar pessoas" });
    expect(within(table).getByRole("columnheader", { name: "Coluna" })).toBeInTheDocument();
    expect(within(table).getByText("fullName")).toBeInTheDocument();
    expect(within(table).getByText("cellCode")).toBeInTheDocument();
    expect(screen.getByText(/"fullName": "Maria da Silva"/)).toBeInTheDocument();
  });

  it("explains the cell day codes and leadership requirements", () => {
    renderWithI18n(<BulkImportGuide domain="cells" />);

    const table = screen.getByRole("table", { name: "Colunas aceitas para importar células" });
    expect(within(table).getByText("leaderId")).toBeInTheDocument();
    expect(screen.getByText("WEDNESDAY")).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE exige líder e supervisor/)).toBeInTheDocument();
  });

  it("explains the user roles and password requirements", () => {
    renderWithI18n(<BulkImportGuide domain="users" />);

    const table = screen.getByRole("table", { name: "Colunas aceitas para importar usuários" });
    expect(within(table).getByText("initialPassword")).toBeInTheDocument();
    expect(screen.getByText(/ADMIN\|PASTOR/)).toBeInTheDocument();
    expect(screen.getByText(/"roles": \["LEADER"\]/)).toBeInTheDocument();
  });
});
