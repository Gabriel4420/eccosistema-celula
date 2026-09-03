import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("bulk import", () => {
  test("PASTOR imports people from csv and sees the row result", async ({ page }) => {
    await login(page, FIXTURES.pastor.email);
    await page.goto("/people/import");

    await expect(page.getByRole("heading", { name: "Importar pessoas" })).toBeVisible();
    await page.getByLabel("Arquivo").setInputFiles({
      name: "people.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(`fullName,email\nPessoa Importada ${Date.now()},import-${Date.now()}@example.test`)
    });
    await page.getByRole("button", { name: "Importar arquivo" }).click();

    await expect(page.getByRole("heading", { name: "Resultado por linha" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Criado" })).toBeVisible();
  });

  test("SUPERVISOR cannot open the people import page", async ({ page }) => {
    await login(page, FIXTURES.supervisor.email);
    await page.goto("/people/import");
    await expect(page).toHaveURL(/\/access-denied/);
  });
});
