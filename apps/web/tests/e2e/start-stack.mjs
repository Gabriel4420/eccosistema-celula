import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const webRoot = resolve(root, "apps/web");

const E2E_CHURCH_ID = "11111111-1111-4111-8111-111111111111";
const webPort = process.env.E2E_WEB_PORT ?? "3000";
const apiPort = process.env.E2E_API_PORT ?? "3001";
const webUrl = `http://127.0.0.1:${webPort}`;
const apiUrl = `http://127.0.0.1:${apiPort}`;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl || !new URL(testDatabaseUrl).pathname.toLowerCase().includes("test")) {
  throw new Error("TEST_DATABASE_URL must identify a test database");
}

const apiEnvironment = {
  ...process.env,
  NODE_ENV: "test",
  PORT: apiPort,
  DATABASE_URL: testDatabaseUrl,
  AUTH_CHURCH_ID: E2E_CHURCH_ID,
  JWT_ACCESS_SECRET: "e2e-access-secret-that-is-at-least-32-characters",
  REFRESH_TOKEN_PEPPER: "e2e-refresh-pepper-that-is-distinct-and-long",
  AUTH_LOGIN_IP_LIMIT: "100",
  AUTH_LOGIN_ACCOUNT_LIMIT: "100",
  AUTH_COOKIE_SECURE: "false",
  CORS_ORIGINS: webUrl
};

const webEnvironment = {
  ...process.env,
  NEXT_PUBLIC_API_URL: apiUrl
};

function spawnServer(command, args, environment, name) {
  const child = spawn(command, args, {
    cwd: webRoot,
    env: environment,
    shell: false,
    stdio: "pipe"
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code, signal) => {
    process.stdout.write(`[${name}] exited with code=${code} signal=${signal}\n`);
    shutdown();
  });
  return child;
}

const api = spawnServer(
  process.execPath,
  [resolve(root, "apps/api/dist/main.js")],
  apiEnvironment,
  "api"
);
const web = spawnServer(
  process.execPath,
  [resolve(root, "node_modules/next/dist/bin/next"), "dev", "--port", webPort],
  webEnvironment,
  "web"
);

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (web && !web.killed) web.kill("SIGTERM");
  if (api && !api.killed) api.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
