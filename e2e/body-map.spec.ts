import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

test.beforeEach(async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 }),
    page.click('button[type=submit]'),
  ]);
});

async function expectNoHorizontalOverflow(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw, `horizontal overflow: scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw + 1);
}

test("375 mobile — EN: tap, chip, list toggle, no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/en/journal");

  // Map renders
  const map = page.getByRole("group", { name: "Body map" });
  await expect(map).toBeVisible();
  await expect(page.getByText("Tap where it hurts. You can select more than one.")).toBeVisible();

  // Tap a region (left knee)
  const knee = page.locator('[data-location="knee_left"]');
  await knee.click();
  await expect(knee).toHaveAttribute("aria-pressed", "true");

  // Selected chip renders (aria-label "<label> — remove")
  await expect(page.getByRole("button", { name: "Left knee — remove" })).toBeVisible();

  // List view toggle swaps to the list, region selectable there
  await page.getByRole("button", { name: "List view" }).click();
  const listKnee = page.getByRole("button", { name: "Left knee", exact: true });
  await expect(listKnee).toBeVisible();
  await expect(listKnee).toHaveAttribute("aria-pressed", "true");

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "e2e/shot-375-en.png", fullPage: true });
});

test("375 mobile — ES: spanish labels, tap, chip, list toggle", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/es/journal");

  await expect(
    page.getByText("Toca donde te duele. Puedes elegir más de una."),
  ).toBeVisible();

  // Tap left shoulder -> Spanish chip
  const shoulder = page.locator('[data-location="shoulder_left"]');
  await shoulder.click();
  await expect(shoulder).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Hombro izquierdo — remove" })).toBeVisible();

  // List toggle in Spanish
  await page.getByRole("button", { name: "Vista de lista" }).click();
  await expect(page.getByRole("button", { name: "Hombro izquierdo", exact: true })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "e2e/shot-375-es.png", fullPage: true });
});

for (const width of [768, 1280]) {
  test(`${width} — EN: map visible, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/journal");
    await expect(page.getByRole("group", { name: "Body map" })).toBeVisible();
    await page.locator('[data-location="foot_right"]').click();
    await expect(page.getByRole("button", { name: "Right foot — remove" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
