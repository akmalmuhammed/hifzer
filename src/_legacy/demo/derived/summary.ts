import type { OKR, Project, Signal, TeamHealth } from "@/demo/types";
import { clamp01, okrConfidence, okrProgress } from "@/demo/derived/progress";

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
  return total / values.length;
}

export function okrSummary(okrs: OKR[]): { count: number; progress: number; confidence: number } {
  const progress = average(okrs.map((o) => okrProgress(o)));
  const confidence = average(okrs.map((o) => okrConfidence(o)));
  return { count: okrs.length, progress: clamp01(progress), confidence: clamp01(confidence) };
}

export function signalCounts(signals: Signal[]): { risk: number; blocker: number; win: number } {
  let risk = 0;
  let blocker = 0;
  let win = 0;
  for (const s of signals) {
    if (s.type === "Risk") {
      risk += 1;
    } else if (s.type === "Blocker") {
      blocker += 1;
    } else {
      win += 1;
    }
  }
  return { risk, blocker, win };
}

export function healthCounts(items: Array<{ health: TeamHealth }>): { green: number; amber: number; red: number } {
  let green = 0;
  let amber = 0;
  let red = 0;
  for (const item of items) {
    if (item.health === "GREEN") {
      green += 1;
    } else if (item.health === "RED") {
      red += 1;
    } else {
      amber += 1;
    }
  }
  return { green, amber, red };
}

export function activeProjects(projects: Project[]): Project[] {
  return projects.filter((p) => p.status === "Active" || p.status === "Planning");
}

