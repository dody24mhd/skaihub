import { expect, test } from "@playwright/test";
import { api, expectNoHorizontalScroll, isMobile, loginAs, projectTag, shot } from "./helpers";

type Rank = { id: number; code: string; label: string };

test("ketua: UKT -> peserta lulus -> sabuk & riwayat siswa berubah -> sertifikat terbuka", async ({ page, request }, testInfo) => {
  const tag = `${projectTag(testInfo)}${Date.now().toString().slice(-6)}`;
  const studentName = `Siswa UKT ${tag}`;
  const eventName = `UKT Uji ${tag}`;
  const prefix = isMobile(testInfo) ? "modal" : "aside"; // HP memakai modal, desktop (xl) memakai panel samping

  // Arrange: siswa Geup 10 lewat API.
  const ranks = await api<{ data: Rank[] }>(request, "ketua", "GET", "/akademi/sport-ranks");
  const geup10 = ranks.body.data.find((rank) => rank.code === "tkd-geup-10")!;
  const geup9 = ranks.body.data.find((rank) => rank.code === "tkd-geup-9")!;
  const classes = await api<{ data: Array<{ id: number; name: string }> }>(request, "ketua", "GET", "/akademi/classes");
  const created = await api<{ student: { id: number } }>(request, "ketua", "POST", "/akademi/students", {
    name: studentName,
    gender: "female",
    birth_date: "2013-04-04",
    joined_date: "2026-01-05",
    status: "active",
    primary_class_id: classes.body.data[0].id,
    current_rank_id: geup10.id,
    guardian_name: "Wali UKT",
    guardian_phone: "081200007777",
  });
  expect(created.status).toBe(201);
  const studentId = created.body.student.id;

  await loginAs(page, request, "ketua");
  await page.goto("/academy/rank-promotions");
  await page.waitForLoadState("networkidle");

  // Buat event.
  if (isMobile(testInfo)) await page.getByRole("button", { name: "+ Event Baru" }).click();
  await page.locator(`#${prefix}-event-name`).fill(eventName);
  await page.locator(`#${prefix}-event-date`).fill("2026-12-20");
  await page.getByRole("button", { name: "Buat Event" }).locator("visible=true").click();
  await expect(page.getByLabel("Pilih event kenaikan tingkat")).toContainText(eventName);
  await page.getByLabel("Pilih event kenaikan tingkat").selectOption({ label: eventName });

  // Tambah peserta (terdaftar), lalu luluskan lewat aksi baris.
  if (isMobile(testInfo)) await page.getByRole("button", { name: "+ Tambah Peserta" }).click();
  await page.locator(`#${prefix === "modal" ? "modal-query" : "aside-search-student"}`).fill(studentName);
  await page.locator(`#${prefix}-student-select`).selectOption({ label: `${studentName} - ${geup10.label}` });
  await page.locator(`#${prefix}-rank-select`).selectOption({ label: geup9.label });
  await page.getByRole("button", { name: "Tambah Peserta", exact: true }).locator("visible=true").click();

  const participant = page.locator('tr, [data-testid="responsive-list-card"]', { hasText: studentName }).locator("visible=true").first();
  await expect(participant).toBeVisible();
  await participant.getByRole("button", { name: "Lulus", exact: true }).click();
  await expect(participant).toContainText("Lulus");
  await expect(participant.getByRole("link", { name: `Sertifikat ${studentName}` })).toBeVisible();
  await shot(page, testInfo, "ukt-passed");

  // Backend: sabuk berubah & riwayat tercatat.
  const student = await api<{ student: { current_rank: { code: string } } }>(request, "ketua", "GET", `/akademi/students/${studentId}`);
  expect(student.body.student.current_rank.code).toBe("tkd-geup-9");
  const histories = await api<{ data: Array<{ source_type: string; sport_rank: { code: string } }> }>(
    request,
    "ketua",
    "GET",
    `/akademi/students/${studentId}/rank-histories`,
  );
  expect(histories.body.data.some((item) => item.sport_rank.code === "tkd-geup-9" && item.source_type === "promotion_event")).toBe(true);

  // UI detail siswa: sabuk & riwayat.
  await page.goto(`/academy/students/${studentId}`);
  await expect(page.getByRole("heading", { name: "Riwayat Sabuk" })).toBeVisible();
  await expect(page.getByText(`Kenaikan tingkat: ${eventName}`)).toBeVisible();
  await expect(page.getByText(geup9.label).locator("visible=true").first()).toBeVisible();
  await expectNoHorizontalScroll(page);
  await shot(page, testInfo, "student-rank-history");

  // Sertifikat dari daftar peserta.
  await page.goBack();
  await page.getByLabel("Pilih event kenaikan tingkat").selectOption({ label: eventName });
  await page.getByRole("link", { name: `Sertifikat ${studentName}` }).locator("visible=true").click();
  await expect(page).toHaveURL(/\/certificates\/\d+$/);
  await expect(page.getByRole("article", { name: `Sertifikat UKT ${studentName}` })).toBeVisible();
  await shot(page, testInfo, "ukt-certificate");
});
