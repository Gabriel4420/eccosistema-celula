import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextField, maskEmail, maskPhoneBR } from "@/src/shared/components";
import { renderWithI18n } from "./helpers/render-with-i18n";

describe("maskEmail", () => {
  it("lowercases and removes whitespace", () => {
    expect(maskEmail(" Maria@Example.COM ")).toBe("maria@example.com");
  });
});

describe("maskPhoneBR", () => {
  it("formats a mobile number with country code", () => {
    expect(maskPhoneBR("11999999999")).toBe("+55 (11) 99999-9999");
  });

  it("formats a landline number", () => {
    expect(maskPhoneBR("1199999999")).toBe("+55 (11) 9999-9999");
  });

  it("strips a pasted country code and keeps the mask", () => {
    expect(maskPhoneBR("+55 (11) 99999-9999")).toBe("+55 (11) 99999-9999");
  });

  it("is idempotent on the normalized server format", () => {
    expect(maskPhoneBR("+5511999999999")).toBe("+55 (11) 99999-9999");
  });

  it("returns an empty string for empty input", () => {
    expect(maskPhoneBR("")).toBe("");
  });
});

describe("TextField password toggle", () => {
  it("renders a toggle button and reveals the password", async () => {
    const user = userEvent.setup();
    renderWithI18n(<TextField label="Senha" type="password" name="password" />);
    const input = screen.getByLabelText("Senha") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Mostrar senha" });

    expect(input).toHaveAttribute("type", "password");
    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
  });
});

function EmailField() {
  const [value, setValue] = useState("");
  return (
    <TextField
      label="E-mail"
      type="email"
      name="email"
      mask="email"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function PhoneField() {
  const [value, setValue] = useState("");
  return (
    <TextField
      label="Telefone"
      name="phone"
      mask="phone"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe("TextField masks", () => {
  it("masks the e-mail as the user types (controlled)", async () => {
    const user = userEvent.setup();
    renderWithI18n(<EmailField />);
    const input = screen.getByLabelText("E-mail");
    await user.type(input, "Ana@Exemplo.COM");
    expect(input).toHaveValue("ana@exemplo.com");
  });

  it("masks the phone as the user types (controlled)", async () => {
    const user = userEvent.setup();
    renderWithI18n(<PhoneField />);
    const input = screen.getByLabelText("Telefone");
    await user.type(input, "11999999999");
    expect(input).toHaveValue("+55 (11) 99999-9999");
  });

  it("masks an uncontrolled default value on mount", () => {
    renderWithI18n(<TextField label="Telefone" name="phone" mask="phone" defaultValue="+5511988888888" />);
    expect(screen.getByLabelText("Telefone")).toHaveValue("+55 (11) 98888-8888");
  });
});
