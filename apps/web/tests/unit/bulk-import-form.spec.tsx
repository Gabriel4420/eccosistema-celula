import { fireEvent, render, screen } from "@testing-library/react";
import { BulkImportForm } from "@/src/features/bulk-import/components/bulk-import-form";

jest.mock("@/src/providers/session-provider", () => ({
  useSession: () => ({ api: {} })
}));

function renderForm() {
  render(
    <BulkImportForm
      domain="people"
      title="Importar pessoas"
      description="Cadastre várias pessoas."
      backHref="/people"
      templateHref="/templates/imports/people.csv"
    />
  );
}

describe("BulkImportForm file picker", () => {
  it("shows the styled picker and the chosen file name", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Escolher arquivo" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum arquivo selecionado")).toBeInTheDocument();

    const file = new File(["fullName\nMaria"], "pessoas.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText(/arquivo/i), { target: { files: [file] } });

    expect(screen.getByRole("button", { name: "Trocar arquivo" })).toBeInTheDocument();
    expect(screen.getByText(/pessoas\.csv/)).toBeInTheDocument();
  });

  it("reports an invalid file type", () => {
    renderForm();

    const file = new File(["fake"], "foto.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/arquivo/i), { target: { files: [file] } });

    expect(
      screen.getByText("Use um arquivo nos formatos XLSX, CSV ou JSON.")
    ).toBeInTheDocument();
  });
});
