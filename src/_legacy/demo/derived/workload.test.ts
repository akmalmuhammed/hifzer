import { describe, expect, it } from "vitest";
import { memberWorkload } from "@/demo/derived/workload";

describe("derived/workload", () => {
  it("returns deterministic 100% split", () => {
    const a = memberWorkload("mem_am_team_northstar");
    const b = memberWorkload("mem_am_team_northstar");
    expect(a).toEqual(b);
    expect(a.total).toBe(100);
    expect(a.build + a.ship + a.support).toBe(100);
  });
});

