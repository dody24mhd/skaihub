import { expect, test } from "@playwright/test";
import { api, expectNoHorizontalScroll, loginAs, shot } from "./helpers";

test("pelatih: rapor siswa terbuka dari detail siswa (pilih periode) dengan nilai seed", async ({ page, request }, testInfo) => {
  const students = await api<{ data: { data: Array<{ id: number; name: string }> } }>(request, "pelatih", "GET", "/akademi/students?search=Budi");
  const budi = students.body.data.data.find((item) => item.name === "Budi Santoso");
  expect(budi, "siswa seed Budi Santoso").toBeTruthy();

  await loginAs(page, request, "pelatih");
  await page.goto(`/academy/students/${budi!.id}`);
  await expect(page.getByRole("heading", { name: "Cetak Rapor Periode" })).toBeVisible();

  const period = page.locator("#student-report-period");
  await expect(period.locator("option", { hasText: "Semester 1 2026" })).toBeAttached();
  await period.selectOption({ index: 0 });
  await page.getByRole("link", { name: /Cetak Rapor/ }).locator("visible=true").first().click();

  await expect(page).toHaveURL(/\/report\?period_id=\d+/);
  const report = page.getByRole("article", { name: "Rapor Budi Santoso" });
  await expect(report).toBeVisible();
  await expect(report.getByRole("table", { name: "Nilai per aspek" })).toContainText("Teknik Dasar");
  await expect(page.getByRole("button", { name: /Cetak/ }).first()).toBeVisible();
  await expectNoHorizontalScroll(page);
  await shot(page, testInfo, "student-report");
});
