import { describe, expect, it } from "vitest";
import { DEMO } from "@/demo/data";
import { keyResultProgress, okrConfidence, okrProgress, sparklineDelta } from "./progress";

describe("derived/progress", () => {
  it("computes progress for 'lower is better' KRs", () => {
    const okr = DEMO.okrs.find((o) => o.id === "okr_ns_1");
    expect(okr).toBeTruthy();
    const kr = okr!.keyResults.find((k) => k.id === "kr_ns_1_2");
    expect(kr).toBeTruthy();
    expect(keyResultProgress(kr!)).toBeCloseTo(2 / 3, 5);
  });

  it("computes OKR progress as an average of KRs", () => {
    const okr = DEMO.okrs.find((o) => o.id === "okr_or_1")!;
    const p = okrProgress(okr);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it("blends confidence with latest check-in", () => {
    const okr = DEMO.okrs.find((o) => o.id === "okr_ns_1")!;
    const c = okrConfidence(okr);
    expect(c).toBeGreaterThan(0.4);
    expect(c).toBeLessThan(0.9);
  });

  it("computes sparkline delta", () => {
    expect(sparklineDelta([1, 2, 2, 3])).toBe(2);
    expect(sparklineDelta([3, 2, 1])).toBe(-2);
  });
});

