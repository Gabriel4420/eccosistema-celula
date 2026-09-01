import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("dashboard analytics", () => {
  test("renders indicator cards, chart and alerts for the church scope as ADMIN", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole("heading", { name: "Saúde da igreja — últimos 30 dias" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evolução mensal" })).toBeVisible();

    const card = page.locator(".stat-card", { hasText: "Pessoas" });
    await expect(card).toBeVisible();

    const chart = page.getByRole("img", { name: /Gráfico mensal de encontros, presentes e visitantes/ });
    await expect(chart).toBeVisible();

    const shortcuts = page.getByRole("heading", { name: "O que você quer fazer?" });
    await expect(shortcuts).toBeVisible();
  });

  test("renders a clickable alert linking to the cells page", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await expect(page).toHaveURL(/\/dashboard/);

    const alert = page.locator("a.analytics-alert--warning").first();
    const alertCount = await alert.count();
    const ok = page.locator(".analytics-alert--ok").first();

    if (alertCount > 0) {
      await expect(alert).toBeVisible();
      await Promise.all([
        page.waitForURL(/\/cells/, { timeout: 15_000 }),
        alert.click()
      ]);
    } else {
      await expect(ok).toBeVisible();
      await expect(ok).toContainText(/todas as células ativas/);
    }
  });

  test("scopes indicators to the leader's own cells", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole("heading", { name: "Saúde da igreja — últimos 30 dias" })).toBeVisible();
    const cellsCard = page.locator(".stat-card", { hasText: "Células ativas" });
    await expect(cellsCard).toBeVisible();
  });
});
