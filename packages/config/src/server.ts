import { z } from "zod";

const nonPlaceholderSecret = (message: string) =>
  z
    .string()
    .min(32)
    .refine((value) => !value.startsWith("replace-with-"), {
      message
    });

const serverEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.url().startsWith("postgresql://").optional(),
  TEST_DATABASE_URL: z.url().startsWith("postgresql://").optional(),
  AUTH_CHURCH_ID: z
    .uuid()
    .refine((value) => !value.startsWith("replace-with-"), {
      message: "AUTH_CHURCH_ID must not be a placeholder value"
    })
    .optional(),
  JWT_ACCESS_SECRET: nonPlaceholderSecret(
    "JWT_ACCESS_SECRET must not be a placeholder value"
  ).optional(),
  JWT_ISSUER: z.string().min(1).default("mission-atos-api"),
  JWT_AUDIENCE: z.string().min(1).default("mission-atos-clients"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(600),
  AUTH_LOGIN_IP_LIMIT: z.coerce.number().int().min(1).max(10_000).default(10),
  AUTH_LOGIN_ACCOUNT_LIMIT: z.coerce.number().int().min(1).max(10_000).default(5),
  REFRESH_TOKEN_PEPPER: nonPlaceholderSecret(
    "REFRESH_TOKEN_PEPPER must not be a placeholder value"
  ).optional(),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(3600)
    .max(2_592_000)
    .default(259_200),
  AUTH_COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CORS_ORIGINS: z.string().default("http://localhost:3000")
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && value.AUTH_COOKIE_SECURE === false) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["AUTH_COOKIE_SECURE"],
      message: "AUTH_COOKIE_SECURE must be true in production"
    });
  }
});

const authenticationEnvironmentSchema = serverEnvironmentSchema.required({
  DATABASE_URL: true,
  AUTH_CHURCH_ID: true,
  JWT_ACCESS_SECRET: true,
  REFRESH_TOKEN_PEPPER: true
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

export type AuthenticationEnvironment = z.infer<
  typeof authenticationEnvironmentSchema
>;

export function parseAuthenticationEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): AuthenticationEnvironment {
  const parsed = authenticationEnvironmentSchema.parse(environment);
  if (parsed.JWT_ACCESS_SECRET === parsed.REFRESH_TOKEN_PEPPER) {
    throw new Error("Authentication secrets must be distinct");
  }
  return parsed;
}

export function parseTestDatabaseEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): z.infer<typeof testDatabaseEnvironmentSchema> {
  const parsed = testDatabaseEnvironmentSchema.parse(environment);
  if (
    environment.DATABASE_URL &&
    environment.DATABASE_URL === parsed.TEST_DATABASE_URL
  ) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  }
  return parsed;
}
