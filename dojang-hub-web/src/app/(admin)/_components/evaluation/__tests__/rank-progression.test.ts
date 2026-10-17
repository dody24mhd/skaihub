import { describe, expect, it } from "vitest";
import { SportRank } from "../../../_lib/admin-api";
import { ageOn, defaultNextRank, higherRanks, skippedSteps } from "../rank-progression";

function rank(id: number, code: string, sequence: number, level_type: SportRank["level_type"] = "geup"): SportRank {
  return { id, code, label: code, sequence, sport_type: "taekwondo", level_type };
}

const ranks: SportRank[] = [
  rank(1, "geup-10", 10),
  rank(2, "geup-9", 20),
  rank(3, "strip", 25),
  rank(4, "geup-8", 30),
  rank(5, "geup-1", 100),
  rank(6, "poom-1", 110, "poom"),
  rank(7, "dan-1", 110, "dan"),
];

describe("rank-progression", () => {
  it("hanya menawarkan sabuk yang lebih tinggi", () => {
    expect(higherRanks(ranks, ranks[3]).map((item) => item.code)).toEqual(["geup-1", "poom-1", "dan-1"]);
    expect(higherRanks(ranks, null)).toHaveLength(7);
  });

  it("default sabuk tujuan adalah satu tingkat di atas", () => {
    expect(defaultNextRank(ranks, ranks[0], 12)?.code).toBe("geup-9");
    expect(defaultNextRank(ranks, ranks[1], 12)?.code).toBe("strip");
    expect(defaultNextRank(ranks, null, 12)?.code).toBe("geup-10");
    expect(defaultNextRank(ranks, ranks[6], 20)).toBeNull();
  });

  it("memilih Poom untuk usia di bawah 15 dan Dan untuk 15 ke atas", () => {
    expect(defaultNextRank(ranks, ranks[4], 14)?.code).toBe("poom-1");
    expect(defaultNextRank(ranks, ranks[4], 15)?.code).toBe("dan-1");
    expect(defaultNextRank(ranks, ranks[4], null)?.code).toBe("dan-1");
  });

  it("menghitung tingkat yang dilompati (sequence berbeda)", () => {
    expect(skippedSteps(ranks, ranks[0], ranks[1])).toBe(0);
    expect(skippedSteps(ranks, ranks[0], ranks[3])).toBe(2);
    expect(skippedSteps(ranks, ranks[3], ranks[6])).toBe(1);
    expect(skippedSteps(ranks, null, ranks[3])).toBe(0);
  });

  it("menghitung usia dari tanggal lahir", () => {
    expect(ageOn("2012-10-18", new Date("2026-10-17"))).toBe(13);
    expect(ageOn("2012-10-17", new Date("2026-10-17"))).toBe(14);
    expect(ageOn("", new Date("2026-10-17"))).toBeNull();
  });
});
