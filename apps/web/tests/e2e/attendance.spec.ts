import { expect, test } from "@playwright/test";
import { FIXTURES, login } from "./support";

test.describe("attendance management", () => {
  test("marks, persists, edits and registers a visitor on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, FIXTURES.leader.email);
    await page.goto("/cells");
    await page.getByRole("link", { name: /Célula E2E Esperança/ }).click();
    await Promise.all([
      page.waitForURL(/\/cells\/[^/]+\/meetings$/, { timeout: 15_000 }),
      page.getByRole("link", { name: "Ver encontros" }).click()
    ]);
    await expect(page.getByRole("heading", { name: "Encontros" })).toBeVisible();
    await page.getByRole("link", { name: "Ver detalhes" }).first().click();
    await Promise.all([
      page.waitForURL(/\/attendance$/, { timeout: 15_000 }),
      page.getByRole("link", { name: "Abrir frequência" }).click()
    ]);
    await expect(page.getByRole("heading", { name: "Frequência" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const present = page.getByRole("radio", { name: "Presente" });
    const absent = page.getByRole("radio", { name: "Ausente" });
    for (const radio of [present, absent, page.getByRole("radio", { name: "Justificado" }), page.getByRole("radio", { name: "Limpar" })]) {
      expect((await radio.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    await present.focus();
    await page.keyboard.press("ArrowRight");
    await expect(absent).toBeFocused();
    await expect(absent).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(present).toBeFocused();
    await expect(present).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Alterações não salvas")).toBeVisible();
    await page.getByRole("button", { name: "Salvar frequência" }).click();
    await expect(page.getByText("Frequência salva.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("radio", { name: "Presente" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("radio", { name: "Ausente" }).click();
    await page.getByRole("button", { name: "Salvar frequência" }).click();
    await expect(page.getByRole("radio", { name: "Ausente" })).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: "Adicionar visitante" }).click();
    await expect(page.getByLabel("Origem")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Adicionar visitante" })).toBeFocused();
    await page.getByRole("button", { name: "Adicionar visitante" }).click();
    await page.getByLabel("Nome").fill("Visitante Playwright");
    await page.getByRole("dialog").getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(/Visitante Playwright/)).toBeVisible();
    await expect(page.getByText(/1 visitantes/)).toBeVisible();
  });
});
