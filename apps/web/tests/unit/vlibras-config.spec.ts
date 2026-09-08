import { createVlibrasWidget, VLIBRAS_DEFAULT_APP_URL, VLIBRAS_DEFAULT_SCRIPT_URL } from "@/src/shared/accessibility/vlibras/vlibras-config";

describe("vlibras-config", () => {
  it("exposes the official VLibras endpoints as defaults", () => {
    expect(VLIBRAS_DEFAULT_SCRIPT_URL).toBe(
      "https://vlibras.gov.br/app/vlibras-plugin.js",
    );
    expect(VLIBRAS_DEFAULT_APP_URL).toBe("https://vlibras.gov.br/app");
  });

  it("does not instantiate the widget before VLibras is available", () => {
    expect(createVlibrasWidget(VLIBRAS_DEFAULT_APP_URL)).toBe(false);
  });

  it("instantiates the widget once VLibras is available", () => {
    const Widget = jest.fn();
    Object.defineProperty(window, "VLibras", {
      configurable: true,
      value: { Widget },
    });

    const created = createVlibrasWidget(VLIBRAS_DEFAULT_APP_URL);

    expect(created).toBe(true);
    expect(Widget).toHaveBeenCalledWith(VLIBRAS_DEFAULT_APP_URL);
  });
});