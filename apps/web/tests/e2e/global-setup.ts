import { seedDatabase } from "./fixtures/seed";

export default async function globalSetup(): Promise<void> {
  await seedDatabase();
}
