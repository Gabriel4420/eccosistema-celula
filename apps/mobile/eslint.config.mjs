import node from "@mission-atos/eslint-config/node";
import expo from "@mission-atos/eslint-config/expo";

const nodeGlobals = node.find(
  (config) => config.languageOptions && config.languageOptions.globals
);

export default [
  {
    ignores: [".expo/**", "dist/**", "node_modules/**"]
  },
  ...expo,
  {
    files: ["*.{js,mjs,cjs}"],
    ...nodeGlobals,
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];