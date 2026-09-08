import globals from "globals";
import nextConfig from "@mission-atos/eslint-config/next";

const webConfig = [
  { ignores: [".next-e2e*/**"] },
  ...nextConfig,
  {
    files: ["**/*.{cjs,js,mjs}"],
    languageOptions: {
      globals: globals.node
    }
  }
];

export default webConfig;
