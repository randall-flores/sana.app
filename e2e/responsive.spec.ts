import { test, expect, type Page } from "@playwright/test";

// Cross-device responsive sweep. Signs in as a seeded throwaway user (needs a
// cases row — see the README), visits every dashboard screen at 375 / 768 /
// 1280, asserts no horizontal overflow, and specifically checks the appointment
// form's date + time inputs don't overlap on a narrow phone.
const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

const WIDTHS = [375, 768, 1280] as const;
const SCREENS = ["dashboard", "journal", "appointments", "documents", "profile"] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 }),
    page.click("button[type=submit]"),
  ]);
});

async function expectNoHorizontalOverflow(page: Page, where: string) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw, `${where}: horizontal overflow scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(
    cw + 1,
  );
}

for (const width of WIDTHS) {
  for (const screen of SCREENS) {
    test(`${width} — /${screen}: no horizontal overflow (EN)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/en/${screen}`);
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalOverflow(page, `${width}/${screen}`);
      await page.screenshot({ path: `e2e/shot-${screen}-${width}.png`, fullPage: true });
    });
  }
}

test("375 — appointment form: date and time inputs do not overlap", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/en/appointments");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Add appointment" }).click();

  const date = page.locator("#appt-date");
  const time = page.locator("#appt-time");
  await expect(date).toBeVisible();
  await expect(time).toBeVisible();

  const d = await date.boundingBox();
  const t = await time.boundingBox();
  expect(d, "date input has a box").not.toBeNull();
  expect(t, "time input has a box").not.toBeNull();

  // Date sits left of time with no horizontal overlap (2px tolerance).
  expect(d!.x + d!.width, `date.right ${d!.x + d!.width} <= time.left ${t!.x}`).toBeLessThanOrEqual(
    t!.x + 2,
  );
  // Both stay within the dialog (no clipping past the right edge).
  const dialog = await page.getByRole("dialog").boundingBox();
  expect(t!.x + t!.width).toBeLessThanOrEqual(dialog!.x + dialog!.width + 1);

  await page.screenshot({ path: "e2e/shot-appt-form-375.png" });
});

test("375 — ES sweep: no horizontal overflow on each screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  for (const screen of SCREENS) {
    await page.goto(`/es/${screen}`);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page, `375-ES/${screen}`);
  }
});
