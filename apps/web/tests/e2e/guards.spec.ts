import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("visual role guards", () => {
  test("PASTOR cannot open the users area", async ({ page }) => {
    await login(page, FIXTURES.pastor.email);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/access-denied/);
    await expect(page.getByText("Acesso negado")).toBeVisible();
  });

  test("LEADER cannot open the people creation page", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await page.goto("/people/new");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test("SUPERVISOR cannot open the people creation page", async ({ page }) => {
    await login(page, FIXTURES.supervisor.email);
    await page.goto("/people/new");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test("ADMIN sees the users shortcut on the dashboard", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await expect(page.getByRole("link", { name: /Usuários/ }).first()).toBeVisible();
  });
});
