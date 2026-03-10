"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  HandHeart,
  Heart,
  Minus,
  MoonStar,
  Plus,
  RefreshCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  laylatAlQadrJourney,
  type JourneyChapterId,
  type JourneyKind,
} from "@/hifzer/ramadan/laylat-al-qadr";
import styles from "./dua-experience.module.css";

const STORAGE_KEY = "hifzer.dua.laylat-al-qadr.experience";

type SavedState = {
  currentIndex: number;
  repetitionCounts: Record<string, number>;
  visitedStepIds: string[];
};

function buildDefaultState(): SavedState {
  return {
    currentIndex: 0,
    repetitionCounts: {},
    visitedStepIds: [laylatAlQadrJourney.steps[0]?.id ?? ""].filter(Boolean),
  };
}

function loadSavedState(): SavedState {
  const fallback = buildDefaultState();
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const saved = JSON.parse(raw) as Partial<SavedState>;
    const currentIndex = typeof saved.currentIndex === "number" &&
      saved.currentIndex >= 0 &&
      saved.currentIndex < laylatAlQadrJourney.steps.length
      ? saved.currentIndex
      : fallback.currentIndex;
    const repetitionCounts = saved.repetitionCounts && typeof saved.repetitionCounts === "object"
      ? (saved.repetitionCounts as Record<string, number>)
      : fallback.repetitionCounts;
    const visitedStepIds = Array.isArray(saved.visitedStepIds) && saved.visitedStepIds.length > 0
      ? saved.visitedStepIds.filter((value): value is string => typeof value === "string")
      : fallback.visitedStepIds;

    return {
      currentIndex,
      repetitionCounts,
      visitedStepIds,
    };
  } catch {
    return fallback;
  }
}

function kindTone(kind: JourneyKind): "accent" | "warn" {
  return kind === "authentic" ? "accent" : "warn";
}

function chapterIcon(chapter: JourneyChapterId): LucideIcon {
  if (chapter === "prophetic") {
    return MoonStar;
  }
  if (chapter === "repentance") {
    return Heart;
  }
  if (chapter === "asking") {
    return HandHeart;
  }
  if (chapter === "duas") {
    return Sparkles;
  }
  return CheckCheck;
}

function chapterTone(chapter: JourneyChapterId): "accent" | "warn" | "success" | "neutral" {
  if (chapter === "prophetic") {
    return "accent";
  }
  if (chapter === "repentance") {
    return "warn";
  }
  if (chapter === "asking") {
    return "neutral";
  }
  if (chapter === "duas") {
    return "success";
  }
  return "accent";
}

function ChapterGlyph(props: { chapter: JourneyChapterId; size: number }) {
  if (props.chapter === "prophetic") {
    return <MoonStar size={props.size} />;
  }
  if (props.chapter === "repentance") {
    return <Heart size={props.size} />;
  }
  if (props.chapter === "asking") {
    return <HandHeart size={props.size} />;
  }
  if (props.chapter === "duas") {
    return <Sparkles size={props.size} />;
  }
  return <CheckCheck size={props.size} />;
}

export function DuaExperienceClient() {
  const journey = laylatAlQadrJourney;
  const [state, setState] = useState<SavedState>(loadSavedState);
  const { currentIndex, repetitionCounts, visitedStepIds } = state;

  useEffect(() => {
    const state: SavedState = {
      currentIndex,
      repetitionCounts,
      visitedStepIds,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [currentIndex, repetitionCounts, visitedStepIds]);

  const currentStep = journey.steps[currentIndex];
  const currentChapterMeta = journey.chapters.find((chapter) => chapter.id === currentStep.chapter) ?? journey.chapters[0];
  const currentRepetitions = repetitionCounts[currentStep.id] ?? 0;

  const chapterProgress = useMemo(() => {
    return journey.chapters.map((chapter) => {
      const chapterSteps = journey.steps.filter((step) => step.chapter === chapter.id);
      const completed = chapterSteps.filter((step) => visitedStepIds.includes(step.id)).length;
      return {
        ...chapter,
        total: chapterSteps.length,
        completed,
        done: completed === chapterSteps.length,
      };
    });
  }, [journey.chapters, journey.steps, visitedStepIds]);

  const totalDuaRepetitions = useMemo(
    () => Object.values(repetitionCounts).reduce((sum, count) => sum + count, 0),
    [repetitionCounts],
  );

  const completedSteps = visitedStepIds.filter((stepId) => journey.steps.some((step) => step.id === stepId)).length;
  const isLastStep = currentIndex === journey.steps.length - 1;

  function adjustRepetitions(stepId: string, delta: number) {
    setState((previous) => {
      const nextValue = Math.max(0, (previous.repetitionCounts[stepId] ?? 0) + delta);
      return {
        ...previous,
        repetitionCounts: {
          ...previous.repetitionCounts,
          [stepId]: nextValue,
        },
      };
    });
  }

  function resetJourney() {
    setState(buildDefaultState());
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function goToStep(nextIndex: number) {
    const boundedIndex = Math.min(journey.steps.length - 1, Math.max(0, nextIndex));
    const stepId = journey.steps[boundedIndex]?.id;

    setState((previous) => ({
      ...previous,
      currentIndex: boundedIndex,
      visitedStepIds:
        stepId && !previous.visitedStepIds.includes(stepId)
          ? [...previous.visitedStepIds, stepId]
          : previous.visitedStepIds,
    }));
  }

  return (
    <div className="space-y-6 pb-12 pt-10 md:pb-16 md:pt-14">
      <PageHeader
        eyebrow="Dua"
        title="Laylat al-Qadr"
        subtitle="A guided night for qiyam, repentance, and sequenced duas, built from authentic anchors and clearly labeled when Hifzer is only structuring the flow."
        right={(
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" className="gap-2">
              <Link href="/quran">
                Back to Qur&apos;an <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="secondary" className="gap-2" onClick={resetJourney}>
              Restart journey <RefreshCcw size={16} />
            </Button>
          </div>
        )}
      />

      <section className={`${styles.hero} kw-fade-in`}>
        <div className={styles.heroGlowLeft} />
        <div className={styles.heroGlowRight} />
        <div className={styles.heroGrid}>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Laylat al-Qadr</Pill>
              <Pill tone="success">Guided experience</Pill>
              <Pill tone="warn">No fixed script claimed</Pill>
            </div>

            <div>
              <h2 className="kw-marketing-display max-w-[12ch] text-balance text-4xl text-[color:var(--kw-ink)] sm:text-5xl">
                Move through the night in one complete arc.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                {journey.subtitle}
              </p>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatLabel}>Step</span>
                <strong className={styles.heroStatValue}>{currentIndex + 1} / {journey.steps.length}</strong>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatLabel}>Reviewed</span>
                <strong className={styles.heroStatValue}>{completedSteps}</strong>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatLabel}>Dua repetitions</span>
                <strong className={styles.heroStatValue}>{totalDuaRepetitions}</strong>
              </div>
            </div>
          </div>

          <div className={styles.heroBoundary}>
            <div className="flex items-start gap-3">
              <span className={styles.boundaryIcon}>
                <CircleAlert size={17} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Authenticity boundary</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  {journey.authenticityBoundary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.chapterRail}>
        {chapterProgress.map((chapter) => {
          const Icon = chapterIcon(chapter.id);
          const active = chapter.id === currentStep.chapter;
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => {
                const firstIndex = journey.steps.findIndex((step) => step.chapter === chapter.id);
                if (firstIndex >= 0) {
                  goToStep(firstIndex);
                }
              }}
              className={styles.chapterCard}
              data-active={active ? "1" : "0"}
            >
              <span className={styles.chapterCardTop}>
                <span className={styles.chapterIconWrap} data-tone={chapterTone(chapter.id)}>
                  <Icon size={16} />
                </span>
                <span className={styles.chapterCount}>{chapter.completed}/{chapter.total}</span>
              </span>
              <span className={styles.chapterTitle}>{chapter.label}</span>
              <span className={styles.chapterDesc}>{chapter.description}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.workspace}>
        <aside className={styles.stepRail}>
          <div className={styles.railHeader}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Journey map</p>
            <p className="mt-1 text-sm text-[color:var(--kw-muted)]">Click any step to jump there.</p>
          </div>
          <div className={styles.stepList}>
            {journey.steps.map((step, index) => {
              const active = index === currentIndex;
              const seen = visitedStepIds.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={styles.stepListItem}
                  data-active={active ? "1" : "0"}
                  data-seen={seen ? "1" : "0"}
                >
                  <span className={styles.stepIndex}>{index + 1}</span>
                  <span className="min-w-0">
                    <span className={styles.stepEyebrow}>{step.eyebrow}</span>
                    <span className={styles.stepTitle}>{step.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className={styles.stage}>
          <Card className={styles.stageCard}>
            <div className={styles.stageTop}>
              <div className="flex min-w-0 items-start gap-3">
                <span className={styles.stageIconWrap} data-tone={chapterTone(currentStep.chapter)}>
                  <ChapterGlyph chapter={currentStep.chapter} size={17} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={kindTone(currentStep.kind)}>
                      {currentStep.kind === "authentic" ? "Verified anchor" : "Hifzer guided order"}
                    </Pill>
                    <Pill tone="neutral">{currentChapterMeta.label}</Pill>
                    <span className={styles.stepCountLabel}>Step {currentIndex + 1} of {journey.steps.length}</span>
                  </div>
                  <h3 className="mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
                    {currentStep.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                    {currentStep.summary}
                  </p>
                </div>
              </div>
            </div>

            {currentStep.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {currentStep.tags.map((tag) => (
                  <Pill key={tag} tone="neutral">{tag}</Pill>
                ))}
              </div>
            ) : null}

            <div className={styles.detailGrid}>
              {currentStep.details.map((detail) => (
                <div key={detail} className={styles.detailCard}>
                  <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{detail}</p>
                </div>
              ))}
            </div>

            {currentStep.actionLine ? (
              <div className={styles.actionCallout}>
                <span className={styles.actionCalloutIcon}>
                  <HandHeart size={16} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Do this now</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{currentStep.actionLine}</p>
                </div>
              </div>
            ) : null}

            {currentStep.dua ? (
              <div className={styles.duaCard}>
                <p dir="rtl" className={styles.duaArabic}>
                  {currentStep.dua.arabic}
                </p>
                <p className={styles.duaTransliteration}>{currentStep.dua.transliteration}</p>
                <p className={styles.duaTranslation}>{currentStep.dua.translation}</p>

                <div className={styles.counterPanel}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                      {currentStep.dua.trackerLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{currentStep.dua.trackerNote}</p>
                  </div>
                  <div className={styles.counterControls}>
                    <button
                      type="button"
                      className={styles.counterButton}
                      onClick={() => adjustRepetitions(currentStep.id, -1)}
                      aria-label="Decrease repetition count"
                    >
                      <Minus size={16} />
                    </button>
                    <span className={styles.counterValue}>{currentRepetitions}</span>
                    <button
                      type="button"
                      className={styles.counterButton}
                      onClick={() => adjustRepetitions(currentStep.id, 1)}
                      aria-label="Increase repetition count"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep.chapter === "completion" ? (
              <div className={styles.completionWrap}>
                <div className={styles.completionMetric}>
                  <span className={styles.completionMetricLabel}>Steps reviewed</span>
                  <strong className={styles.completionMetricValue}>{completedSteps}/{journey.steps.length}</strong>
                </div>
                <div className={styles.completionMetric}>
                  <span className={styles.completionMetricLabel}>Dua repetitions</span>
                  <strong className={styles.completionMetricValue}>{totalDuaRepetitions}</strong>
                </div>
                <div className={styles.completionMetric}>
                  <span className={styles.completionMetricLabel}>Chapters completed</span>
                  <strong className={styles.completionMetricValue}>{chapterProgress.filter((chapter) => chapter.done).length}/{chapterProgress.length}</strong>
                </div>
              </div>
            ) : null}

            <div className={styles.stageActions}>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => goToStep(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              {isLastStep ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="secondary" className="gap-2">
                    <Link href="/quran/read?view=compact">
                      Open Qur&apos;an <BookOpenText size={16} />
                    </Link>
                  </Button>
                  <Button className="gap-2" onClick={resetJourney}>
                    Start another round <RefreshCcw size={16} />
                  </Button>
                </div>
              ) : (
                <Button className="gap-2" onClick={() => goToStep(currentIndex + 1)}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </Card>
        </main>

        <aside className={styles.sidebar}>
          <Card className={styles.sidebarCard}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Current chapter</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{currentChapterMeta.label}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{currentChapterMeta.description}</p>
              </div>
              <span className={styles.sidebarIcon} data-tone={chapterTone(currentChapterMeta.id)}>
                <ChapterGlyph chapter={currentChapterMeta.id} size={16} />
              </span>
            </div>

            <div className={styles.sourceList}>
              {currentStep.sourceLinks.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.sourceRow}
                >
                  <span>{source.label}</span>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </Card>

          <Card className={styles.sidebarCard}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">Tonight&apos;s readout</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Stay inside the anchors</p>
              </div>
              <span className={styles.sidebarIcon} data-tone="warn">
                <CircleAlert size={16} />
              </span>
            </div>

            <div className={styles.sidebarChecklist}>
              <div className={styles.checkRow}>
                <span className={styles.checkDot} data-active={chapterProgress[0]?.completed ? "1" : "0"} />
                <p>Seek the night across the last ten and keep qiyam central.</p>
              </div>
              <div className={styles.checkRow}>
                <span className={styles.checkDot} data-active={chapterProgress[1]?.completed ? "1" : "0"} />
                <p>Repent with hope and do not persist knowingly in what you are leaving.</p>
              </div>
              <div className={styles.checkRow}>
                <span className={styles.checkDot} data-active={chapterProgress[2]?.completed ? "1" : "0"} />
                <p>Ask with praise, salawat, humility, and patience in the response.</p>
              </div>
              <div className={styles.checkRow}>
                <span className={styles.checkDot} data-active={chapterProgress[3]?.completed ? "1" : "0"} />
                <p>Use the dua deck as a focused worship aid, not as a superstition checklist.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
