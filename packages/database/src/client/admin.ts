import { PrismaPg } from "@prisma/adapter-pg";
import { parseDatabaseEnvironment } from "@mission-atos/config/server";

import { PrismaClient } from "../generated/prisma/client.js";

export function createAdminClient(
  environment: Readonly<Record<string, string | undefined>> = process.env
): PrismaClient {
  const { DATABASE_URL } = parseDatabaseEnvironment(environment);
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });

  return new PrismaClient({ adapter });
}
