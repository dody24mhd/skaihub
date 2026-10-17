import { describe, expect, it } from "vitest";
import {
  bottomNavItems,
  buildNavSections,
  filterNavSectionsByRole,
} from "../academy-nav";

describe("academy-nav", () => {
  describe("buildNavSections", () => {
    it("excludes public profile for starter plan or null plan", () => {
      const starterSections = buildNavSections("starter");
      const starterItems = starterSections.flatMap((s) => s.items);
      expect(starterItems.some((item) => item.href === "/academy/public-profile")).toBe(false);

      const nullSections = buildNavSections(null);
      const nullItems = nullSections.flatMap((s) => s.items);
      expect(nullItems.some((item) => item.href === "/academy/public-profile")).toBe(false);
    });

    it("includes public profile for pro and scale plans", () => {
      const proSections = buildNavSections("pro");
      const proItems = proSections.flatMap((s) => s.items);
      expect(proItems.some((item) => item.href === "/academy/public-profile")).toBe(true);

      const scaleSections = buildNavSections("scale");
      const scaleItems = scaleSections.flatMap((s) => s.items);
      expect(scaleItems.some((item) => item.href === "/academy/public-profile")).toBe(true);
    });

    it("offers Ganti Password to every academy role", () => {
      for (const role of ["ketua_akademi", "admin_akademi", "pelatih"] as const) {
        const items = filterNavSectionsByRole(buildNavSections("starter"), role).flatMap((s) => s.items);
        expect(items.some((item) => item.href === "/academy/account")).toBe(true);
      }
    });
  });

  describe("filterNavSectionsByRole", () => {
    it("filters out SPP, Keuangan, Master Data from pelatih", () => {
      const sections = buildNavSections("pro");
      const pelatihSections = filterNavSectionsByRole(sections, "pelatih");
      const pelatihItems = pelatihSections.flatMap((s) => s.items);

      expect(pelatihItems.some((item) => item.href === "/academy/spp")).toBe(false);
      expect(pelatihItems.some((item) => item.href === "/academy/finance")).toBe(false);
      expect(pelatihItems.some((item) => item.href === "/academy/users")).toBe(false);
      expect(pelatihItems.some((item) => item.href === "/academy/coaches")).toBe(false);
      expect(pelatihItems.some((item) => item.href === "/academy/places")).toBe(false);

      expect(pelatihItems.some((item) => item.href === "/academy")).toBe(true);
      expect(pelatihItems.some((item) => item.href === "/academy/students")).toBe(true);
      expect(pelatihItems.some((item) => item.href === "/academy/attendance")).toBe(true);
      expect(pelatihItems.some((item) => item.href === "/academy/evaluations")).toBe(true);
    });

    it("allows SPP for ketua_akademi and admin_akademi, finance only for ketua_akademi", () => {
      const sections = buildNavSections("pro");
      const adminSections = filterNavSectionsByRole(sections, "admin_akademi");
      const adminItems = adminSections.flatMap((s) => s.items);
      expect(adminItems.some((item) => item.href === "/academy/spp")).toBe(true);
      expect(adminItems.some((item) => item.href === "/academy/finance")).toBe(false);

      const ketuaSections = filterNavSectionsByRole(sections, "ketua_akademi");
      const ketuaItems = ketuaSections.flatMap((s) => s.items);
      expect(ketuaItems.some((item) => item.href === "/academy/spp")).toBe(true);
      expect(ketuaItems.some((item) => item.href === "/academy/finance")).toBe(true);
    });
  });

  describe("bottomNavItems", () => {
    it("returns Beranda, Siswa, Absensi, SPP, Lainnya for ketua_akademi and admin_akademi", () => {
      const itemsKetua = bottomNavItems("ketua_akademi");
      expect(itemsKetua).toHaveLength(5);
      expect(itemsKetua.map((i) => i.title)).toEqual([
        "Beranda",
        "Siswa",
        "Absensi",
        "SPP",
        "Lainnya",
      ]);
      expect(itemsKetua[0].href).toBe("/academy");
      expect(itemsKetua[1].href).toBe("/academy/students");
      expect(itemsKetua[2].href).toBe("/academy/attendance");
      expect(itemsKetua[3].href).toBe("/academy/spp");
      expect(itemsKetua[4].isMore).toBe(true);

      const itemsAdmin = bottomNavItems("admin_akademi");
      expect(itemsAdmin.map((i) => i.title)).toEqual([
        "Beranda",
        "Siswa",
        "Absensi",
        "SPP",
        "Lainnya",
      ]);
    });

    it("returns Beranda, Siswa, Absensi, Penilaian, Lainnya for pelatih", () => {
      const itemsPelatih = bottomNavItems("pelatih");
      expect(itemsPelatih).toHaveLength(5);
      expect(itemsPelatih.map((i) => i.title)).toEqual([
        "Beranda",
        "Siswa",
        "Absensi",
        "Penilaian",
        "Lainnya",
      ]);
      expect(itemsPelatih[0].href).toBe("/academy");
      expect(itemsPelatih[1].href).toBe("/academy/students");
      expect(itemsPelatih[2].href).toBe("/academy/attendance");
      expect(itemsPelatih[3].href).toBe("/academy/evaluations");
      expect(itemsPelatih[4].isMore).toBe(true);
    });
  });
});
