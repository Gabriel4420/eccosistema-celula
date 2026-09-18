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

  test("restores the session after closing the page with a persistent three-day cookie", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@e2e.test");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("e2e-password-1234");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const cookie = (await context.cookies()).find((item) => item.name === "mission_atos_refresh");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie!.expires - Date.now() / 1000).toBeGreaterThan(259140);
    expect(cookie!.expires - Date.now() / 1000).toBeLessThanOrEqual(259200);
    await page.close();
    const reopened = await context.newPage();
    await reopened.goto("/dashboard");
    await expect(reopened.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(reopened).toHaveURL(/\/dashboard/);
  });

  test("stays signed in through successive access-token renewals", async ({ page }) => {
    await page.clock.install();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@e2e.test");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("e2e-password-1234");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    for (let renewal = 0; renewal < 3; renewal += 1) {
      const response = page.waitForResponse((item) => item.url().endsWith("/auth/refresh") && item.status() === 200);
      await page.clock.fastForward(540_000);
      await response;
      await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard/);
    }
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
