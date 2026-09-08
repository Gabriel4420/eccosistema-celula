import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/src/shared/i18n/language-provider";

export function renderWithI18n(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}