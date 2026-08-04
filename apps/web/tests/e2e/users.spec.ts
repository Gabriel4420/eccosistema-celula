import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("users management (ADMIN)", () => {
  test("lists the seeded users and searches by e-mail", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/users");
    await expect(
      page.getByRole("heading", { name: "Usuários" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Alice Admin/ })).toBeVisible();

    const search = page.getByLabel("Buscar");
    await search.fill("pastor@e2e.test");
    const pastorRow = page.getByRole("row", { name: /pastor@e2e\.test/ });
    await expect(pastorRow).toBeVisible();
    await expect(pastorRow.getByRole("link").first()).toBeVisible();
  });

  test("creates a new user and lands on the detail page", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/users/new");
    await expect(
      page.getByRole("heading", { name: "Novo usuário" })
    ).toBeVisible();

    await page.locator('input[name="firstName"]').fill("Carla");
    await page.getByLabel("Sobrenome").fill("Cadastro");
    await page.getByLabel("E-mail").fill("carla.cadastro@e2e.test");
    await page.getByLabel("Senha inicial").fill("nova-senha-1234");
    await page.getByLabel("PASTOR").check();
    await page.getByRole("button", { name: "Criar usuário" }).click();

    await expect(page).toHaveURL(/\/users\/[0-9a-f-]{36}/);
    await expect(
      page.getByRole("heading", { name: "Carla Cadastro" })
    ).toBeVisible();
  });
});
