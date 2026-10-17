import { describe, expect, it } from "vitest";
import {
  durationMonths,
  effectiveStudentLimit,
  priceBreakdown,
  subscriptionSubtotal,
} from "../plan-pricing";

describe("plan-pricing", () => {
  it("includes one free block of 50 for every plan", () => {
    expect(effectiveStudentLimit("starter", 0)).toBe(100);
    expect(effectiveStudentLimit("pro", 0)).toBe(200);
    expect(effectiveStudentLimit("scale", 0)).toBe(350);
    expect(effectiveStudentLimit("starter", 2)).toBe(200);
  });

  it("uses the stored included limit when provided", () => {
    expect(effectiveStudentLimit("pro", 1, 150)).toBe(250);
  });

  it("prices paid blocks at 15% of the monthly price per block", () => {
    expect(subscriptionSubtotal("starter", 1, 0)).toBe(99000);
    expect(subscriptionSubtotal("starter", 1, 1)).toBe(113850);
    expect(subscriptionSubtotal("pro", 1, 2)).toBe(258700);
    expect(subscriptionSubtotal("scale", 6, 2)).toBe(2722200);
  });

  it("breaks the price down into base and surcharge", () => {
    expect(priceBreakdown("pro", 3, 1)).toEqual({
      monthlyPrice: 199000,
      months: 3,
      base: 597000,
      paidBlocks: 1,
      surchargePercent: 15,
      surcharge: 89550,
      total: 686550,
    });
  });

  it("maps durations to billable months", () => {
    expect(durationMonths("trial")).toBe(0);
    expect(durationMonths("monthly")).toBe(1);
    expect(durationMonths("quarterly")).toBe(3);
    expect(durationMonths("semester")).toBe(6);
    expect(durationMonths("yearly")).toBe(12);
    expect(durationMonths("custom", "2026-01-01", "2026-03-31")).toBe(3);
    expect(durationMonths("custom", "2026-01-01", "2026-01-10")).toBe(1);
    expect(durationMonths("custom", "", "")).toBe(1);
  });
});
