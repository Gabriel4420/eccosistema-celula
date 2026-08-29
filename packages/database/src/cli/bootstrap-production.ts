import { PrismaPg } from "@prisma/adapter-pg";
import { argon2id, hash } from "argon2";

import {
  bootstrapProduction,
  parseProductionBootstrapEnvironment
} from "../bootstrap/production-bootstrap";
import { PrismaClient } from "../generated/prisma/client.js";

async function main(): Promise<void> {
  const environment = parseProductionBootstrapEnvironment(process.env);
  const adapter = new PrismaPg({ connectionString: environment.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await bootstrapProduction(prisma, environment, (password) =>
      hash(password, {
        type: argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1
      })
    );
    console.info(
      result.changed
        ? "Bootstrap de produção aplicado com sucesso."
        : "Bootstrap de produção já estava aplicado; nenhuma alteração foi realizada."
    );
    console.info("Use AUTH_CHURCH_ID=" + result.churchId + " no serviço da API.");
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "erro desconhecido";
  console.error("Falha no bootstrap de produção: " + message);
  process.exitCode = 1;
});
