import type { JournalEntryType } from "./local-store";

type JournalPrefillInput = {
  ayahId: number;
  prompt?: string | null;
  title?: string | null;
  type?: JournalEntryType | null;
};

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildJournalPrefillHref(input: JournalPrefillInput): string {
  const params = new URLSearchParams();
  params.set("newEntry", "1");
  params.set("ayahId", String(input.ayahId));

  const prompt = normalizeText(input.prompt);
  if (prompt) {
    params.set("prompt", prompt);
  }

  const title = normalizeText(input.title);
  if (title) {
    params.set("title", title);
  }

  if (input.type && input.type !== "reflection") {
    params.set("type", input.type);
  }

  return `/journal?${params.toString()}`;
}
