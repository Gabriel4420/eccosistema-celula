import { expect, test } from "@playwright/test";
import { login, trackConsoleErrors } from "./support";

test.describe("authentication flow", () => {
  test("rejects invalid credentials with a generic error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@e2e.test");
    await page.getByLabel("Senha").fill("wrong-password-999");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "E-mail ou senha inválidos." })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid credentials reach the dashboard", async ({ page }) => {
    const consoleTracker = trackConsoleErrors(page);
    await login(page, "admin@e2e.test");
    await expect(
      page.getByRole("heading", { name: "Painel" })
    ).toBeVisible();
    await consoleTracker.assertClean();
  });

  test("logs out and returns to the login screen", async ({ page }) => {
    await login(page, "admin@e2e.test");
    await page.getByRole("button", { name: "Minha conta" }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Ecossistema de Células" })
    ).toBeVisible();
  });
});
