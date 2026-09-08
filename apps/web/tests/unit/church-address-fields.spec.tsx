import { fireEvent, screen, waitFor } from "@testing-library/react";
import { ChurchAddressFields } from "@/src/features/church/components/church-address-fields";
import { renderWithI18n } from "./helpers/render-with-i18n";

const address = { line: null, number: "42", complement: null, neighborhood: null, city: null, state: null, postalCode: null, country: "BR" };

describe("ChurchAddressFields", () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock }));
  afterEach(() => fetchMock.mockReset());
  it("fills the address after leaving a valid CEP and preserves the number", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "SP" })
    } as Response);
    renderWithI18n(<ChurchAddressFields address={address} />);
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "01001-000" } });
    fireEvent.blur(screen.getByLabelText("CEP"));
    await waitFor(() => expect(screen.getByLabelText("Logradouro")).toHaveValue("Praça da Sé"));
    expect(screen.getByLabelText("Bairro")).toHaveValue("Sé");
    expect(screen.getByLabelText("Cidade")).toHaveValue("São Paulo");
    expect(screen.getByLabelText("Estado (UF)")).toHaveValue("SP");
    expect(screen.getByLabelText("Número")).toHaveValue("42");
    expect(screen.getByRole("status")).toHaveTextContent("Endereço preenchido pelo CEP.");
  });
});
