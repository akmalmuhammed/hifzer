import "server-only";

import { MemorizationBand, SrsGrade } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { loadTodayState } from "@/hifzer/engine/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo, listAyahsForSurah } from "@/hifzer/quran/lookup.server";
import { getQuranTranslationByAyahId } from "@/hifzer/quran/translation.server";
import type { QuranTranslationId } from "@/hifzer/quran/translation-prefs";
import { db } from "@/lib/db";

const ARABIC_DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_ARABIC_TEXT_REGEX = /[^\u0621-\u063A\u0641-\u064A\u0671\s]/g;
const NON_LETTER_REGEX = /[^a-z\s]/g;
const ENGLISH_STOPWORDS = new Set([
  "a",
  "all",
  "allah",
  "among",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "did",
  "do",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "him",
  "his",
  "i",
  "if",
  "in",
  "indeed",
  "into",
  "is",
  "it",
  "its",
  "let",
  "lord",
  "me",
  "more",
  "most",
  "my",
  "not",
  "of",
  "on",
  "or",
  "our",
  "ours",
  "over",
  "said",
  "say",
  "so",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "to",
  "upon",
  "was",
  "we",
  "were",
  "what",
  "when",
  "which",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
]);

export type MushabihatPair = {
  leftAyahId: number;
  rightAyahId: number;
  leftRef: string;
  rightRef: string;
  leftSnippet: string | null;
  rightSnippet: string | null;
  similarityPct: number;
  reason: string;
  contrastHint: string;
};

export type SeamTrainerDrill = {
  id: string;
  fromAyahId: number;
  toAyahId: number;
  fromRef: string;
  toRef: string;
  fromSnippet: string | null;
  toSnippet: string | null;
  failCount: number;
  successRatePct: number;
  loopCount: number;
  repairHint: string;
};

export type RescueSessionBlock = {
  kind: "fragile_ayahs" | "weak_seams" | "scheduled_review";
  title: string;
  description: string;
  minutes: number;
  href: string;
  items: string[];
};

export type StablePassage = {
  surahNumber: number;
  surahName: string;
  juzNumber: number;
  startAyahId: number;
  endAyahId: number;
  startRef: string;
  endRef: string;
  ayahCount: number;
  confidenceScore: number;
  confidenceZone: "Green" | "Amber" | "Watch";
  promptRef: string;
  promptSnippet: string | null;
  loopPlan: string;
};

export type SalahSet = {
  label: string;
  rationale: string;
  passages: StablePassage[];
};

export type MeaningCueAyah = {
  ayahId: number;
  ref: string;
  cue: string;
  translation: string | null;
};

export type MeaningFrame = {
  startRef: string;
  endRef: string;
  cueTitle: string;
  focusWords: string[];
  ayahs: MeaningCueAyah[];
};

export type SurahConfidenceRow = {
  surahNumber: number;
  surahName: string;
  trackedAyahs: number;
  stablePct: number;
  fragileAyahs: number;
  weakTransitions: number;
  dueNow: number;
  confidenceScore: number;
  bucket: "Fragile" | "Building" | "Stable";
  focusRef: string;
  nextAction: string;
};

export type WeakAyahHotspot = {
  ayahId: number;
  ref: string;
  surahName: string;
  pageNumber: number;
  confidenceScore: number;
  snippet: string | null;
  lastGrade: SrsGrade | null;
  nextReviewAt: string;
  reasons: string[];
};

export type WeakLineZone = {
  surahNumber: number;
  surahName: string;
  pageNumber: number;
  startAyahId: number;
  endAyahId: number;
  startRef: string;
  endRef: string;
  intensityScore: number;
  hotspotCount: number;
  rationale: string;
};

export type MemorizationIntelligence = {
  mushabihat: MushabihatPair[];
  seamTrainer: SeamTrainerDrill[];
  rescueSession: {
    estimatedMinutes: number;
    blocks: RescueSessionBlock[];
  };
  imamPrep: StablePassage[];
  salahBuilder: SalahSet[];
  meaningFrames: MeaningFrame[];
  heatmap: SurahConfidenceRow[];
  weakAyahHotspots: WeakAyahHotspot[];
  weakLineZones: WeakLineZone[];
  metrics: {
    fragileAyahs: number;
    weakSeams: number;
    stablePassages: number;
    meaningFrames: number;
  };
};

const MEMORIZATION_INTELLIGENCE_CACHE_TTL_SECONDS = 120;

type RecentStruggleEvent = {
  ayahId: number;
  surahNumber: number;
  grade: SrsGrade | null;
  createdAt: Date;
};

type ReviewRow = {
  ayahId: number;
  band: MemorizationBand;
  nextReviewAt: Date;
  lastReviewAt: Date | null;
  lastGrade: SrsGrade | null;
};

type WeakTransitionRow = {
  id: string;
  fromAyahId: number;
  toAyahId: number;
  attemptCount: number;
  failCount: number;
  successRateCached: number;
  nextRepairAt: Date | null;
  lastOccurredAt: Date;
};

type ChallengeSummary = {
  ayahId: number;
  surahNumber: number;
  againCount: number;
  hardCount: number;
  totalCount: number;
  lastSeenAt: string;
};

type StablePassageSource = StablePassage & {
  score: number;
};

type SimilarityCandidate = {
  ayahId: number;
  score: number;
  overlapCount: number;
  prefixCount: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function trimSnippet(text: string | null | undefined, limit = 48): string | null {
  if (!text) {
    return null;
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function refLabel(ayahId: number): string {
  const ayah = getAyahById(ayahId);
  if (!ayah) {
    return `#${ayahId}`;
  }
  return `${ayah.surahNumber}:${ayah.ayahNumber}`;
}

export function normalizeArabicText(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(NON_ARABIC_TEXT_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function arabicTokens(text: string): string[] {
  return normalizeArabicText(text).split(" ").filter((token) => token.length > 1);
}

function englishTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(NON_LETTER_REGEX, " ")
    .split(" ")
    .filter((token) => token.length > 2 && !ENGLISH_STOPWORDS.has(token));
}

function overlapCount(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  let count = 0;
  for (const token of left) {
    if (rightSet.has(token)) {
      count += 1;
    }
  }
  return count;
}

function edgeOverlapCount(left: string[], right: string[], side: "prefix" | "suffix"): number {
  const max = Math.min(left.length, right.length, 5);
  let count = 0;
  for (let index = 0; index < max; index += 1) {
    const leftToken = side === "prefix" ? left[index] : left[left.length - 1 - index];
    const rightToken = side === "prefix" ? right[index] : right[right.length - 1 - index];
    if (leftToken !== rightToken) {
      break;
    }
    count += 1;
  }
  return count;
}

export function scoreArabicSimilarity(leftText: string, rightText: string): number {
  const left = arabicTokens(leftText);
  const right = arabicTokens(rightText);
  if (!left.length || !right.length) {
    return 0;
  }

  const shared = overlapCount(left, right);
  const prefix = edgeOverlapCount(left, right, "prefix");
  const suffix = edgeOverlapCount(left, right, "suffix");
  const sharedRatio = shared / Math.min(left.length, right.length);
  const prefixRatio = prefix / Math.min(left.length, right.length);
  const suffixRatio = suffix / Math.min(left.length, right.length);
  return clamp((sharedRatio * 0.6) + (prefixRatio * 0.25) + (suffixRatio * 0.15), 0, 1);
}

export function buildMeaningFocusWords(translations: string[]): string[] {
  const freq = new Map<string, number>();
  for (const translation of translations) {
    for (const token of englishTokens(translation)) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 4)
    .map(([token]) => token);
}

function shortMeaningCue(text: string | null): string {
  if (!text) {
    return "Read the meaning once before you recite blind.";
  }
  const clause = text.split(/[.;:!?]/)[0] ?? text;
  const words = clause.trim().split(/\s+/).slice(0, 10).join(" ");
  return words.length ? words : "Read the meaning once before you recite blind.";
}

function challengeMapFromEvents(rows: RecentStruggleEvent[]): Map<number, ChallengeSummary> {
  const challengeMap = new Map<number, ChallengeSummary>();

  for (const row of rows) {
    if (row.grade !== "AGAIN" && row.grade !== "HARD") {
      continue;
    }

    const existing = challengeMap.get(row.ayahId);
    if (!existing) {
      challengeMap.set(row.ayahId, {
        ayahId: row.ayahId,
        surahNumber: row.surahNumber,
        againCount: row.grade === "AGAIN" ? 1 : 0,
        hardCount: row.grade === "HARD" ? 1 : 0,
        totalCount: 1,
        lastSeenAt: row.createdAt.toISOString(),
      });
      continue;
    }

    existing.totalCount += 1;
    existing.lastSeenAt = row.createdAt.toISOString();
    if (row.grade === "AGAIN") {
      existing.againCount += 1;
    } else if (row.grade === "HARD") {
      existing.hardCount += 1;
    }
  }

  return challengeMap;
}

function topChallengeAyahs(challengeMap: Map<number, ChallengeSummary>, limit: number): ChallengeSummary[] {
  return Array.from(challengeMap.values())
    .sort((left, right) => {
      if (right.totalCount !== left.totalCount) {
        return right.totalCount - left.totalCount;
      }
      return right.lastSeenAt.localeCompare(left.lastSeenAt);
    })
    .slice(0, limit);
}

function bestSimilarAyah(sourceAyahId: number): SimilarityCandidate | null {
  const source = getAyahById(sourceAyahId);
  if (!source) {
    return null;
  }

  const sourceTokens = arabicTokens(source.textUthmani);
  if (!sourceTokens.length) {
    return null;
  }

  let best: SimilarityCandidate | null = null;
  for (const candidate of listAyahsForSurah(source.surahNumber)) {
    if (candidate.id === source.id) {
      continue;
    }

    const score = scoreArabicSimilarity(source.textUthmani, candidate.textUthmani);
    if (score < 0.5) {
      continue;
    }

    const candidateTokens = arabicTokens(candidate.textUthmani);
    const shared = overlapCount(sourceTokens, candidateTokens);
    const prefix = edgeOverlapCount(sourceTokens, candidateTokens, "prefix");

    if (shared < 2 && prefix < 2) {
      continue;
    }

    if (!best || score > best.score) {
      best = {
        ayahId: candidate.id,
        score,
        overlapCount: shared,
        prefixCount: prefix,
      };
    }
  }

  return best;
}

function buildMushabihatPairs(input: {
  challengeAyahs: ChallengeSummary[];
  newAyahIds: number[];
}): MushabihatPair[] {
  const seen = new Set<string>();
  const sourceAyahIds = [
    ...input.challengeAyahs.map((ayah) => ayah.ayahId),
    ...input.newAyahIds.slice(0, 4),
  ];

  const pairs: MushabihatPair[] = [];
  for (const ayahId of sourceAyahIds) {
    const source = getAyahById(ayahId);
    const candidate = bestSimilarAyah(ayahId);
    const target = candidate ? getAyahById(candidate.ayahId) : null;
    if (!source || !candidate || !target) {
      continue;
    }

    const key = [source.id, target.id].sort((left, right) => left - right).join(":");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const sourceTokens = arabicTokens(source.textUthmani);
    const targetTokens = arabicTokens(target.textUthmani);
    const sourceOnly = sourceTokens.filter((token) => !targetTokens.includes(token));
    const targetOnly = targetTokens.filter((token) => !sourceTokens.includes(token));
    const contrastHint = sourceOnly.length && targetOnly.length
      ? `Watch the pivot words: ${sourceOnly[0]} vs ${targetOnly[0]}.`
      : "The opening sounds close, but the pivot changes later in the ayah.";

    const reason = input.newAyahIds.includes(source.id)
      ? "Today's new work has a close neighboring ayah that can blur during blind recall."
      : "This ayah already produced recent struggle signals and sits near a similar ayah.";

    pairs.push({
      leftAyahId: source.id,
      rightAyahId: target.id,
      leftRef: `${source.surahNumber}:${source.ayahNumber}`,
      rightRef: `${target.surahNumber}:${target.ayahNumber}`,
      leftSnippet: trimSnippet(source.textUthmani),
      rightSnippet: trimSnippet(target.textUthmani),
      similarityPct: Math.round(candidate.score * 100),
      reason,
      contrastHint,
    });
  }

  return pairs
    .sort((left, right) => right.similarityPct - left.similarityPct)
    .slice(0, 4);
}

function buildSeamTrainer(rows: WeakTransitionRow[]): SeamTrainerDrill[] {
  return rows.slice(0, 5).map((row) => {
    const fromAyah = getAyahById(row.fromAyahId);
    const toAyah = getAyahById(row.toAyahId);
    const loopCount = row.failCount >= 4 ? 7 : row.failCount >= 2 ? 5 : 3;

    return {
      id: row.id,
      fromAyahId: row.fromAyahId,
      toAyahId: row.toAyahId,
      fromRef: fromAyah ? `${fromAyah.surahNumber}:${fromAyah.ayahNumber}` : `#${row.fromAyahId}`,
      toRef: toAyah ? `${toAyah.surahNumber}:${toAyah.ayahNumber}` : `#${row.toAyahId}`,
      fromSnippet: trimSnippet(fromAyah?.textUthmani ?? null, 36),
      toSnippet: trimSnippet(toAyah?.textUthmani ?? null, 36),
      failCount: row.failCount,
      successRatePct: Math.round(row.successRateCached * 100),
      loopCount,
      repairHint: row.successRateCached < 0.5
        ? "Loop only the seam first, then read the full passage once without stopping."
        : "Read the join slowly twice, then return to normal pace for one full pass.",
    };
  });
}

function buildRescueSession(input: {
  challengeAyahs: ChallengeSummary[];
  seamTrainer: SeamTrainerDrill[];
  dueNowCount: number;
  reviewCount: number;
  avgReviewSeconds: number;
  avgLinkSeconds: number;
}): { estimatedMinutes: number; blocks: RescueSessionBlock[] } {
  const blocks: RescueSessionBlock[] = [];

  const fragileAyahs = input.challengeAyahs.slice(0, 3);
  if (fragileAyahs.length) {
    const minutes = clamp(Math.round((fragileAyahs.length * input.avgReviewSeconds) / 60) + 1, 2, 4);
    blocks.push({
      kind: "fragile_ayahs",
      title: "Restart the ayahs that bent today",
      description: "Take the most fragile ayahs through listen, guided recall, then one honest blind pass.",
      minutes,
      href: fragileAyahs[0]
        ? `/quran/read?view=compact&surah=${fragileAyahs[0].surahNumber}&cursor=${fragileAyahs[0].ayahId}`
        : "/quran/read?view=compact",
      items: fragileAyahs.map((ayah) => `${ayah.surahNumber}:${getAyahById(ayah.ayahId)?.ayahNumber ?? 1}`),
    });
  }

  const weakSeams = input.seamTrainer.slice(0, 2);
  if (weakSeams.length) {
    const totalLoops = weakSeams.reduce((sum, seam) => sum + seam.loopCount, 0);
    const minutes = clamp(Math.round((totalLoops * input.avgLinkSeconds) / 60), 2, 3);
    blocks.push({
      kind: "weak_seams",
      title: "Repair the joins before they break again",
      description: "Do seam-only loops on the ayah-to-ayah joins that are currently leaking confidence.",
      minutes,
      href: weakSeams[0]
        ? `/quran/read?view=compact&surah=${getAyahById(weakSeams[0].fromAyahId)?.surahNumber ?? 1}&cursor=${weakSeams[0].fromAyahId}`
        : "/dashboard",
      items: weakSeams.map((seam) => `${seam.fromRef} -> ${seam.toRef}`),
    });
  }

  if (input.dueNowCount > 0 || input.reviewCount > 0) {
    const minutes = clamp(Math.round(((Math.min(input.reviewCount, 6) || 4) * input.avgReviewSeconds) / 60), 2, 4);
    blocks.push({
      kind: "scheduled_review",
      title: "Clear the scheduled pressure",
      description: input.dueNowCount > 0
        ? "Open review-only mode and reduce debt before more new work."
        : "Revisit the current review lane once so the queue does not keep dragging tomorrow forward.",
      minutes,
      href: "/hifz?focus=review",
      items: [
        input.dueNowCount > 0 ? `${input.dueNowCount} ayahs due now` : "Review-only lane ready",
        `${input.reviewCount} ayahs already sitting in today's plan`,
      ],
    });
  }

  const estimatedMinutes = clamp(blocks.reduce((sum, block) => sum + block.minutes, 0), blocks.length ? 5 : 0, 10);
  return { estimatedMinutes, blocks };
}

function stableBandWeight(band: MemorizationBand): number {
  if (band === "MASTERED") {
    return 1;
  }
  if (band === "MANZIL") {
    return 0.82;
  }
  if (band === "SABQI") {
    return 0.58;
  }
  return 0.28;
}

function scoreAyahConfidence(input: {
  row: ReviewRow;
  challengeMap: Map<number, ChallengeSummary>;
  nowMs: number;
  seamPenalty: number;
}): number {
  const challengePenalty = (input.challengeMap.get(input.row.ayahId)?.totalCount ?? 0) * 6;
  const duePenalty = input.row.nextReviewAt.getTime() <= input.nowMs ? 18 : 0;
  const gradePenalty = input.row.lastGrade === "AGAIN" ? 16 : input.row.lastGrade === "HARD" ? 8 : 0;
  return clamp(
    Math.round((stableBandWeight(input.row.band) * 100) - challengePenalty - duePenalty - gradePenalty - input.seamPenalty),
    12,
    98,
  );
}

function segmentStableRun(
  run: ReviewRow[],
  challengeMap: Map<number, ChallengeSummary>,
  weakTransitionKeys: Set<string>,
): StablePassageSource[] {
  const out: StablePassageSource[] = [];
  if (run.length < 3) {
    return out;
  }

  const segmentLength = run.length >= 10 ? 6 : run.length;
  for (let start = 0; start < run.length; start += segmentLength) {
    const segment = run.slice(start, start + segmentLength);
    if (segment.length < 3) {
      continue;
    }

    const firstAyah = getAyahById(segment[0]?.ayahId ?? 0);
    const lastAyah = getAyahById(segment[segment.length - 1]?.ayahId ?? 0);
    if (!firstAyah || !lastAyah) {
      continue;
    }

    const surah = getSurahInfo(firstAyah.surahNumber);
    const averageBandWeight = segment.reduce((sum, row) => sum + stableBandWeight(row.band), 0) / segment.length;
    const strugglePenalty = segment.reduce((sum, row) => sum + ((challengeMap.get(row.ayahId)?.totalCount ?? 0) * 6), 0);
    let seamPenalty = 0;
    for (let index = 0; index < segment.length - 1; index += 1) {
      const fromAyahId = segment[index]?.ayahId;
      const toAyahId = segment[index + 1]?.ayahId;
      if (fromAyahId && toAyahId && weakTransitionKeys.has(`${fromAyahId}:${toAyahId}`)) {
        seamPenalty += 8;
      }
    }
    const score = clamp(Math.round((averageBandWeight * 100) - strugglePenalty - seamPenalty), 48, 96);
    const promptIndex = segment.length >= 4 ? 2 : 1;
    const promptAyah = getAyahById(segment[promptIndex]?.ayahId ?? segment[0]?.ayahId ?? 0);
    const confidenceZone: StablePassage["confidenceZone"] = score >= 85 ? "Green" : score >= 70 ? "Amber" : "Watch";

    out.push({
      surahNumber: firstAyah.surahNumber,
      surahName: surah?.nameTransliteration ?? `Surah ${firstAyah.surahNumber}`,
      juzNumber: firstAyah.juzNumber,
      startAyahId: firstAyah.id,
      endAyahId: lastAyah.id,
      startRef: `${firstAyah.surahNumber}:${firstAyah.ayahNumber}`,
      endRef: `${lastAyah.surahNumber}:${lastAyah.ayahNumber}`,
      ayahCount: segment.length,
      confidenceScore: score,
      confidenceZone,
      promptRef: promptAyah ? `${promptAyah.surahNumber}:${promptAyah.ayahNumber}` : `${firstAyah.surahNumber}:${firstAyah.ayahNumber}`,
      promptSnippet: trimSnippet(promptAyah?.textUthmani ?? firstAyah.textUthmani, 42),
      loopPlan: confidenceZone === "Green"
        ? "Full passage 3x, then one blind prayer-paced read."
        : confidenceZone === "Amber"
          ? "Full passage 2x, seam anchors 2x, then one blind read."
          : "Slow pass 2x, prompt at the seam, then one honest blind attempt.",
      score,
    });
  }

  return out;
}

function buildStablePassages(input: {
  ayahReviews: ReviewRow[];
  challengeMap: Map<number, ChallengeSummary>;
  weakTransitions: WeakTransitionRow[];
}): StablePassageSource[] {
  const now = Date.now();
  const stableRows = input.ayahReviews
    .filter((row) => (
      (row.band === "MANZIL" || row.band === "MASTERED")
      && row.nextReviewAt.getTime() > now
      && row.lastGrade !== "AGAIN"
      && row.lastGrade !== "HARD"
    ))
    .sort((left, right) => left.ayahId - right.ayahId);

  const weakTransitionKeys = new Set(input.weakTransitions.map((row) => `${row.fromAyahId}:${row.toAyahId}`));
  const passages: StablePassageSource[] = [];

  let currentRun: ReviewRow[] = [];
  for (const row of stableRows) {
    const ayah = getAyahById(row.ayahId);
    const previous = currentRun[currentRun.length - 1];
    const previousAyah = previous ? getAyahById(previous.ayahId) : null;
    const continuesRun = Boolean(
      ayah
      && previousAyah
      && ayah.surahNumber === previousAyah.surahNumber
      && ayah.ayahNumber === previousAyah.ayahNumber + 1,
    );

    if (currentRun.length && !continuesRun) {
      passages.push(...segmentStableRun(currentRun, input.challengeMap, weakTransitionKeys));
      currentRun = [];
    }
    currentRun.push(row);
  }

  if (currentRun.length) {
    passages.push(...segmentStableRun(currentRun, input.challengeMap, weakTransitionKeys));
  }

  return passages
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.ayahCount - left.ayahCount;
    })
    .slice(0, 10);
}

function buildSalahBuilder(passages: StablePassageSource[], ayahReviews: ReviewRow[]): SalahSet[] {
  const enoughForTwo = passages.filter((passage) => passage.ayahCount >= 3).slice(0, 2);
  const enoughForFour = passages.filter((passage) => passage.ayahCount >= 2).slice(0, 4);

  const stableAyahIdsBySurah = new Map<number, Set<number>>();
  for (const row of ayahReviews) {
    if (row.band !== "MANZIL" && row.band !== "MASTERED") {
      continue;
    }
    if (row.lastGrade === "AGAIN" || row.lastGrade === "HARD") {
      continue;
    }
    const ayah = getAyahById(row.ayahId);
    if (!ayah) {
      continue;
    }
    const bucket = stableAyahIdsBySurah.get(ayah.surahNumber) ?? new Set<number>();
    bucket.add(row.ayahId);
    stableAyahIdsBySurah.set(ayah.surahNumber, bucket);
  }

  const shortStableSurahs: StablePassage[] = [];
  for (const [surahNumber, ayahIds] of stableAyahIdsBySurah.entries()) {
    const surah = getSurahInfo(surahNumber);
    if (!surah || surah.ayahCount > 18 || ayahIds.size < surah.ayahCount) {
      continue;
    }
    const firstAyah = getAyahById(surah.startAyahId);
    const lastAyah = getAyahById(surah.endAyahId);
    if (!firstAyah || !lastAyah) {
      continue;
    }
    shortStableSurahs.push({
      surahNumber,
      surahName: surah.nameTransliteration,
      juzNumber: firstAyah.juzNumber,
      startAyahId: firstAyah.id,
      endAyahId: lastAyah.id,
      startRef: `${surahNumber}:1`,
      endRef: `${surahNumber}:${surah.ayahCount}`,
      ayahCount: surah.ayahCount,
      confidenceScore: 92,
      confidenceZone: "Green",
      promptRef: `${surahNumber}:${Math.min(3, surah.ayahCount)}`,
      promptSnippet: trimSnippet(firstAyah.textUthmani, 42),
      loopPlan: "Recite once seated, once standing pace, then use in salah.",
    });
  }

  const passagesByJuz = new Map<number, StablePassageSource[]>();
  for (const passage of passages) {
    const bucket = passagesByJuz.get(passage.juzNumber) ?? [];
    bucket.push(passage);
    passagesByJuz.set(passage.juzNumber, bucket);
  }
  const juzCluster = Array.from(passagesByJuz.values())
    .filter((items) => items.length >= 2)
    .sort((left, right) => right.length - left.length)[0]
    ?.slice(0, 2) ?? [];

  return [
    {
      label: "2 rak'ah set",
      rationale: "Two stable passages sized for one calm two-rak'ah prayer without overreaching.",
      passages: enoughForTwo,
    },
    {
      label: "4 rak'ah set",
      rationale: "Shorter passages spaced across four rak'ahs to keep recall honest under standing pressure.",
      passages: enoughForFour,
    },
    {
      label: "Surah-based set",
      rationale: "Whole short surahs that are already stable enough to use as complete salah units.",
      passages: shortStableSurahs.slice(0, 3),
    },
    {
      label: "Juz-anchored set",
      rationale: "Passages clustered in the same juz so your mental context stays consistent.",
      passages: juzCluster,
    },
  ].filter((set) => set.passages.length > 0);
}

function buildMeaningFrame(ayahIds: number[], translationId: string): MeaningFrame {
  const preferredTranslationId = translationId as QuranTranslationId;
  const firstAyah = getAyahById(ayahIds[0] ?? 0);
  const lastAyah = getAyahById(ayahIds[ayahIds.length - 1] ?? 0);
  const translations = ayahIds
    .map((ayahId) => getQuranTranslationByAyahId(ayahId, preferredTranslationId) ?? getQuranTranslationByAyahId(ayahId, "en.sahih"))
    .filter((value): value is string => Boolean(value));
  const focusWords = buildMeaningFocusWords(translations);
  const cueTitle = focusWords.length
    ? `Meaning cue: ${focusWords.slice(0, 3).join(", ")}`
    : "Meaning cue: read the translation once before the blind step";

  return {
    startRef: firstAyah ? `${firstAyah.surahNumber}:${firstAyah.ayahNumber}` : `#${ayahIds[0] ?? 0}`,
    endRef: lastAyah ? `${lastAyah.surahNumber}:${lastAyah.ayahNumber}` : `#${ayahIds[ayahIds.length - 1] ?? 0}`,
    cueTitle,
    focusWords,
    ayahs: ayahIds.map((ayahId) => ({
      ayahId,
      ref: refLabel(ayahId),
      cue: shortMeaningCue(getQuranTranslationByAyahId(ayahId, preferredTranslationId) ?? getQuranTranslationByAyahId(ayahId, "en.sahih")),
      translation: getQuranTranslationByAyahId(ayahId, preferredTranslationId) ?? getQuranTranslationByAyahId(ayahId, "en.sahih"),
    })),
  };
}

function buildMeaningFrames(newAyahIds: number[], translationId: string): MeaningFrame[] {
  if (!newAyahIds.length) {
    return [];
  }

  const frames: MeaningFrame[] = [];
  let currentGroup: number[] = [];
  for (const ayahId of newAyahIds) {
    const previous = currentGroup[currentGroup.length - 1];
    if (previous && ayahId !== previous + 1) {
      frames.push(buildMeaningFrame(currentGroup, translationId));
      currentGroup = [];
    }
    currentGroup.push(ayahId);
  }
  if (currentGroup.length) {
    frames.push(buildMeaningFrame(currentGroup, translationId));
  }
  return frames.filter(Boolean).slice(0, 3);
}

function buildWeakAyahHotspots(input: {
  ayahReviews: ReviewRow[];
  challengeMap: Map<number, ChallengeSummary>;
  weakTransitions: WeakTransitionRow[];
}): WeakAyahHotspot[] {
  const nowMs = Date.now();
  const seamPenaltyByAyahId = new Map<number, number>();
  for (const transition of input.weakTransitions) {
    seamPenaltyByAyahId.set(transition.fromAyahId, (seamPenaltyByAyahId.get(transition.fromAyahId) ?? 0) + 6);
    seamPenaltyByAyahId.set(transition.toAyahId, (seamPenaltyByAyahId.get(transition.toAyahId) ?? 0) + 4);
  }

  return input.ayahReviews
    .map((row) => {
      const ayah = getAyahById(row.ayahId);
      if (!ayah) {
        return null;
      }
      const surah = getSurahInfo(ayah.surahNumber);
      const confidenceScore = scoreAyahConfidence({
        row,
        challengeMap: input.challengeMap,
        nowMs,
        seamPenalty: seamPenaltyByAyahId.get(row.ayahId) ?? 0,
      });
      const reasons: string[] = [];
      const challenge = input.challengeMap.get(row.ayahId);
      if (row.nextReviewAt.getTime() <= nowMs) {
        reasons.push("due now");
      }
      if (row.band === "ENCODING") {
        reasons.push("encoding");
      }
      if (row.lastGrade === "AGAIN" || row.lastGrade === "HARD") {
        reasons.push(`last grade ${row.lastGrade.toLowerCase()}`);
      }
      if (challenge) {
        reasons.push(`${challenge.totalCount} recent struggle signal${challenge.totalCount === 1 ? "" : "s"}`);
      }
      if ((seamPenaltyByAyahId.get(row.ayahId) ?? 0) > 0) {
        reasons.push("seam weakness nearby");
      }

      return {
        ayahId: row.ayahId,
        ref: `${ayah.surahNumber}:${ayah.ayahNumber}`,
        surahName: surah?.nameTransliteration ?? `Surah ${ayah.surahNumber}`,
        pageNumber: ayah.pageNumber,
        confidenceScore,
        snippet: trimSnippet(ayah.textUthmani),
        lastGrade: row.lastGrade ?? null,
        nextReviewAt: row.nextReviewAt.toISOString(),
        reasons,
      } satisfies WeakAyahHotspot;
    })
    .filter((row): row is WeakAyahHotspot => Boolean(row))
    .sort((left, right) => {
      if (left.confidenceScore !== right.confidenceScore) {
        return left.confidenceScore - right.confidenceScore;
      }
      return left.ref.localeCompare(right.ref);
    })
    .slice(0, 10);
}

function buildWeakLineZones(hotspots: WeakAyahHotspot[]): WeakLineZone[] {
  const byPage = new Map<string, WeakAyahHotspot[]>();
  for (const hotspot of hotspots) {
    const key = `${hotspot.surahName}:${hotspot.pageNumber}`;
    const bucket = byPage.get(key) ?? [];
    bucket.push(hotspot);
    byPage.set(key, bucket);
  }

  return Array.from(byPage.values())
    .map((rows) => {
      const sorted = rows
        .slice()
        .sort((left, right) => left.ayahId - right.ayahId);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const startAyah = first ? getAyahById(first.ayahId) : null;
      const endAyah = last ? getAyahById(last.ayahId) : null;
      if (!first || !last || !startAyah || !endAyah) {
        return null;
      }
      const intensityScore = Math.round(sorted.reduce((sum, row) => sum + (100 - row.confidenceScore), 0) / sorted.length);
      const topReasons = Array.from(new Set(sorted.flatMap((row) => row.reasons))).slice(0, 2);
      return {
        surahNumber: startAyah.surahNumber,
        surahName: first.surahName,
        pageNumber: first.pageNumber,
        startAyahId: first.ayahId,
        endAyahId: last.ayahId,
        startRef: `${startAyah.surahNumber}:${startAyah.ayahNumber}`,
        endRef: `${endAyah.surahNumber}:${endAyah.ayahNumber}`,
        intensityScore,
        hotspotCount: sorted.length,
        rationale: topReasons.length ? topReasons.join(" + ") : "weakness concentrated on one page",
      } satisfies WeakLineZone;
    })
    .filter((row): row is WeakLineZone => Boolean(row))
    .sort((left, right) => right.intensityScore - left.intensityScore)
    .slice(0, 6);
}

function buildConfidenceHeatmap(input: {
  activeSurahNumber: number;
  ayahReviews: ReviewRow[];
  challengeMap: Map<number, ChallengeSummary>;
  weakTransitions: WeakTransitionRow[];
}): SurahConfidenceRow[] {
  const now = Date.now();
  const weakTransitionCountByAyah = new Map<number, number>();
  const weakTransitionCountBySurah = new Map<number, number>();
  for (const transition of input.weakTransitions) {
    weakTransitionCountByAyah.set(transition.fromAyahId, (weakTransitionCountByAyah.get(transition.fromAyahId) ?? 0) + 1);
    weakTransitionCountByAyah.set(transition.toAyahId, (weakTransitionCountByAyah.get(transition.toAyahId) ?? 0) + 1);
    const ayah = getAyahById(transition.fromAyahId);
    if (!ayah) {
      continue;
    }
    weakTransitionCountBySurah.set(ayah.surahNumber, (weakTransitionCountBySurah.get(ayah.surahNumber) ?? 0) + 1);
  }

  const bySurah = new Map<number, {
    trackedAyahs: number;
    stableAyahs: number;
    fragileAyahs: number;
    dueNow: number;
    weightedScore: number;
    weakestAyahId: number | null;
    weakestScore: number;
  }>();

  for (const row of input.ayahReviews) {
    const ayah = getAyahById(row.ayahId);
    if (!ayah) {
      continue;
    }

    const surah = bySurah.get(ayah.surahNumber) ?? {
      trackedAyahs: 0,
      stableAyahs: 0,
      fragileAyahs: 0,
      dueNow: 0,
      weightedScore: 0,
      weakestAyahId: null,
      weakestScore: Number.POSITIVE_INFINITY,
    };

    surah.trackedAyahs += 1;
    const ayahScore = scoreAyahConfidence({
      row,
      challengeMap: input.challengeMap,
      nowMs: now,
      seamPenalty: (weakTransitionCountByAyah.get(row.ayahId) ?? 0) * 6,
    });
    surah.weightedScore += ayahScore;

    if (ayahScore < surah.weakestScore) {
      surah.weakestScore = ayahScore;
      surah.weakestAyahId = row.ayahId;
    }
    if (row.band === "MANZIL" || row.band === "MASTERED") {
      surah.stableAyahs += 1;
    }
    if (row.band === "ENCODING" || row.lastGrade === "AGAIN" || row.lastGrade === "HARD") {
      surah.fragileAyahs += 1;
    }
    if (row.nextReviewAt.getTime() <= now) {
      surah.dueNow += 1;
    }

    bySurah.set(ayah.surahNumber, surah);
  }

  const rows = Array.from(bySurah.entries()).map(([surahNumber, state]) => {
    const surah = getSurahInfo(surahNumber);
    const weakTransitions = weakTransitionCountBySurah.get(surahNumber) ?? 0;
    const confidenceScore = clamp(
      Math.round((state.weightedScore / Math.max(1, state.trackedAyahs)) - (weakTransitions * 6)),
      12,
      98,
    );
    const bucket: SurahConfidenceRow["bucket"] = confidenceScore >= 80 ? "Stable" : confidenceScore >= 60 ? "Building" : "Fragile";
    const focusRef = refLabel(state.weakestAyahId ?? surah?.startAyahId ?? 1);
    const nextAction = bucket === "Stable"
      ? "Good candidate for prayer-paced review or imam prep."
      : bucket === "Building"
        ? "Keep review consistent and tighten seams before using under pressure."
        : "Treat this surah as fragile. Use rescue drills before adding more new work.";

    return {
      surahNumber,
      surahName: surah?.nameTransliteration ?? `Surah ${surahNumber}`,
      trackedAyahs: state.trackedAyahs,
      stablePct: Math.round((state.stableAyahs / Math.max(1, state.trackedAyahs)) * 100),
      fragileAyahs: state.fragileAyahs,
      weakTransitions,
      dueNow: state.dueNow,
      confidenceScore,
      bucket,
      focusRef,
      nextAction,
    };
  });

  return rows
    .sort((left, right) => {
      if (left.surahNumber === input.activeSurahNumber) {
        return -1;
      }
      if (right.surahNumber === input.activeSurahNumber) {
        return 1;
      }
      if (right.trackedAyahs !== left.trackedAyahs) {
        return right.trackedAyahs - left.trackedAyahs;
      }
      return left.confidenceScore - right.confidenceScore;
    })
    .slice(0, 12);
}

export async function getMemorizationIntelligence(clerkUserId: string): Promise<MemorizationIntelligence | null> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }

  const now = new Date();
  const struggleSince = new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000));
  const prisma = db();

  const [todayResult, recentStruggleEvents, weakTransitions, ayahReviews] = await Promise.all([
    loadTodayState(clerkUserId).catch(() => null),
    prisma.reviewEvent.findMany({
      where: {
        userId: profile.id,
        grade: {
          in: [SrsGrade.AGAIN, SrsGrade.HARD],
        },
        createdAt: { gte: struggleSince },
      },
      orderBy: { createdAt: "desc" },
      take: 240,
      select: {
        ayahId: true,
        surahNumber: true,
        grade: true,
        createdAt: true,
      },
    }),
    prisma.weakTransition.findMany({
      where: {
        userId: profile.id,
        resolvedAt: null,
      },
      orderBy: [{ failCount: "desc" }, { attemptCount: "desc" }, { lastOccurredAt: "desc" }],
      take: 10,
      select: {
        id: true,
        fromAyahId: true,
        toAyahId: true,
        attemptCount: true,
        failCount: true,
        successRateCached: true,
        nextRepairAt: true,
        lastOccurredAt: true,
      },
    }),
    prisma.ayahReview.findMany({
      where: { userId: profile.id },
      select: {
        ayahId: true,
        band: true,
        nextReviewAt: true,
        lastReviewAt: true,
        lastGrade: true,
      },
    }),
  ]);

  const challengeMap = challengeMapFromEvents(recentStruggleEvents);
  const challengeAyahs = topChallengeAyahs(challengeMap, 6);
  const seamTrainer = buildSeamTrainer(weakTransitions);
  const newAyahIds = todayResult?.state.queue.newAyahIds ?? [];
  const meaningFrames = buildMeaningFrames(newAyahIds, profile.quranTranslationId);
  const mushabihat = buildMushabihatPairs({
    challengeAyahs,
    newAyahIds,
  });
  const reviewCount = todayResult
    ? todayResult.state.queue.weeklyGateAyahIds.length
      + todayResult.state.queue.sabqiReviewAyahIds.length
      + todayResult.state.queue.manzilReviewAyahIds.length
    : 0;

  const rescueSession = buildRescueSession({
    challengeAyahs,
    seamTrainer,
    dueNowCount: todayResult?.state.dueNowCount ?? 0,
    reviewCount,
    avgReviewSeconds: profile.avgReviewSeconds,
    avgLinkSeconds: profile.avgLinkSeconds,
  });

  const stablePassages = buildStablePassages({
    ayahReviews,
    challengeMap,
    weakTransitions,
  });
  const weakAyahHotspots = buildWeakAyahHotspots({
    ayahReviews,
    challengeMap,
    weakTransitions,
  });
  const weakLineZones = buildWeakLineZones(weakAyahHotspots);

  return {
    mushabihat,
    seamTrainer,
    rescueSession,
    imamPrep: stablePassages.slice(0, 3),
    salahBuilder: buildSalahBuilder(stablePassages, ayahReviews),
    meaningFrames,
    heatmap: buildConfidenceHeatmap({
      activeSurahNumber: profile.activeSurahNumber,
      ayahReviews,
      challengeMap,
      weakTransitions,
    }),
    weakAyahHotspots,
    weakLineZones,
    metrics: {
      fragileAyahs: challengeMap.size,
      weakSeams: weakTransitions.length,
      stablePassages: stablePassages.length,
      meaningFrames: meaningFrames.length,
    },
  };
}

export function getCachedMemorizationIntelligence(clerkUserId: string) {
  return unstable_cache(
    async () => getMemorizationIntelligence(clerkUserId),
    [`memorization-intelligence:${clerkUserId}`],
    {
      revalidate: MEMORIZATION_INTELLIGENCE_CACHE_TTL_SECONDS,
      tags: [`memorization-intelligence:${clerkUserId}`],
    },
  )();
}
