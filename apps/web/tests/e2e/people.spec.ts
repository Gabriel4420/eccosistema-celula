import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("people management", () => {
  test("lists active people and opens the detail page", async ({ page }) => {
    await login(page, FIXTURES.pastor.email);
    await page.goto("/people");
    await expect(
      page.getByRole("heading", { name: "Pessoas" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Maria E2E Ativa" })).toBeVisible();
    await page.getByRole("link", { name: "Maria E2E Ativa" }).click();
    await expect(page).toHaveURL(/\/people\/[0-9a-f-]{36}/);
    await expect(
      page.getByRole("heading", { name: "Maria E2E Ativa" })
    ).toBeVisible();
  });

  test("creates a person as PASTOR", async ({ page }) => {
    await login(page, FIXTURES.pastor.email);
    await page.goto("/people/new");
    await expect(
      page.getByRole("heading", { name: "Nova pessoa" })
    ).toBeVisible();

    await page.getByLabel("Nome completo").fill("Beatriz E2E Nova");
    await page.getByLabel("Telefone").fill("+5511991112222");
    await page.getByRole("button", { name: "Cadastrar pessoa" }).click();

    await expect(page).toHaveURL(/\/people\/[0-9a-f-]{36}/);
    await expect(
      page.getByRole("heading", { name: "Beatriz E2E Nova" })
    ).toBeVisible();
  });

  test("ADMIN can list and reactivate an inactive person from the list", async ({ page }) => {
    await login(page, FIXTURES.admin.email);
    await page.goto("/people?status=INACTIVE");
    await expect(page.getByText("João E2E Inativo")).toBeVisible();

    const inactiveRow = page.getByRole("row", { name: /João E2E Inativo/ });
    await expect(inactiveRow.getByRole("link")).toHaveCount(0);

    await inactiveRow.getByRole("button", { name: "Reativar" }).click();
    await expect(page.getByText(/foi reativado/)).toBeVisible();
    await expect(inactiveRow).not.toBeVisible();
  });

  test("SUPERVISOR does not see observations on the detail page", async ({ page }) => {
    await login(page, FIXTURES.supervisor.email);
    await page.goto("/people");
    await page.getByRole("link", { name: "Maria E2E Ativa" }).click();
    await expect(page.getByText("Observação fictícia")).not.toBeVisible();
    await expect(page.getByLabel("Observações")).not.toBeVisible();
  });

  test("PASTOR sees observations on the detail page", async ({ page }) => {
    await login(page, FIXTURES.pastor.email);
    await page.goto("/people");
    await page.getByRole("link", { name: "Maria E2E Ativa" }).click();
    await expect(page.getByLabel("Observações")).toHaveValue(
      "Observação fictícia visível para ADMIN e PASTOR."
    );
  });
});
