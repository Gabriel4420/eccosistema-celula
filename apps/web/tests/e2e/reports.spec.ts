import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("reports", () => {
  test("renders the reports hub with links to each report as ADMIN", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Relatórios Pendentes/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Frequência/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Visitantes/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Encontros/ })).toBeVisible();
  });

  test("loads the attendance report and exposes export controls", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/reports/attendance");

    await expect(page.getByRole("heading", { name: "Frequência" })).toBeVisible();
    const exports = page.getByRole("button", { name: /Exportar/ });
    const exportCount = await exports.count();
    expect(exportCount).toBeGreaterThanOrEqual(1);
  });

  test("scopes the reports hub for a leader", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  });
});