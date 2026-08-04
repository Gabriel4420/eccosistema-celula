import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("church settings", () => {
  test("any authenticated user can read the institutional data", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await page.goto("/church/settings");
    await expect(page.getByRole("heading", { name: "Igreja" })).toBeVisible();
    await expect(page.getByLabel("Nome")).toHaveValue("Igreja E2E Fictícia");
    await expect(page.getByLabel("E-mail")).toHaveValue("contato@igreja-e2e.test");
    await expect(page.getByLabel("Fuso horário")).toHaveValue("America/Sao_Paulo");
  });

  test("ADMIN updates the church e-mail", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/church/settings");
    const emailField = page.getByLabel("E-mail");
    await emailField.fill("contato-novo@igreja-e2e.test");
    await page.getByRole("button", { name: "Salvar dados" }).click();
    await expect(page.getByText("Dados da igreja atualizados.")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue("contato-novo@igreja-e2e.test");
  });

  test("LEADER cannot save church changes (no submit button)", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await page.goto("/church/settings");
    await expect(page.getByRole("button", { name: "Salvar dados" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar configurações" })).not.toBeVisible();
  });
});
