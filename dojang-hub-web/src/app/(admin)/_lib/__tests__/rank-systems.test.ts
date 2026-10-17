import { describe, expect, it } from "vitest";
import {
  builtinRankLabel,
  defaultRankSystemForSport,
  rankSystemLabel,
  rankSystemsForSport,
} from "../rank-systems";

describe("rank-systems", () => {
  it("memberi sistem bawaan sesuai cabang olahraga", () => {
    expect(defaultRankSystemForSport("taekwondo")).toBe("taekwondo_kukkiwon");
    expect(defaultRankSystemForSport("karate")).toBe("karate_forki");
    expect(defaultRankSystemForSport("judo")).toBeNull();
  });

  it("hanya menawarkan sistem yang cocok dengan cabang olahraga", () => {
    expect(rankSystemsForSport("karate").map((option) => option.value)).toEqual([
      "karate_forki",
      "karate_kki",
    ]);
    expect(rankSystemsForSport("judo")).toEqual([]);
  });

  it("memberi label yang terbaca", () => {
    expect(rankSystemLabel("karate_kki")).toBe("Karate KKI");
    expect(rankSystemLabel(null)).toBe("Tanpa sistem bawaan");
    expect(builtinRankLabel("taekwondo_kukkiwon")).toBe("Bawaan Kukkiwon");
    expect(builtinRankLabel(null)).toBe("Bawaan");
  });
});
