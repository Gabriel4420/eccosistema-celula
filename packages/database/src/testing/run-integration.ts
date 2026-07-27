import { spawnSync } from "node:child_process";

import { parseTestDatabaseEnvironment } from "@mission-atos/config/server";

const { TEST_DATABASE_URL } = parseTestDatabaseEnvironment(process.env);
const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  throw new Error("Integration tests must be executed through an npm script");
}
const environment = {
  ...process.env,
  DATABASE_URL: TEST_DATABASE_URL,
  NODE_ENV: "test"
};

function run(command: string, args: readonly string[]): void {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, [npmCliPath, "run", "db:migrate:deploy"]);
run(process.execPath, [npmCliPath, "run", "db:seed"]);
run(process.execPath, [npmCliPath, "run", "db:seed"]);
run(process.execPath, [
  "../../node_modules/jest/bin/jest.js",
  "--runInBand",
  "--config",
  "jest.integration.config.cjs"
]);
