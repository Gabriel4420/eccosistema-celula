module.exports = {
  clearMocks: true,
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testTimeout: 30000,
  testMatch: ["<rootDir>/test/**/*.e2e-spec.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }]
  }
};
