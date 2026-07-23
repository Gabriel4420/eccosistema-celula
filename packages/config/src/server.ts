import { z } from "zod";

const serverEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.url().startsWith("postgresql://").optional(),
  TEST_DATABASE_URL: z.url().startsWith("postgresql://").optional()
});

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://")
});

const testDatabaseEnvironmentSchema = z.object({
  TEST_DATABASE_URL: z
    .url()
    .startsWith("postgresql://")
    .refine((url) => new URL(url).pathname.toLowerCase().includes("test"), {
      message: "TEST_DATABASE_URL must identify a test database"
    })
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}

export function parseDatabaseEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): z.infer<typeof databaseEnvironmentSchema> {
  return databaseEnvironmentSchema.parse(environment);
}

export function parseTestDatabaseEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): z.infer<typeof testDatabaseEnvironmentSchema> {
  return testDatabaseEnvironmentSchema.parse(environment);
}
