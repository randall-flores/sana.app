import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

// Quality legend text per locale (journal.qualityLabel).
const QUALITY_LEGEND = {
  en: "What does the pain feel like?",
  es: "¿Cómo se siente el dolor?",
} as const;
const MORE_TOGGLE = /Add more detail|Agregar más detalle/i;

test.beforeEach(async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 }),
    page.click('button[type=submit]'),
  ]);
});

async function qualityChips(page: Page, locale: "en" | "es") {
  await page.goto(`/${locale}/journal`);
  await page.getByRole("button", { name: MORE_TOGGLE }).click();
  const fieldset = page.locator("fieldset").filter({ hasText: QUALITY_LEGEND[locale] });
  await expect(fieldset).toBeVisible();
  return fieldset.getByRole("button");
}

// Each chip must contain its text (no internal overflow) and the page must not
// scroll horizontally.
async function assertNoOverflow(page: Page, chips: ReturnType<Page["getByRole"]>) {
  const n = await chips.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const chip = chips.nth(i);
    const { scrollW, clientW, text } = await chip.evaluate((el) => ({
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
      text: el.textContent ?? "",
    }));
    expect(scrollW, `chip "${text.trim()}" overflows: scrollWidth ${scrollW} > clientWidth ${clientW}`).toBeLessThanOrEqual(clientW + 1);
  }
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw, `page overflow: ${sw} > ${cw}`).toBeLessThanOrEqual(cw + 1);
}

for (const locale of ["en", "es"] as const) {
  for (const width of [375, 768, 1280]) {
    test(`quality chips fit — ${locale} @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const chips = await qualityChips(page, locale);
      await assertNoOverflow(page, chips);
      if (locale === "es" && width === 375) {
        await page.screenshot({ path: "e2e/shot-quality-es-375.png", fullPage: true });
      }
    });
  }
}
