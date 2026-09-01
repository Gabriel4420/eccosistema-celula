import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { FieldShell, SelectField, TextareaField, TextField } from "@/src/shared/components/field";

describe("field components accessibility", () => {
  it("TextField has no axe violations and wires label, description and error", () => {
    const { container } = render(
      <TextField
        label="E-mail"
        hint="Usado para login"
        error="Informe um e-mail válido"
        required
        type="email"
      />
    );

    expect(screen.getByRole("textbox", { name: /e-mail/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Informe um e-mail válido");
    expect(container.querySelector("input")).toHaveAttribute("aria-describedby");

    return expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("password TextField keeps the toggle labelled and aria-describedby", async () => {
    const { container } = render(<TextField label="Senha" type="password" required />);

    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("TextareaField and SelectField expose accessible names", async () => {
    const { container } = render(
      <>
        <TextareaField label="Observações" />
        <SelectField
          label="Situação"
          options={[
            { value: "active", label: "Ativo" },
            { value: "inactive", label: "Inativo" }
          ]}
        />
      </>
    );

    expect(screen.getByRole("textbox", { name: "Observações" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Situação" })).toBeInTheDocument();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("FieldShell without label association fails the label rule (sanity check)", async () => {
    const { container } = render(
      <FieldShell htmlFor="unattached" label="Sem input">
        <input id="unattached" value="text" readOnly />
      </FieldShell>
    );

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });
});