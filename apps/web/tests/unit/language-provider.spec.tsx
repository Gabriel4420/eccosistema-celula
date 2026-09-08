import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { dictionaries, APP_LOCALES, DEFAULT_LOCALE } from "@/src/shared/i18n/dictionaries";
import { LanguageProvider, useI18n, LANGUAGE_STORAGE_KEY } from "@/src/shared/i18n/language-provider";

describe("i18n dictionary integrity", () => {
  it("defines identical keys across all supported locales", () => {
    const ptKeys = Object.keys(dictionaries["pt-BR"]).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    const esKeys = Object.keys(dictionaries.es).sort();

    expect(enKeys).toEqual(ptKeys);
    expect(esKeys).toEqual(ptKeys);
  });

  it("contains non-empty translations for all keys", () => {
    for (const locale of APP_LOCALES) {
      const dict = dictionaries[locale];
      for (const [, value] of Object.entries(dict)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("has DEFAULT_LOCALE set to pt-BR", () => {
    expect(DEFAULT_LOCALE).toBe("pt-BR");
  });
});

describe("LanguageProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "pt-BR";
  });

  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );

  it("defaults to pt-BR when no language is saved in localStorage", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe("pt-BR");
    expect(result.current.t("nav.dashboard")).toBe("Painel");
    expect(document.documentElement.lang).toBe("pt-BR");
  });

  it("initializes with saved language from localStorage", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe("en");
    expect(result.current.t("nav.dashboard")).toBe("Dashboard");
    expect(document.documentElement.lang).toBe("en");
  });

  it("updates translations, DOM lang and localStorage on changeLanguage", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.t("nav.settings")).toBe("Configurações");

    act(() => {
      result.current.changeLanguage("en");
    });

    expect(result.current.locale).toBe("en");
    expect(result.current.t("nav.settings")).toBe("Settings");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");

    act(() => {
      result.current.changeLanguage("es");
    });

    expect(result.current.locale).toBe("es");
    expect(result.current.t("nav.settings")).toBe("Configuración");
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
  });

  it("interpolates parameters in translation strings", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const message = result.current.t("dash.access", { role: "Pastor" });
    expect(message).toBe("Acesso: Pastor");

    act(() => {
      result.current.changeLanguage("en");
    });

    const messageEn = result.current.t("dash.access", { role: "Pastor" });
    expect(messageEn).toBe("Access: Pastor");
  });
});
