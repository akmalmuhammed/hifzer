import type { KeyResult, OKR, Project } from "@/demo/types";

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function keyResultProgress(kr: KeyResult): number {
  // Heuristic: if current is above target, assume "lower is better" (e.g. incident counts).
  if (kr.target === 0) {
    return 0;
  }
  const raw = kr.current <= kr.target ? kr.current / kr.target : kr.target / kr.current;
  return clamp01(raw);
}

export function okrProgress(okr: OKR): number {
  if (okr.keyResults.length === 0) {
    return 0;
  }
  const total = okr.keyResults.reduce((acc, kr) => acc + keyResultProgress(kr), 0);
  return clamp01(total / okr.keyResults.length);
}

export function okrConfidence(okr: OKR): number {
  const krConfidence =
    okr.keyResults.length === 0
      ? 0.5
      : okr.keyResults.reduce((acc, kr) => acc + clamp01(kr.confidence), 0) /
        okr.keyResults.length;
  const latestCheckIn = okr.checkIns
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))[0];
  const checkInConfidence = latestCheckIn ? clamp01(latestCheckIn.confidence) : krConfidence;
  // Blend makes confidence responsive to recent narrative without discarding KR signal.
  return clamp01(krConfidence * 0.65 + checkInConfidence * 0.35);
}

export function projectMilestoneProgress(project: Project): number {
  if (project.milestones.length === 0) {
    return 0;
  }
  const done = project.milestones.filter((m) => m.status === "Done").length;
  return clamp01(done / project.milestones.length);
}

export function sparklineDelta(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  return last - first;
}
