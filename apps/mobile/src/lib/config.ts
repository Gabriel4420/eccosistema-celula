import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().default("http://localhost:3001")
});

export const env = envSchema.parse({
  EXPO_PUBLIC_API_URL:
    process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"
});

export const API_URL = env.EXPO_PUBLIC_API_URL;