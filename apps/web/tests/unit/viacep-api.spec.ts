import { lookupAddressByPostalCode, PostalCodeLookupError } from "@/src/features/church/api/viacep-api";

describe("ViaCEP client", () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it("normalizes the CEP and maps the address response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ logradouro: " Praça da Sé ", bairro: "Sé", localidade: "São Paulo", uf: "sp" })
    } as Response);
    await expect(lookupAddressByPostalCode("01001-000")).resolves.toEqual({
      addressLine: "Praça da Sé", neighborhood: "Sé", city: "São Paulo", state: "SP"
    });
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/01001000/json/", expect.objectContaining({ headers: { Accept: "application/json" } }));
  });

  it("rejects invalid and unknown postal codes", async () => {
    await expect(lookupAddressByPostalCode("123")).rejects.toMatchObject({ code: "INVALID_POSTAL_CODE" });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ erro: true }) } as Response);
    await expect(lookupAddressByPostalCode("99999999")).rejects.toEqual(new PostalCodeLookupError("POSTAL_CODE_NOT_FOUND"));
  });
});
