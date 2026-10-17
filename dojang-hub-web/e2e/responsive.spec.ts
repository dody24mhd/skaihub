import { expect as playwrightExpect, test as playwrightTest } from "@playwright/test";
import fs from "fs";
import path from "path";
import { setupMockApi } from "./fixtures/mock-api";
import { setAdminSession } from "./fixtures/session";
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

const isVitest = typeof process !== "undefined" && Boolean(process.env.VITEST);

if (isVitest) {
  // Bila dieksekusi oleh runner Vitest (npm test), sediakan suite agar tidak gagal "No test suite found".
  // Test browser E2E dijalankan melalui Playwright via `npm run test:e2e`.
  describe("E2E Responsive Specs", () => {
    it("dijalankan via Playwright test runner (npm run test:e2e)", () => {
      // test placeholder yang sukses di Vitest
    });
  });
} else {
  const ACADEMY_ROUTES = [
    "/academy",
    "/academy/attendance",
    "/academy/attendance/new",
    "/academy/schedules",
    "/academy/classes",
    "/academy/coaches",
    "/academy/users",
    "/academy/places",
    "/academy/public-profile",
    "/academy/evaluations",
    "/academy/evaluation-settings",
    "/academy/rank-promotions",
    "/academy/ranks",
    "/academy/finance",
  ];

  playwrightTest.describe("Responsive Layout & Shell", () => {
    for (const route of ACADEMY_ROUTES) {
      playwrightTest(
        `memverifikasi responsive layout pada ${route}`,
        async ({ page }, testInfo) => {
          const projectName = testInfo.project.name; // 'mobile' | 'tablet' | 'desktop'

          // Siapkan sesi admin dan mock API
          await setAdminSession(page);
          await setupMockApi(page);

          // Navigasi ke rute
          await page.goto(route);
          await page.waitForLoadState("domcontentloaded");

          // 1. Verifikasi tidak ada scroll horizontal
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          playwrightExpect(
            hasHorizontalScroll,
            `Halaman ${route} tidak boleh memiliki scroll horizontal pada ${projectName}`
          ).toBe(false);

          // 2. Bottom nav terlihat HANYA di mobile
          const bottomNav = page.locator('nav[aria-label="Navigasi Bawah"]');
          if (projectName === "mobile") {
            await playwrightExpect(bottomNav).toBeVisible();
          } else {
            await playwrightExpect(bottomNav).toBeHidden();
          }

          // 3. Sidebar terlihat HANYA di desktop
          const sidebar = page.locator("main > aside");
          if (projectName === "desktop") {
            await playwrightExpect(sidebar).toBeVisible();
          } else {
            await playwrightExpect(sidebar).toBeHidden();
          }

          // 4. Simpan screenshot ke e2e/__screenshots__/
          const screenshotsDir = path.join(
            process.cwd(),
            "e2e",
            "__screenshots__"
          );
          if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
          }

          const safeName =
            route.replace(/\//g, "-").replace(/^-/, "") || "root";
          await page.screenshot({
            path: path.join(screenshotsDir, `${safeName}-${projectName}.png`),
            fullPage: true,
          });
        }
      );
    }
  });

  playwrightTest.describe("Alur Pengisian Absensi Latihan (L3-B)", () => {
    playwrightTest(
      "alur isi absensi lengkap pada mobile dengan status sick",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "mobile") return;

        interface CapturedAttendancePayload {
          status?: string;
          material?: string;
          attendances?: Array<{ id: number; status: string }>;
        }
        let capturedPayload: CapturedAttendancePayload | null = null;

        await setAdminSession(page);
        await setupMockApi(page);

        // Intercept request PATCH attendance untuk memeriksa payload
        await page.route("**/api/akademi/training-sessions/1/attendance", async (route) => {
          if (route.request().method() === "PATCH") {
            capturedPayload = route.request().postDataJSON() as CapturedAttendancePayload;
          }
          await route.fallback();
        });

        // Navigasi ke form absensi sesi 1
        await page.goto("/academy/attendance/new?session=1");
        await page.waitForLoadState("domcontentloaded");

        // 1. Verifikasi kartu siswa terlihat
        const studentCard = page.locator('[data-testid="attendance-card-1"]');
        await playwrightExpect(studentCard).toBeVisible();

        // 2. Klik tombol Sakit untuk siswa pertama
        const sickBtn = studentCard.getByRole("button", { name: /^sakit/i });
        await playwrightExpect(sickBtn).toBeVisible();
        await sickBtn.click();
        await playwrightExpect(sickBtn).toHaveAttribute("aria-pressed", "true");

        // 3. Simpan Draft
        const saveDraftBtn = page.getByRole("button", { name: /simpan draft/i });
        await saveDraftBtn.click();

        // 4. Verifikasi notifikasi berhasil
        const successMsg = page.getByText(/absensi disimpan/i);
        await playwrightExpect(successMsg).toBeVisible();

        // 5. Validasi payload yang dikirim ke backend berisi status 'sick'
        const payload = capturedPayload as CapturedAttendancePayload | null;
        playwrightExpect(payload).not.toBeNull();
        const studentAtt = payload?.attendances?.find((a) => a.id === 1);
        playwrightExpect(studentAtt).toBeDefined();
        playwrightExpect(studentAtt?.status).toBe("sick");
      }
    );
  });
  // L4-A
  playwrightTest.describe("Kelas Hari Ini (L4-A)", () => {
    playwrightTest(
      "buka Kelas Hari Ini, tap slot, tandai Sakit, lalu simpan pada mobile",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "mobile") return;

        let fromSchedulePayload: { training_schedule_id?: number; date?: string } | null = null;
        let attendancePayload: { attendances?: Array<{ id: number; status: string }> } | null = null;

        await setAdminSession(page);
        await setupMockApi(page);
        await page.route("**/api/akademi/training-sessions/from-schedule", async (route) => {
          fromSchedulePayload = route.request().postDataJSON() as { training_schedule_id?: number; date?: string };
          await route.fallback();
        });
        await page.route("**/api/akademi/training-sessions/1/attendance", async (route) => {
          if (route.request().method() === "PATCH") {
            attendancePayload = route.request().postDataJSON() as { attendances?: Array<{ id: number; status: string }> };
          }
          await route.fallback();
        });

        await page.goto("/academy/attendance");
        await playwrightExpect(page.getByRole("tab", { name: "Kelas Hari Ini" })).toHaveAttribute("aria-selected", "true");

        const slotCard = page.locator('[data-testid="today-slot-schedule-1-today"]');
        await playwrightExpect(slotCard).toContainText("Belum dibuka");
        await slotCard.getByRole("button", { name: "Buka Absensi" }).click();

        await page.waitForURL(/\/academy\/attendance\/new\?session=1/);
        playwrightExpect(fromSchedulePayload).toEqual({ training_schedule_id: 1, date: "2026-10-19" });

        const studentCard = page.locator('[data-testid="attendance-card-1"]');
        const sickBtn = studentCard.getByRole("button", { name: /^sakit/i });
        await sickBtn.click();
        await playwrightExpect(sickBtn).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: /simpan draft/i }).click();

        await playwrightExpect(page.getByText(/absensi disimpan/i)).toBeVisible();
        const saved = attendancePayload as { attendances?: Array<{ id: number; status: string }> } | null;
        playwrightExpect(saved?.attendances?.find((item) => item.id === 1)?.status).toBe("sick");
      }
    );
  });
  // end L4-A
}

