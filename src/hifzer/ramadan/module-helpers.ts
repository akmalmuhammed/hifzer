import type { DuaJourneyModule, JourneyEvidence, JourneyStep, SourceLink } from "./laylat-al-qadr";

export type BuiltInDeckStep = JourneyStep & {
  deckItemKey: string;
  deckOrder: number;
};

export type DuaJourneyModuleDefinition = Omit<DuaJourneyModule, "steps"> & {
  preludeSteps: JourneyStep[];
  deckSteps: BuiltInDeckStep[];
  completionSteps: JourneyStep[];
};

export const PRESENCE_TRACKER_NOTE =
  "Use the counter only as a focus aid. This module is not claiming a fixed repetition count unless the source itself establishes one.";

export function quran(label: string, href: string): SourceLink {
  return { label, href };
}

export function hadith(label: string, href: string): SourceLink {
  return { label, href };
}

export function dedupeSources(evidence: JourneyEvidence[]): SourceLink[] {
  const seen = new Set<string>();
  const output: SourceLink[] = [];
  for (const item of evidence) {
    if (!item.source) {
      continue;
    }
    const key = `${item.source.label}|${item.source.href}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item.source);
  }
  return output;
}

export function createStep(step: Omit<JourneyStep, "sourceLinks">): JourneyStep {
  return {
    ...step,
    sourceLinks: dedupeSources(step.evidence),
  };
}
