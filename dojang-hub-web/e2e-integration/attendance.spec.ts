import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { api, apiLogin, ACCOUNTS, loginAs, shot } from "./helpers";

const OPENABLE = /^(Buka Absensi|Lanjutkan Absensi)$/;
const BACKFILL_DAYS = 7;

function localDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Cari tanggal (hari ini mundur maks 7 hari) yang punya slot yang bisa diisi, lalu klik. */
async function clickFirstOpenableSlot(page: Page): Promise<boolean> {
  const dateInput = page.locator("#today-classes-date");
  for (let back = 0; back <= BACKFILL_DAYS; back += 1) {
    await dateInput.fill(localDate(back));
    await expect(page.getByText("Memuat kelas...")).toHaveCount(0);
    const button = page.getByRole("button", { name: OPENABLE }).first();
    if (await button.isVisible()) {
      await button.click();
      return true;
    }
  }
  return false;
}

/**
 * Pakai slot jadwal seed bila masih ada. DB integrasi dipakai bersama project mobile & desktop
 * (dan rerun lokal), jadi bila semua slot seed sudah terpakai, admin membuat sesi tambahan hari ini
 * untuk Coach Dimas agar test tetap deterministik.
 */
async function openFirstOpenableSlot(page: Page, request: APIRequestContext) {
  if (await clickFirstOpenableSlot(page)) return;

  const classes = await api<{ data: Array<{ id: number }> }>(request, "admin", "GET", "/akademi/classes");
  const coach = (await apiLogin(request, ACCOUNTS.pelatih.email)).user;
  const created = await api(request, "admin", "POST", "/akademi/training-sessions", {
    class_id: classes.body.data[0].id,
    session_date: localDate(0),
    starts_at: "19:00",
    ends_at: "20:00",
    session_type: "extra",
    coach_ids: [coach.id],
    material: "Sesi tambahan E2E",
  });
  expect(created.status).toBe(201);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Kelas Hari Ini" })).toBeVisible();
  expect(await clickFirstOpenableSlot(page)).toBe(true);
}

test("pelatih: Kelas Hari Ini -> isi absensi (termasuk Sakit) -> selesaikan", async ({ page, request }, testInfo) => {
  await loginAs(page, request, "pelatih");
  await page.goto("/academy");
  // Dashboard menampilkan kartu ringkas; layar penuh ada di tab "Kelas Hari Ini" pada Absensi.
  await expect(page.getByRole("heading", { name: "Kelas Hari Ini" })).toBeVisible();
  await page.goto("/academy/attendance");
  await expect(page.getByRole("heading", { name: "Kelas Hari Ini" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Memuat kelas...")).toHaveCount(0);
  await shot(page, testInfo, "kelas-hari-ini");

  await openFirstOpenableSlot(page, request);
  await expect(page).toHaveURL(/\/academy\/attendance\/new\?session=\d+/);

  const sessionId = Number(new URL(page.url()).searchParams.get("session"));
  const sickButtons = page.getByRole("button", { name: /^Sakit - / });
  await expect(sickButtons.first()).toBeVisible();
  await sickButtons.first().click();
  await expect(sickButtons.first()).toHaveAttribute("aria-pressed", "true");
  const presentButtons = page.getByRole("button", { name: /^Hadir - / });
  if ((await presentButtons.count()) > 1) await presentButtons.nth(1).click();
  await shot(page, testInfo, "absensi-sakit");

  await page.getByRole("button", { name: "Selesaikan Absensi" }).click();
  await expect(page.getByText(/selesai/i).first()).toBeVisible();

  await expect
    .poll(async () => {
      const res = await api<{ training_session: { status: string } }>(request, "pelatih", "GET", `/akademi/training-sessions/${sessionId}`);
      return res.body.training_session?.status;
    })
    .toBe("completed");

  // Muat ulang: status Sakit harus tersimpan di backend.
  await page.reload();
  await expect(page.getByRole("button", { name: /^Sakit - / }).first()).toHaveAttribute("aria-pressed", "true");
  await shot(page, testInfo, "absensi-selesai");
});
