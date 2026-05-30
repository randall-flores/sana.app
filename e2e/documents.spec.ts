import { test, expect, type Page } from "@playwright/test";

// Responsive check for the Documents upload UI. Mirrors body-map.spec.ts:
// sign in as a seeded throwaway user, drive the real dev server at
// 375 / 768 / 1280 in EN + ES, assert no horizontal overflow and that the
// upload affordances render. The seeded user must have a cases row (the
// upload UI only renders when a case is resolved).
const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

test.beforeEach(async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 }),
    page.click("button[type=submit]"),
  ]);
});

async function expectNoHorizontalOverflow(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw, `horizontal overflow: scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw + 1);
}

test("375 mobile — EN: upload affordances, empty state, no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/en/documents");

  await expect(page.getByRole("heading", { name: "Your documents" })).toBeVisible();
  // Add-document button (the sole interactive upload control)
  await expect(page.getByRole("button", { name: "Add document" })).toBeVisible();
  // Calm empty state (seeded user has a case but no documents yet)
  await expect(
    page.getByText("No documents yet.", { exact: false }),
  ).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "e2e/shot-docs-375-en.png", fullPage: true });
});

test("375 mobile — ES: spanish labels, empty state, no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/es/documents");

  await expect(page.getByRole("heading", { name: "Tus documentos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar documento" })).toBeVisible();
  await expect(page.getByText("Aún no hay documentos.", { exact: false })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "e2e/shot-docs-375-es.png", fullPage: true });
});

for (const width of [768, 1280]) {
  test(`${width} — EN: upload visible, drop hint, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/documents");

    await expect(page.getByRole("button", { name: "Add document" })).toBeVisible();
    // Desktop-only drag-drop hint (hidden sm:block)
    await expect(page.getByText("Drag photos or PDFs here", { exact: false })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
}
