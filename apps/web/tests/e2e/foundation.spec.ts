import { expect, test } from "@playwright/test";

test("loads the technical foundation page without console errors", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    const isExpectedAnonymousRefresh =
      message.text() ===
      "Failed to load resource: the server responded with a status of 401 (Unauthorized)";
    if (message.type() === "error" && !isExpectedAnonymousRefresh) {
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
