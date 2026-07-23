import "dotenv/config";
import { defineConfig } from "prisma/config";

const schemaOnlyUrl =
  "postgresql://schema_only:schema_only@127.0.0.1:1/schema_only";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? schemaOnlyUrl
  }
});
