import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

async function openSettings(page: Parameters<typeof login>[0]): Promise<void> {
  await page.getByRole("link", { name: "Configurações", exact: true }).click();
  await expect(page).toHaveURL(/\/settings/);
}

test.describe("settings", () => {
  test("ADMIN sees Regional, Operacional and Preferências sections", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await openSettings(page);

    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Regional" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Operacional" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Preferências" })).toBeVisible();
    await expect(page.getByLabel("Prazo para relatório (horas)")).toHaveValue("48");
  });

  test("LEADER only sees the Preferências section", async ({ page }) => {
    await login(page, FIXTURES.leader.email);
    await openSettings(page);

    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Regional" })).not.toBeVisible();
    await expect(page.getByRole("group", { name: "Operacional" })).not.toBeVisible();
    await expect(page.getByRole("group", { name: "Preferências" })).toBeVisible();
    await expect(page.getByLabel("Prazo para relatório (horas)")).not.toBeVisible();
  });

  test("saves a theme change, applies it to the DOM and persists it", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await openSettings(page);

    await page.locator('select[name="theme"]').selectOption("dark");
    const prefsForm = page.locator('form:has(select[name="theme"])');
    await prefsForm.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Configurações salvas")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("mission-atos-theme")))
      .toBe("dark");
  });

  test("switching the language re-renders the page in the selected language", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await openSettings(page);

    await page.locator('select[name="language"]').selectOption("en");
    const prefsForm = page.locator('form:has(select[name="theme"])');
    await prefsForm.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Preferences" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page.locator('select[name="language"]').selectOption("pt-BR");
    const localizedPrefsForm = page.locator('form:has(select[name="theme"])');
    await localizedPrefsForm.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  });

  test("submitting without changes is a no-op", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await openSettings(page);

    const prefsForm = page.locator('form:has(select[name="theme"])');
    await prefsForm.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Nenhuma alteração")).toBeVisible();
  });

  test("sidebar link navigates to /settings", async ({ page }) => {
    await login(page, FIXTURES.admin.email);

    await page.getByRole("link", { name: "Configurações", exact: true }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
