import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

const FICTIONAL_CHURCH_ID = "00000000-0000-4000-8000-000000000001";

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.church.upsert({
      where: { slug: "igreja-exemplo-ficticia" },
      create: {
        id: FICTIONAL_CHURCH_ID,
        name: "Igreja Exemplo Fictícia",
        slug: "igreja-exemplo-ficticia",
        email: "contato@igreja-exemplo.test",
        phone: "+5511999999999",
        addressLine: "Rua Exemplo",
        addressNumber: "100",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postalCode: "01001000",
        country: "BR",
        timezone: "America/Sao_Paulo",
        weekStartsOn: "SUNDAY"
      },
      update: {
        name: "Igreja Exemplo Fictícia",
        email: "contato@igreja-exemplo.test",
        phone: "+5511999999999",
        addressLine: "Rua Exemplo",
        addressNumber: "100",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postalCode: "01001000",
        country: "BR",
        timezone: "America/Sao_Paulo",
        weekStartsOn: "SUNDAY"
      }
    });
    console.info("Seed fictícia aplicada com sucesso.");
  } finally {
    await prisma.$disconnect();
  }
}

void seed().catch(() => {
  console.error("Falha ao aplicar a seed fictícia.");
  process.exitCode = 1;
});
