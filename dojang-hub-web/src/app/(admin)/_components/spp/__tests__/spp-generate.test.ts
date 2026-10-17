import { describe, expect, it } from "vitest";
import { TrainingClass } from "../../../_lib/admin-api";
import { generatePayloadFromForm, needsDefaultAmount, summarizeGenerateResult } from "../spp-generate";

function trainingClass(id: number, override: string | null): TrainingClass {
  return {
    id,
    akademi_id: 1,
    training_place_id: null,
    name: `Kelas ${id}`,
    spp_amount_override: override,
    target_sessions_per_month: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

describe("spp-generate", () => {
  it("mewajibkan nominal default bila ada kelas tanpa nominal SPP", () => {
    const classes = [trainingClass(1, "150000.00"), trainingClass(2, null)];

    expect(needsDefaultAmount(classes, "")).toBe(true);
    expect(needsDefaultAmount(classes, "1")).toBe(false);
    expect(needsDefaultAmount(classes, "2")).toBe(true);
    expect(needsDefaultAmount([trainingClass(1, "150000.00")], "")).toBe(false);
  });

  it("tidak mewajibkan nominal bila akademi punya nominal default", () => {
    const classes = [trainingClass(1, "150000.00"), trainingClass(2, null)];

    expect(needsDefaultAmount(classes, "", "120000.00")).toBe(false);
    expect(needsDefaultAmount(classes, "2", null)).toBe(true);
  });

  it("membentuk payload generate dengan field opsional null", () => {
    expect(
      generatePayloadFromForm({ billing_year: "2026", billing_month: "10", default_amount: "", due_date: "", class_id: "" }),
    ).toEqual({ billing_year: 2026, billing_month: 10, default_amount: null, due_date: null, class_id: null });

    expect(
      generatePayloadFromForm({ billing_year: "2026", billing_month: "11", default_amount: "125000", due_date: "2026-11-10", class_id: "2" }),
    ).toEqual({ billing_year: 2026, billing_month: 11, default_amount: 125000, due_date: "2026-11-10", class_id: 2 });
  });

  it("memisahkan tagihan yang dilewati karena sudah ada dan karena nominal kosong", () => {
    expect(summarizeGenerateResult({ message: "", created: 5, skipped: 4, missing_amount: 1 })).toEqual({
      created: 5,
      alreadyExists: 3,
      missingAmount: 1,
    });
    expect(summarizeGenerateResult({ message: "", created: 2, skipped: 0 })).toEqual({
      created: 2,
      alreadyExists: 0,
      missingAmount: 0,
    });
  });
});
