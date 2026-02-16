import { describe, expect, it } from "vitest";
import { DEMO } from "@/demo/data";
import { activeProjects, healthCounts, okrSummary, signalCounts } from "@/demo/derived/summary";

describe("derived/summary", () => {
  it("computes okr summary safely", () => {
    const okrs = DEMO.okrs.filter((o) => o.teamId === "team_northstar");
    const s = okrSummary(okrs);
    expect(s.count).toBeGreaterThan(0);
    expect(s.progress).toBeGreaterThanOrEqual(0);
    expect(s.progress).toBeLessThanOrEqual(1);
    expect(s.confidence).toBeGreaterThanOrEqual(0);
    expect(s.confidence).toBeLessThanOrEqual(1);
  });

  it("counts signals by type", () => {
    const signals = DEMO.signals.filter((s) => s.teamId === "team_orbit");
    const c = signalCounts(signals);
    expect(c.risk + c.blocker + c.win).toBe(signals.length);
  });

  it("counts health buckets", () => {
    const projects = DEMO.projects.filter((p) => p.teamId === "team_northstar");
    const c = healthCounts(projects);
    expect(c.green + c.amber + c.red).toBe(projects.length);
  });

  it("filters active projects", () => {
    const projects = DEMO.projects.filter((p) => p.teamId === "team_orbit");
    const active = activeProjects(projects);
    expect(active.every((p) => p.status === "Active" || p.status === "Planning")).toBe(true);
  });
});

