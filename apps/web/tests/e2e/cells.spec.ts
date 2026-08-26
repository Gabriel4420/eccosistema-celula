import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("cells management", () => {
  test("lists cells and opens the detail page as LEADER", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await page.goto("/cells");
    await expect(page.getByRole("heading", { name: "Células" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Célula E2E Esperança" })).toBeVisible();
    await page.getByRole("link", { name: "Célula E2E Esperança" }).click();
    await expect(page).toHaveURL(/\/cells\/[0-9a-f-]{36}/);
    await expect(page.getByRole("heading", { name: "Célula E2E Esperança" })).toBeVisible();
  });

  test("LEADER cannot access the create page", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await page.goto("/cells/new");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test("creates a cell as ADMIN", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/cells/new");
    await expect(page.getByRole("heading", { name: "Nova célula" })).toBeVisible();

    await page.getByLabel("Código").fill("CEL-E2E-002");
    await page.getByRole("textbox", { name: /^Nome/ }).fill("Célula E2E Nova");
    await page.getByRole("combobox", { name: "Supervisor" }).fill("Sofia");
    await page.getByRole("option", { name: /Sofia Supervisora/ }).click();
    await page.getByRole("textbox", { name: /^Endereço/ }).fill("Rua E2E, 200");
    await page.getByRole("button", { name: "Criar célula" }).click();

    await expect(page).toHaveURL(/\/cells\/[0-9a-f-]{36}/);
    await expect(page.getByRole("heading", { name: "Célula E2E Nova" })).toBeVisible();
  });
});
