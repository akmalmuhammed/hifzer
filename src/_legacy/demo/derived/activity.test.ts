import { describe, expect, it } from "vitest";
import { activityDays } from "@/demo/derived/activity";

describe("derived/activity", () => {
  it("creates stable day series and respects weekend toggle", () => {
    const a = activityDays({ seed: "team_northstar", days: 42, includeWeekends: false });
    const b = activityDays({ seed: "team_northstar", days: 42, includeWeekends: false });
    expect(a.length).toBe(42);
    expect(a.map((d) => d.value)).toEqual(b.map((d) => d.value));

    const withWeekends = activityDays({ seed: "team_northstar", days: 14, includeWeekends: true });
    expect(withWeekends.length).toBe(14);
  });
});

