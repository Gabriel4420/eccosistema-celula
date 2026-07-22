import { z } from "zod";

const webPublicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:3001")
});

export type WebPublicEnvironment = z.infer<typeof webPublicEnvironmentSchema>;

export function parseWebPublicEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): WebPublicEnvironment {
  return webPublicEnvironmentSchema.parse(environment);
}
