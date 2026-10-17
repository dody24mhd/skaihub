import { expect as playwrightExpect, test as playwrightTest, type Page } from "@playwright/test";
import { MOCK_ME_RESPONSE, setupMockApi } from "./fixtures/mock-api";
import { setAdminSession } from "./fixtures/session";
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

const isVitest = typeof process !== "undefined" && Boolean(process.env.VITEST);

if (isVitest) {
  describe("E2E Subscription Banner Specs", () => {
    it("dijalankan via Playwright test runner (npm run test:e2e)", () => {
      // placeholder agar Vitest tidak gagal "No test suite found"
    });
  });
} else {
  async function mockSubscriptionState(page: Page, state: string, daysLeft: number) {
    await page.route("**/api/akademi/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...MOCK_ME_RESPONSE,
          subscription_state: state,
          days_left: daysLeft,
          subscription_ends_at: "2026-10-31T23:59:59+07:00",
          effective_student_limit: 200,
          active_students: 3,
        }),
      }),
    );
  }

  playwrightTest.describe("Banner langganan (L4-D)", () => {
    playwrightTest("mode baca-saja di HP: banner merah, tulis dinonaktifkan, export tetap ada", async ({ page }, testInfo) => {
      if (testInfo.project.name !== "mobile") return;

      await setAdminSession(page);
      await setupMockApi(page);
      await mockSubscriptionState(page, "read_only", 0);

      await page.goto("/academy/students");

      const banner = page.getByTestId("subscription-banner");
      await playwrightExpect(banner).toBeVisible();
      await playwrightExpect(banner).toHaveAttribute("data-state", "read_only");
      await playwrightExpect(banner).toContainText("tetap bisa dilihat dan diekspor");

      await playwrightExpect(page.getByRole("button", { name: "Export" })).toBeVisible();
      await playwrightExpect(page.getByRole("link", { name: /Tambah Siswa/ })).toHaveCount(0);

      const header = await page.locator("header").first().boundingBox();
      const bannerBox = await banner.boundingBox();
      const bottomNavBox = await page.locator('nav[aria-label="Navigasi Bawah"]').boundingBox();
      playwrightExpect(header && bannerBox && bannerBox.y >= header.y + header.height - 1).toBe(true);
      playwrightExpect(bannerBox && bottomNavBox && bannerBox.y + bannerBox.height <= bottomNavBox.y).toBe(true);

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      playwrightExpect(hasHorizontalScroll).toBe(false);
    });

    playwrightTest("akan habis di HP: banner kuning dengan sisa hari", async ({ page }, testInfo) => {
      if (testInfo.project.name !== "mobile") return;

      await setAdminSession(page);
      await setupMockApi(page);
      await mockSubscriptionState(page, "expiring", 9);

      await page.goto("/academy");

      const banner = page.getByTestId("subscription-banner");
      await playwrightExpect(banner).toBeVisible();
      await playwrightExpect(banner).toHaveAttribute("data-state", "expiring");
      await playwrightExpect(banner).toContainText("berakhir dalam 9 hari");
    });

    playwrightTest("langganan aktif: banner tidak tampil", async ({ page }, testInfo) => {
      if (testInfo.project.name !== "mobile") return;

      await setAdminSession(page);
      await setupMockApi(page);
      await mockSubscriptionState(page, "active", 60);

      await page.goto("/academy/students");

      await playwrightExpect(page.getByRole("link", { name: /Tambah Siswa/ })).toBeVisible();
      await playwrightExpect(page.getByTestId("subscription-banner")).toHaveCount(0);
    });
  });
}
