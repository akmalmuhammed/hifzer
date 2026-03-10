export type ReciterOption = {
  id: string;
  label: string;
  description: string;
};

export const RECITER_OPTIONS: ReciterOption[] = [
  {
    id: "default",
    label: "System default",
    description: "Uses the reciter configured for this Hifzer deployment.",
  },
  {
    id: "alafasy",
    label: "Mishary Alafasy",
    description: "Clear, familiar recitation that works well for daily reading and review.",
  },
  {
    id: "husary",
    label: "Mahmoud Khalil Al-Husary",
    description: "Steady tajweed-focused pacing suited for careful listening and memorization.",
  },
];

const RECITER_IDS = new Set(RECITER_OPTIONS.map((option) => option.id));

export function isSupportedReciterId(value: string): boolean {
  return RECITER_IDS.has(value);
}

export function normalizeReciterId(value: string | null | undefined): string {
  if (!value) {
    return "default";
  }
  return isSupportedReciterId(value) ? value : "default";
}

export function getReciterLabel(reciterId: string): string {
  return RECITER_OPTIONS.find((option) => option.id === reciterId)?.label ?? "System default";
}
