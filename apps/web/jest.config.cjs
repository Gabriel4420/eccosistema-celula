module.exports = {
  clearMocks: true,
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/tests/unit/**/*.spec.ts",
    "<rootDir>/tests/unit/**/*.spec.tsx",
    "<rootDir>/src/**/*.spec.ts",
    "<rootDir>/src/**/*.spec.tsx"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }]
  }
};
