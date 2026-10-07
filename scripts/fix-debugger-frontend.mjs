import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const localesDir = join(
  root,
  "node_modules/@react-native/debugger-frontend/dist/third-party/front_end/core/i18n/locales"
);

const supportedLocales = ["pt", "es", "de", "it", "fr", "ja", "ko"];

if (!existsSync(localesDir)) {
  process.exit(0);
}

const fallback = join(localesDir, "en-US.json");

for (const locale of supportedLocales) {
  const target = join(localesDir, `${locale}.json`);
  if (!existsSync(target)) {
    copyFileSync(fallback, target);
  }
}