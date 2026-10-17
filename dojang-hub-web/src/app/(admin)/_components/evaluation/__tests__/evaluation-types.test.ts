import { describe, expect, it } from "vitest";
import {
  getScoreLabel,
  getScoreLabelStyle,
  shortDate,
  statusLabels,
} from "../evaluation-types";

describe("evaluation-types helpers", () => {
  describe("getScoreLabel", () => {
    it("mengembalikan '-' untuk nilai kosong atau invalid", () => {
      expect(getScoreLabel(null)).toBe("-");
      expect(getScoreLabel(undefined)).toBe("-");
      expect(getScoreLabel(0)).toBe("-");
      expect(getScoreLabel(NaN)).toBe("-");
    });

    it("mengembalikan 'Kurang' untuk nilai 1 - 59", () => {
      expect(getScoreLabel(1)).toBe("Kurang");
      expect(getScoreLabel(59)).toBe("Kurang");
    });

    it("mengembalikan 'Cukup' untuk nilai 60 - 69", () => {
      expect(getScoreLabel(60)).toBe("Cukup");
      expect(getScoreLabel(69)).toBe("Cukup");
    });

    it("mengembalikan 'Baik' untuk nilai 70 - 84", () => {
      expect(getScoreLabel(70)).toBe("Baik");
      expect(getScoreLabel(84)).toBe("Baik");
    });

    it("mengembalikan 'Sangat Baik' untuk nilai >= 85", () => {
      expect(getScoreLabel(85)).toBe("Sangat Baik");
      expect(getScoreLabel(95)).toBe("Sangat Baik");
      expect(getScoreLabel(100)).toBe("Sangat Baik");
    });
  });

  describe("getScoreLabelStyle", () => {
    it("memberikan kelas warna yang tepat sesuai predikat", () => {
      expect(getScoreLabelStyle(90)).toContain("text-success");
      expect(getScoreLabelStyle(75)).toContain("text-primary");
      expect(getScoreLabelStyle(65)).toContain("text-secondary");
      expect(getScoreLabelStyle(50)).toContain("text-secondary-dark");
      expect(getScoreLabelStyle(null)).toContain("text-muted");
    });
  });

  describe("shortDate", () => {
    it("memformat tanggal ke format lokal Indonesia", () => {
      const result = shortDate("2026-10-17");
      expect(result).toMatch(/17/);
      expect(result).toMatch(/2026/);
    });
  });

  describe("statusLabels", () => {
    it("memiliki mapping label status periode", () => {
      expect(statusLabels.draft).toBe("Draft");
      expect(statusLabels.active).toBe("Aktif");
      expect(statusLabels.closed).toBe("Arsip");
    });
  });
});
