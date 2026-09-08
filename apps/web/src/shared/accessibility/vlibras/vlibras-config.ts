export interface VlibrasWidgetConstructor {
  Widget: new (appUrl: string) => void;
}

declare global {
  interface Window {
    VLibras?: VlibrasWidgetConstructor;
  }
}

export const VLIBRAS_DEFAULT_SCRIPT_URL =
  "https://vlibras.gov.br/app/vlibras-plugin.js";

export const VLIBRAS_DEFAULT_APP_URL = "https://vlibras.gov.br/app";

export const VLIBRAS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_VLIBRAS_SCRIPT_URL ?? VLIBRAS_DEFAULT_SCRIPT_URL;

export const VLIBRAS_APP_URL =
  process.env.NEXT_PUBLIC_VLIBRAS_APP_URL ?? VLIBRAS_DEFAULT_APP_URL;

export const vlibrasEnabled =
  process.env.NEXT_PUBLIC_VLIBRAS_ENABLED === "true";

export function createVlibrasWidget(appUrl: string): boolean {
  if (typeof window === "undefined" || typeof window.VLibras === "undefined") {
    return false;
  }

  new window.VLibras.Widget(appUrl);
  return true;
}