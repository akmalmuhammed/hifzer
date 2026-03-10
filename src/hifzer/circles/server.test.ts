import { describe, expect, it } from "vitest";
import { weekStartFromLocalDate } from "@/hifzer/circles/server";

describe("circles/server", () => {
  it("moves midweek dates back to Monday", () => {
    expect(weekStartFromLocalDate("2026-03-11")).toBe("2026-03-09");
  });

  it("moves Sunday dates back to the prior Monday", () => {
    expect(weekStartFromLocalDate("2026-03-15")).toBe("2026-03-09");
  });
});
