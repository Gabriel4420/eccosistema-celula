import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("profile", () => {
  test("shows the authenticated user's profile data", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Meu perfil" })
    ).toBeVisible();
    await expect(page.getByText(FIXTURES.admin.email)).toBeVisible();
    await expect(page.getByText("Ativo")).toBeVisible();
  });

  test("updates the own first name", async ({ page }) => {
    await login(page, FIXTURES.pastor.email);
    await page.goto("/profile");
    const nameField = page.locator('input[name="firstName"]');
    await expect(nameField).toHaveValue(FIXTURES.pastor.firstName);
    await nameField.fill("Paulo Renomeado");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Seus dados foram salvos.")).toBeVisible();
    await expect(nameField).toHaveValue("Paulo Renomeado");
  });
});
