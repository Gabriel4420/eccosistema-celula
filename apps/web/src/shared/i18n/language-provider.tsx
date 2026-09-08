"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";
import { APP_LOCALES, dictionaries } from "./dictionaries";
import type {
  AppLocale,
  TranslationKey,
  TranslationParams
} from "./dictionaries";

export const LANGUAGE_STORAGE_KEY = "mission-atos-language";

export const languageInitializationScript = `
  try {
    const saved = localStorage.getItem(${JSON.stringify(LANGUAGE_STORAGE_KEY)});
    const locales = ${JSON.stringify(APP_LOCALES)};
    const locale = locales.includes(saved) ? saved : "pt-BR";
    document.documentElement.lang = locale;
  } catch { document.documentElement.lang = "pt-BR"; }
`;

type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

interface LanguageContextValue {
  readonly locale: AppLocale;
  readonly t: TranslateFn;
  readonly changeLanguage: (locale: AppLocale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? match : String(value);
  });
}

export function LanguageProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(() => {
    if (typeof window === "undefined") return "pt-BR";
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isAppLocale(saved) ? saved : "pt-BR";
  });

  const changeLanguage = useCallback((next: AppLocale) => {
    setLocale(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = dictionaries[locale]["app.title"];
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", dictionaries[locale]["app.meta.description"]);
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      t: (key, params) => interpolate(dictionaries[locale][key] ?? key, params),
      changeLanguage
    }),
    [locale, changeLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
}
