import { expect, test } from "@playwright/test";

test.describe("bootstrap entrypoint", () => {
  test("redirects an anonymous visitor to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Ecossistema de Células" })
    ).toBeVisible();
  });
});
