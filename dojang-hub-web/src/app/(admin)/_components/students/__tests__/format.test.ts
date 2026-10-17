import { describe, expect, it } from "vitest";
import { physicalSummary } from "../format";

describe("physicalSummary", () => {
  it("menampilkan tinggi dan berat tanpa nol desimal", () => {
    expect(physicalSummary({ height_cm: 150, weight_kg: "42.50" })).toBe("150 cm / 42.5 kg");
  });

  it("menampilkan tanda strip bila data fisik kosong", () => {
    expect(physicalSummary({ height_cm: null, weight_kg: null })).toBe("- / -");
    expect(physicalSummary({ height_cm: 140, weight_kg: null })).toBe("140 cm / -");
  });
});
