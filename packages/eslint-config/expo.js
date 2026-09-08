import base from "./base.js";

export default [
  ...base,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        __DEV__: "readonly",
        console: "readonly",
        fetch: "readonly",
        process: "readonly"
      }
    }
  }
];