import { expect, test } from "@playwright/test";

test("loads the technical foundation page without console errors", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Ecossistema de Células" })
  ).toBeVisible();
  await expect(page).toHaveTitle("Ecossistema de Células");
  expect(errors).toEqual([]);
});
