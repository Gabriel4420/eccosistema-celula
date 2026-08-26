import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { parseDatabaseEnvironment } from "@mission-atos/config/server";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../../../.env"), quiet: true });

parseDatabaseEnvironment(process.env);

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  throw new Error("The Prisma wrapper must be executed through an npm script");
}
const prismaArguments = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  [npmCliPath, "exec", "prisma", "--", ...prismaArguments],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
