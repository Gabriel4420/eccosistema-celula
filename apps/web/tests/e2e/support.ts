import { expect, type Page } from "@playwright/test";

export const E2E_PASSWORD = "e2e-password-1234";

export const FIXTURES = {
  admin: { email: "admin@e2e.test", firstName: "Alice", lastName: "Admin" },
  pastor: { email: "pastor@e2e.test", firstName: "Paulo", lastName: "Pastor" },
  supervisor: { email: "supervisor@e2e.test", firstName: "Sofia", lastName: "Supervisora" },
  leader: { email: "leader@e2e.test", firstName: "Lucas", lastName: "Líder" }
} as const;

export function trackConsoleErrors(page: Page): { errors: string[]; assertClean: () => Promise<void> } {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const assertClean = async (): Promise<void> => {
    await expect
      .poll(() => errors, { timeout: 1_000 })
      .toEqual([]);
  };
  return { errors, assertClean };
}

export async function login(
  page: Page,
  email: string,
  password: string = E2E_PASSWORD
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
