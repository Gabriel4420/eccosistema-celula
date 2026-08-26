import { expect, test } from "@playwright/test";
import { trackConsoleErrors } from "./support";

test.describe("authentication flow", () => {
  test("rejects invalid credentials with a generic error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@e2e.test");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("wrong-password-999");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "E-mail ou senha inválidos." })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid credentials reach the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@e2e.test");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("e2e-password-1234");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const consoleTracker = trackConsoleErrors(page);
    await expect(
      page.getByRole("heading", { name: "Painel" })
    ).toBeVisible();
    await consoleTracker.assertClean();
  });

  test("logs out and returns to the login screen", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@e2e.test");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("e2e-password-1234");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("button", { name: /Ver perfil/ }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Ecossistema de Células" })
    ).toBeVisible();
  });
});
