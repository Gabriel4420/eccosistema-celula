import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { FIXTURES, login } from "./support";

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 }
] as const;

const primaryScreens = [
  { path: "/dashboard", heading: "Painel" },
  { path: "/users", heading: "Usuários" },
  { path: "/church/settings", heading: "Igreja" },
  { path: "/people", heading: "Pessoas" },
  { path: "/profile", heading: "Meu perfil" }
] as const;

test.describe("accessibility and responsive navigation", () => {
  test("supports the complete login flow by keyboard", async ({ page }) => {
    await page.goto("/login");

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo principal" })).toBeFocused();
    const email = page.getByRole("textbox", { name: "E-mail" });
    await focusByTab(page, email);
    await page.keyboard.type(FIXTURES.admin.email);

    const password = page.getByRole("textbox", { name: "Senha" });
    await focusByTab(page, password);
    await page.keyboard.type("e2e-password-1234");

    await focusByTab(page, page.getByRole("button", { name: "Mostrar senha" }));
    await focusByTab(page, page.getByRole("button", { name: "Entrar" }));
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  });

  for (const viewport of viewports) {
    test(`keeps primary screens usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page, FIXTURES.admin.email);

      for (const screen of primaryScreens) {
        await page.goto(screen.path);
        await expect(page.getByRole("heading", { name: screen.heading })).toBeVisible();
        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalOverflow).toBe(false);
      }
    });
  }

  test("has no serious or critical axe violations on primary screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const scans: Array<Promise<void>> = [
      scanPage(page)
    ];

    scans.push(
      (async () => {
        await login(page, FIXTURES.admin.email);
        for (const screen of primaryScreens) {
          await page.goto(screen.path);
          await expect(page.getByRole("heading", { name: screen.heading })).toBeVisible();
          await scanPage(page);
        }
      })()
    );

    await Promise.all(scans);
  });

  test("opens and closes the mobile drawer with the hamburger", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await login(page, FIXTURES.admin.email);

    const toggle = page.getByRole("button", { name: "Abrir menu" });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByRole("link", { name: "Pessoas" })).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("keeps the dashboard usable at 200 percent zoom", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, FIXTURES.admin.email);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });

    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pessoas" }).first()).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

async function focusByTab(page: Page, target: Locator): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  await expect(target).toBeFocused();
}

async function scanPage(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? "")
  );
  expect(
    blocking.map((violation) => `${violation.id}: ${violation.help}`)
  ).toEqual([]);
}
