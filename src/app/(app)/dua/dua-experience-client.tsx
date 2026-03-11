"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  HandHeart,
  Heart,
  Minus,
  MoonStar,
  PencilLine,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SupportTextPanel } from "@/components/quran/support-text-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  DEFAULT_DUA_MODULE_ID,
  buildDuaModules,
  type CustomDuaSnapshot,
  type DuaDeckOrderSnapshot,
  type DuaJourneyModule,
  type DuaModuleId,
  type JourneyKind,
} from "@/hifzer/ramadan/laylat-al-qadr";
import styles from "./dua-experience.module.css";

const STORAGE_KEY = "hifzer.dua.experience.v3";
const DUA_VISIBILITY_KEY = "hifzer.dua.support-copy.v1";

type ModuleProgressState = {
  currentIndex: number;
  repetitionCounts: Record<string, number>;
  visitedStepIds: string[];
};

type SavedState = {
  currentModuleId: DuaModuleId;
  moduleState: Record<string, ModuleProgressState>;
};

type DuaExperienceClientProps = {
  canManageCustomDuas: boolean;
  initialCustomDuas: CustomDuaSnapshot[];
  initialDeckOrders: DuaDeckOrderSnapshot[];
};

type CustomDuaDraft = {
  id: string | null;
  moduleId: DuaModuleId;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  note: string;
  sortOrder: string;
};

type DeckEntry = {
  itemKey: string;
  title: string;
  summary: string;
  sortOrder: number;
  kind: JourneyKind;
  customId: string | null;
};

type DuaVisibilityPrefs = {
  showTransliteration: boolean;
  showTranslation: boolean;
};

function moduleIcon(moduleId: DuaModuleId): LucideIcon {
  return moduleId === "laylat-al-qadr" ? MoonStar : Heart;
}

function moduleTone(moduleId: DuaModuleId): "accent" | "warn" | "success" {
  return moduleId === "laylat-al-qadr" ? "accent" : "warn";
}

function kindTone(kind: JourneyKind): "accent" | "warn" | "success" {
  if (kind === "authentic") {
    return "accent";
  }
  if (kind === "personal") {
    return "success";
  }
  return "warn";
}

function kindLabel(kind: JourneyKind): string {
  if (kind === "authentic") {
    return "Verified anchor";
  }
  if (kind === "personal") {
    return "Private to you";
  }
  return "Hifzer structured";
}

function buildDefaultModuleProgress(journeyModule: DuaJourneyModule): ModuleProgressState {
  const firstStepId = journeyModule.steps[0]?.id;
  return {
    currentIndex: 0,
    repetitionCounts: {},
    visitedStepIds: firstStepId ? [firstStepId] : [],
  };
}

function normalizeModuleProgress(journeyModule: DuaJourneyModule, input?: Partial<ModuleProgressState>): ModuleProgressState {
  const stepIds = journeyModule.steps.map((step) => step.id);
  const validStepIds = new Set(stepIds);
  const fallback = buildDefaultModuleProgress(journeyModule);
  const currentIndex = typeof input?.currentIndex === "number" &&
      input.currentIndex >= 0 &&
      input.currentIndex < stepIds.length
    ? input.currentIndex
    : fallback.currentIndex;
  const repetitionCounts =
    input?.repetitionCounts && typeof input.repetitionCounts === "object"
      ? (input.repetitionCounts as Record<string, number>)
      : fallback.repetitionCounts;
  const visitedStepIds = Array.isArray(input?.visitedStepIds)
    ? input.visitedStepIds.filter((stepId): stepId is string => typeof stepId === "string" && validStepIds.has(stepId))
    : [];

  const normalizedVisited = visitedStepIds.length > 0 ? visitedStepIds : fallback.visitedStepIds;
  const currentStepId = stepIds[currentIndex];

  return {
    currentIndex,
    repetitionCounts,
    visitedStepIds:
      currentStepId && !normalizedVisited.includes(currentStepId)
        ? [...normalizedVisited, currentStepId]
        : normalizedVisited,
  };
}

function buildDefaultSavedState(modules: DuaJourneyModule[]): SavedState {
  const currentModuleId = modules[0]?.id ?? DEFAULT_DUA_MODULE_ID;
  const moduleState = Object.fromEntries(
    modules.map((journeyModule) => [journeyModule.id, buildDefaultModuleProgress(journeyModule)]),
  );
  return { currentModuleId, moduleState };
}

function reconcileSavedState(modules: DuaJourneyModule[], input?: Partial<SavedState>): SavedState {
  const fallback = buildDefaultSavedState(modules);
  const moduleIds = new Set(modules.map((journeyModule) => journeyModule.id));
  const currentModuleId =
    typeof input?.currentModuleId === "string" && moduleIds.has(input.currentModuleId as DuaModuleId)
      ? (input.currentModuleId as DuaModuleId)
      : fallback.currentModuleId;
  const moduleState: Record<string, ModuleProgressState> = {};
  for (const journeyModule of modules) {
    moduleState[journeyModule.id] = normalizeModuleProgress(
      journeyModule,
      (input?.moduleState?.[journeyModule.id] ?? {}) as Partial<ModuleProgressState>,
    );
  }
  return {
    currentModuleId,
    moduleState,
  };
}

function loadSavedState(modules: DuaJourneyModule[]): SavedState {
  const fallback = buildDefaultSavedState(modules);
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    return reconcileSavedState(modules, JSON.parse(raw) as Partial<SavedState>);
  } catch {
    return fallback;
  }
}

function loadVisibilityPrefs(): DuaVisibilityPrefs {
  if (typeof window === "undefined") {
    return {
      showTransliteration: true,
      showTranslation: true,
    };
  }
  try {
    const raw = window.localStorage.getItem(DUA_VISIBILITY_KEY);
    if (!raw) {
      return {
        showTransliteration: true,
        showTranslation: true,
      };
    }
    const parsed = JSON.parse(raw) as Partial<DuaVisibilityPrefs>;
    return {
      showTransliteration: typeof parsed.showTransliteration === "boolean" ? parsed.showTransliteration : true,
      showTranslation: typeof parsed.showTranslation === "boolean" ? parsed.showTranslation : true,
    };
  } catch {
    return {
      showTransliteration: true,
      showTranslation: true,
    };
  }
}

function draftKey(moduleId: DuaModuleId, itemKey: string): string {
  return `${moduleId}:${itemKey}`;
}

function parseDeckOrder(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(9999, Math.floor(parsed)));
}

function emptyDraft(moduleId: DuaModuleId, sortOrder?: number): CustomDuaDraft {
  return {
    id: null,
    moduleId,
    title: "",
    arabic: "",
    transliteration: "",
    translation: "",
    note: "",
    sortOrder: sortOrder ? String(sortOrder) : "",
  };
}

export function DuaExperienceClient({
  canManageCustomDuas,
  initialCustomDuas,
  initialDeckOrders,
}: DuaExperienceClientProps) {
  const initialModules = buildDuaModules({
    customDuas: initialCustomDuas,
    deckOrders: initialDeckOrders,
  });
  const [customDuas, setCustomDuas] = useState(initialCustomDuas);
  const [deckOrders, setDeckOrders] = useState(initialDeckOrders);
  const [experienceState, setExperienceState] = useState<SavedState>(() => loadSavedState(initialModules));
  const [showManager, setShowManager] = useState(false);
  const [draft, setDraft] = useState<CustomDuaDraft>(emptyDraft(DEFAULT_DUA_MODULE_ID, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingOrderKey, setSavingOrderKey] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [visibilityPrefs, setVisibilityPrefs] = useState<DuaVisibilityPrefs>(loadVisibilityPrefs);

  const modules = useMemo(
    () =>
      buildDuaModules({
        customDuas,
        deckOrders,
      }),
    [customDuas, deckOrders],
  );

  useEffect(() => {
    setExperienceState((previous) => reconcileSavedState(modules, previous));
  }, [modules]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experienceState));
    }
  }, [experienceState]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DUA_VISIBILITY_KEY, JSON.stringify(visibilityPrefs));
    }
  }, [visibilityPrefs]);

  const currentModule =
    modules.find((journeyModule) => journeyModule.id === experienceState.currentModuleId) ??
    modules[0];
  const currentModuleState =
    (currentModule && experienceState.moduleState[currentModule.id]) ||
    (currentModule ? buildDefaultModuleProgress(currentModule) : { currentIndex: 0, repetitionCounts: {}, visitedStepIds: [] });
  const currentStep = currentModule?.steps[currentModuleState.currentIndex] ?? currentModule?.steps[0];

  const moduleProgress = useMemo(
    () =>
      modules.map((journeyModule) => {
        const progress = experienceState.moduleState[journeyModule.id] ?? buildDefaultModuleProgress(journeyModule);
        const seen = progress.visitedStepIds.filter((stepId) => journeyModule.steps.some((step) => step.id === stepId)).length;
        return {
          module: journeyModule,
          seen,
          total: journeyModule.steps.length,
        };
      }),
    [experienceState.moduleState, modules],
  );

  const deckEntries = useMemo<DeckEntry[]>(() => {
    if (!currentModule) {
      return [];
    }
    return currentModule.steps
      .filter((step) => step.deckItemKey)
      .map((step) => ({
        itemKey: step.deckItemKey ?? step.id,
        title: step.title,
        summary: step.summary,
        sortOrder: step.deckOrder ?? 0,
        kind: step.kind,
        customId: step.kind === "personal" ? step.id.replace(/^custom-dua-/, "") : null,
      }));
  }, [currentModule]);

  const nextSuggestedSortOrder = deckEntries.length > 0
    ? Math.max(...deckEntries.map((entry) => entry.sortOrder)) + 10
    : 10;

  useEffect(() => {
    setOrderDrafts((previous) => {
      const next: Record<string, string> = { ...previous };
      for (const entry of deckEntries) {
        next[draftKey(currentModule.id, entry.itemKey)] =
          previous[draftKey(currentModule.id, entry.itemKey)] ?? String(entry.sortOrder);
      }
      return next;
    });
  }, [currentModule.id, deckEntries]);

  useEffect(() => {
    if (draft.id === null) {
      setDraft((previous) => ({
        ...previous,
        moduleId: currentModule.id,
        sortOrder: previous.sortOrder || String(nextSuggestedSortOrder),
      }));
    }
  }, [currentModule.id, draft.id, nextSuggestedSortOrder]);

  const currentRepetitions = currentStep ? currentModuleState.repetitionCounts[currentStep.id] ?? 0 : 0;
  const totalDuaRepetitions = useMemo(
    () => Object.values(currentModuleState.repetitionCounts).reduce((sum, count) => sum + count, 0),
    [currentModuleState.repetitionCounts],
  );
  const currentStepHasTransliteration = Boolean(currentStep?.dua?.transliteration?.trim());
  const showAnyDuaSupport = visibilityPrefs.showTransliteration || visibilityPrefs.showTranslation;

  function setModuleProgress(moduleId: DuaModuleId, updater: (previous: ModuleProgressState) => ModuleProgressState) {
    setExperienceState((previous) => {
      const journeyModule = modules.find((entry) => entry.id === moduleId);
      if (!journeyModule) {
        return previous;
      }
      const current = previous.moduleState[moduleId] ?? buildDefaultModuleProgress(journeyModule);
      return {
        ...previous,
        moduleState: {
          ...previous.moduleState,
          [moduleId]: normalizeModuleProgress(journeyModule, updater(current)),
        },
      };
    });
  }

  function goToModule(moduleId: DuaModuleId) {
    setExperienceState((previous) => ({
      ...previous,
      currentModuleId: moduleId,
    }));
    setFormError(null);
    setFeedback(null);
  }

  function goToStep(nextIndex: number) {
    if (!currentModule) {
      return;
    }
    const boundedIndex = Math.min(currentModule.steps.length - 1, Math.max(0, nextIndex));
    const stepId = currentModule.steps[boundedIndex]?.id;
    setModuleProgress(currentModule.id, (previous) => ({
      ...previous,
      currentIndex: boundedIndex,
      visitedStepIds:
        stepId && !previous.visitedStepIds.includes(stepId)
          ? [...previous.visitedStepIds, stepId]
          : previous.visitedStepIds,
    }));
  }

  function resetCurrentModule() {
    if (!currentModule) {
      return;
    }
    setModuleProgress(currentModule.id, () => buildDefaultModuleProgress(currentModule));
    setFeedback(null);
    setFormError(null);
  }

  function adjustRepetitions(stepId: string, delta: number) {
    setModuleProgress(currentModule.id, (previous) => {
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

  function resetDraft(moduleId: DuaModuleId, sortOrder?: number) {
    setDraft(emptyDraft(moduleId, sortOrder ?? nextSuggestedSortOrder));
    setFormError(null);
    setFeedback(null);
  }

  function populateDraftFromCustom(customId: string | null) {
    if (!customId) {
      return;
    }
    const customDua = customDuas.find((entry) => entry.id === customId);
    const deckEntry = deckEntries.find((entry) => entry.customId === customId);
    if (!customDua || !deckEntry) {
      return;
    }
    setDraft({
      id: customDua.id,
      moduleId: customDua.moduleId,
      title: customDua.title,
      arabic: customDua.arabic ?? "",
      transliteration: customDua.transliteration ?? "",
      translation: customDua.translation,
      note: customDua.note ?? "",
      sortOrder: String(deckEntry.sortOrder),
    });
    setFormError(null);
    setFeedback("Editing your private dua.");
    setShowManager(true);
  }

  async function submitCustomDua(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageCustomDuas) {
      return;
    }

    setSavingDraft(true);
    setFormError(null);
    setFeedback(null);

    const payload = {
      moduleId: currentModule.id,
      title: draft.title,
      arabic: draft.arabic || null,
      transliteration: draft.transliteration || null,
      translation: draft.translation,
      note: draft.note || null,
      sortOrder: draft.sortOrder ? parseDeckOrder(draft.sortOrder, nextSuggestedSortOrder) : nextSuggestedSortOrder,
    };

    try {
      const response = await fetch(draft.id ? `/api/dua/${draft.id}` : "/api/dua", {
        method: draft.id ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        customDua?: CustomDuaSnapshot;
        deckOrder?: DuaDeckOrderSnapshot;
      };
      if (!response.ok || !data.ok || !data.customDua || !data.deckOrder) {
        throw new Error(data.error || "Unable to save custom dua.");
      }

      setCustomDuas((previous) => {
        const remaining = previous.filter((entry) => entry.id !== data.customDua?.id);
        return [...remaining, data.customDua as CustomDuaSnapshot];
      });
      setDeckOrders((previous) => {
        const next = previous.filter(
          (entry) =>
            !(entry.moduleId === data.deckOrder?.moduleId && entry.itemKey === data.deckOrder?.itemKey),
        );
        return [...next, data.deckOrder as DuaDeckOrderSnapshot];
      });
      resetDraft(currentModule.id, nextSuggestedSortOrder + 10);
      setFeedback(draft.id ? "Private dua updated in this module." : "Private dua added to this module.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save custom dua.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function updateDeckOrder(itemKey: string, inputValue: string, options?: { reset?: boolean }) {
    setSavingOrderKey(itemKey);
    setFormError(null);
    setFeedback(null);

    const fallback = deckEntries.find((entry) => entry.itemKey === itemKey)?.sortOrder ?? nextSuggestedSortOrder;

    try {
      const response = await fetch("/api/dua/deck-order", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          moduleId: currentModule.id,
          itemKey,
          sortOrder: options?.reset ? undefined : parseDeckOrder(inputValue, fallback),
          reset: options?.reset === true,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        deckOrder?: DuaDeckOrderSnapshot;
      };
      if (!response.ok || !data.ok || !data.deckOrder) {
        throw new Error(data.error || "Unable to save the deck order.");
      }

      setDeckOrders((previous) => {
        const next = previous.filter(
          (entry) =>
            !(entry.moduleId === data.deckOrder?.moduleId && entry.itemKey === data.deckOrder?.itemKey),
        );
        return [...next, data.deckOrder as DuaDeckOrderSnapshot];
      });
      setOrderDrafts((previous) => ({
        ...previous,
        [draftKey(currentModule.id, itemKey)]: String(data.deckOrder?.sortOrder ?? fallback),
      }));
      setFeedback(options?.reset ? "Built-in order reset." : "Deck order updated.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save the deck order.");
    } finally {
      setSavingOrderKey(null);
    }
  }

  async function removeCustomDua(customId: string) {
    setDeletingCustomId(customId);
    setFormError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/dua/${customId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to delete the custom dua.");
      }

      const removedItemKey = `custom:${customId}`;
      setCustomDuas((previous) => previous.filter((entry) => entry.id !== customId));
      setDeckOrders((previous) =>
        previous.filter((entry) => !(entry.moduleId === currentModule.id && entry.itemKey === removedItemKey)),
      );
      setOrderDrafts((previous) => {
        const next = { ...previous };
        delete next[draftKey(currentModule.id, removedItemKey)];
        return next;
      });
      if (draft.id === customId) {
        resetDraft(currentModule.id, nextSuggestedSortOrder);
      }
      setFeedback("Private dua removed from this module.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to delete the custom dua.");
    } finally {
      setDeletingCustomId(null);
    }
  }

  if (!currentModule || !currentStep) {
    return null;
  }

  const currentModuleIndex = modules.findIndex((journeyModule) => journeyModule.id === currentModule.id);
  const nextModule = currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1
    ? modules[currentModuleIndex + 1]
    : null;
  const isLastStep = currentModuleState.currentIndex === currentModule.steps.length - 1;
  const currentProgress = moduleProgress.find((entry) => entry.module.id === currentModule.id);

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Dua"
        title="Guided dua modules"
        subtitle="Focused step-by-step experiences for Laylat al-Qadr, repentance, and future guided worship modules."
        right={(
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" className="gap-2">
              <Link href="/quran">
                Back to Qur&apos;an <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="secondary" className="gap-2" onClick={resetCurrentModule}>
              Reset this module <RefreshCcw size={16} />
            </Button>
          </div>
        )}
      />

      <section className={styles.moduleStrip}>
        {moduleProgress.map(({ module: journeyModule, seen, total }) => {
          const Icon = moduleIcon(journeyModule.id);
          const active = journeyModule.id === currentModule.id;
          return (
            <button
              key={journeyModule.id}
              type="button"
              onClick={() => goToModule(journeyModule.id)}
              className={styles.moduleCard}
              data-active={active ? "1" : "0"}
            >
              <span className={styles.moduleCardTop}>
                <span className={styles.moduleIcon} data-tone={moduleTone(journeyModule.id)}>
                  <Icon size={18} />
                </span>
                <span className={styles.moduleCount}>{seen}/{total}</span>
              </span>
              <span className={styles.moduleEyebrow}>{journeyModule.eyebrow}</span>
              <span className={styles.moduleTitle}>{journeyModule.label}</span>
              <span className={styles.moduleDescription}>{journeyModule.description}</span>
            </button>
          );
        })}
      </section>

      <section className={styles.shell}>
        <aside className={styles.navigator}>
          <Card className={styles.navigatorCard}>
            <div className={styles.navigatorTop}>
              <Pill tone={moduleTone(currentModule.id)}>{currentModule.shortLabel}</Pill>
              <Pill tone="neutral">
                {currentModuleState.currentIndex + 1} / {currentModule.steps.length}
              </Pill>
            </div>
            <h2 className={styles.navigatorTitle}>{currentModule.title}</h2>
            <p className={styles.navigatorSubtitle}>{currentModule.subtitle}</p>
            <div className={styles.boundaryCard}>
              <span className={styles.boundaryIcon}>
                <CircleAlert size={16} />
              </span>
              <p>{currentModule.authenticityBoundary}</p>
            </div>
            <div className={styles.moduleMetaRow}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Visited</span>
                <strong className={styles.metricValue}>{currentProgress?.seen ?? 0}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Repetitions</span>
                <strong className={styles.metricValue}>{totalDuaRepetitions}</strong>
              </div>
            </div>
            {currentModule.supportsCustomDeck ? (
              <Button
                variant="secondary"
                className="mt-2 gap-2"
                onClick={() => setShowManager((previous) => !previous)}
              >
                <Sparkles size={16} />
                {showManager ? "Hide private deck" : "Manage private deck"}
              </Button>
            ) : null}
          </Card>

          <div className={styles.stepRail}>
            {currentModule.steps.map((step, index) => {
              const active = index === currentModuleState.currentIndex;
              const seen = currentModuleState.visitedStepIds.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  className={styles.stepButton}
                  data-active={active ? "1" : "0"}
                  data-seen={seen ? "1" : "0"}
                  onClick={() => goToStep(index)}
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepCopy}>
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
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={moduleTone(currentModule.id)}>{currentModule.label}</Pill>
                  <Pill tone={kindTone(currentStep.kind)}>{kindLabel(currentStep.kind)}</Pill>
                  {currentStep.deckOrder ? <Pill tone="success">Deck order {currentStep.deckOrder}</Pill> : null}
                </div>
                <div>
                  <p className={styles.stageCount}>Step {currentModuleState.currentIndex + 1} of {currentModule.steps.length}</p>
                  <h3 className={styles.stageTitle}>{currentStep.title}</h3>
                  <p className={styles.stageSummary}>{currentStep.summary}</p>
                </div>
              </div>
            </div>

            {currentStep.actionLine ? (
              <div className={styles.actionBand}>
                <span className={styles.actionIcon}>
                  <HandHeart size={16} />
                </span>
                <div>
                  <p className={styles.sectionLabel}>Do this now</p>
                  <p className={styles.actionText}>{currentStep.actionLine}</p>
                </div>
              </div>
            ) : null}

            <section className={styles.practiceSection}>
              <p className={styles.sectionLabel}>Focused steps</p>
              <div className={styles.practiceList}>
                {currentStep.practice.map((item) => (
                  <div key={item} className={styles.practiceItem}>
                    <span className={styles.practiceDot} />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.evidenceGrid}>
              {currentStep.evidence.map((item) => (
                <div key={`${item.eyebrow}-${item.title}`} className={styles.evidenceCard}>
                  <p className={styles.sectionLabel}>{item.eyebrow}</p>
                  <p className={styles.evidenceTitle}>{item.title}</p>
                  <p className={styles.evidenceDetail}>{item.detail}</p>
                  {item.source ? (
                    <a
                      href={item.source.href}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.sourceLink}
                    >
                      {item.source.label} <ArrowRight size={14} />
                    </a>
                  ) : (
                    <span className={styles.privateSource}>Private to your account</span>
                  )}
                </div>
              ))}
            </section>

            {currentStep.dua ? (
              <div className={styles.duaCard}>
                <div className={styles.duaTopRow}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="neutral">Dua card</Pill>
                    <Pill tone={kindTone(currentStep.kind)}>{kindLabel(currentStep.kind)}</Pill>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setVisibilityPrefs((previous) => ({
                          ...previous,
                          showTransliteration: !previous.showTransliteration,
                        }))}
                      disabled={!currentStepHasTransliteration}
                    >
                      {visibilityPrefs.showTransliteration ? "Hide transliteration" : "Show transliteration"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setVisibilityPrefs((previous) => ({
                          ...previous,
                          showTranslation: !previous.showTranslation,
                        }))}
                    >
                      {visibilityPrefs.showTranslation ? "Hide translation" : "Show translation"}
                    </Button>
                  </div>
                </div>

                {currentStep.dua.arabic ? (
                  <p dir="rtl" className={styles.duaArabic}>
                    {currentStep.dua.arabic}
                  </p>
                ) : null}

                <div className={styles.duaSupportStack}>
                  {visibilityPrefs.showTransliteration && currentStep.dua.transliteration ? (
                    <SupportTextPanel kind="transliteration" className={styles.duaSupportPanel}>
                      {currentStep.dua.transliteration}
                    </SupportTextPanel>
                  ) : null}
                  {visibilityPrefs.showTranslation ? (
                    <SupportTextPanel kind="translation" className={styles.duaSupportPanel}>
                      {currentStep.dua.translation}
                    </SupportTextPanel>
                  ) : null}
                  {!showAnyDuaSupport ? (
                    <div className={styles.duaHiddenNotice}>
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Transliteration and translation hidden.</p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">
                        Use the display controls above when you want them back.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className={styles.counterPanel}>
                  <div>
                    <p className={styles.sectionLabel}>{currentStep.dua.trackerLabel}</p>
                    <p className={styles.counterNote}>{currentStep.dua.trackerNote}</p>
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

            {currentStep.reflectionPrompt ? (
              <div className={styles.reflectionCard}>
                <p className={styles.sectionLabel}>Reflection</p>
                <p>{currentStep.reflectionPrompt}</p>
              </div>
            ) : null}

            <div className={styles.stageActions}>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => goToStep(currentModuleState.currentIndex - 1)}
                disabled={currentModuleState.currentIndex === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              {isLastStep ? (
                <div className="flex flex-wrap items-center gap-2">
                  {nextModule ? (
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => goToModule(nextModule.id)}
                    >
                      Open {nextModule.label} <ArrowRight size={16} />
                    </Button>
                  ) : null}
                  <Button asChild variant="secondary" className="gap-2">
                    <Link href="/quran/read?view=compact">
                      Open Qur&apos;an <BookOpenText size={16} />
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button className="gap-2" onClick={() => goToStep(currentModuleState.currentIndex + 1)}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </Card>
        </main>
      </section>

      {showManager ? (
        <section className={styles.managerShell}>
          <Card className={styles.managerCard}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={styles.sectionLabel}>Private dua manager</p>
                <h3 className={styles.managerTitle}>Add your own dua to {currentModule.label}</h3>
                <p className={styles.managerSubtitle}>
                  Your private duas are stored only under your user and merged into this module&apos;s deck order.
                </p>
              </div>
              <Pill tone={moduleTone(currentModule.id)}>{deckEntries.length} deck items</Pill>
            </div>

            {feedback ? <div className={styles.notice} data-tone="success">{feedback}</div> : null}
            {formError ? <div className={styles.notice} data-tone="danger">{formError}</div> : null}

            {canManageCustomDuas ? (
              <form className={styles.managerForm} onSubmit={submitCustomDua}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Title</span>
                    <input
                      className={styles.fieldInput}
                      value={draft.title}
                      onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Sort number</span>
                    <input
                      type="number"
                      min={1}
                      className={styles.fieldInput}
                      value={draft.sortOrder}
                      onChange={(event) => setDraft((previous) => ({ ...previous, sortOrder: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Arabic</span>
                    <textarea
                      className={styles.fieldTextarea}
                      value={draft.arabic}
                      onChange={(event) => setDraft((previous) => ({ ...previous, arabic: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Transliteration</span>
                    <textarea
                      className={styles.fieldTextarea}
                      value={draft.transliteration}
                      onChange={(event) => setDraft((previous) => ({ ...previous, transliteration: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Translation / personal wording</span>
                    <textarea
                      className={styles.fieldTextarea}
                      value={draft.translation}
                      onChange={(event) => setDraft((previous) => ({ ...previous, translation: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Private note</span>
                    <textarea
                      className={styles.fieldTextarea}
                      value={draft.note}
                      onChange={(event) => setDraft((previous) => ({ ...previous, note: event.target.value }))}
                    />
                  </label>
                </div>

                <div className={styles.managerActions}>
                  <Button type="submit" className="gap-2" loading={savingDraft}>
                    <Save size={14} />
                    {draft.id ? "Update private dua" : "Save private dua"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => resetDraft(currentModule.id, nextSuggestedSortOrder)}
                    disabled={savingDraft}
                  >
                    Clear form
                  </Button>
                </div>
              </form>
            ) : (
              <div className={styles.notice} data-tone="neutral">
                Sign in to save private duas and merge them into this module.
              </div>
            )}
          </Card>

          <Card className={styles.managerCard}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={styles.sectionLabel}>Deck order</p>
                <h3 className={styles.managerTitle}>Control what comes first</h3>
                <p className={styles.managerSubtitle}>
                  Built-in duas and your private duas share one ordered sequence inside this module.
                </p>
              </div>
              <Pill tone="neutral">{currentModule.label}</Pill>
            </div>

            <div className={styles.deckOrderList}>
              {deckEntries.map((entry) => {
                const key = draftKey(currentModule.id, entry.itemKey);
                return (
                  <div key={key} className={styles.deckOrderRow}>
                    <label className={styles.orderField}>
                      <span className={styles.fieldLabel}>Order</span>
                      <input
                        type="number"
                        min={1}
                        className={styles.fieldInput}
                        value={orderDrafts[key] ?? String(entry.sortOrder)}
                        onChange={(event) =>
                          setOrderDrafts((previous) => ({
                            ...previous,
                            [key]: event.target.value,
                          }))}
                      />
                    </label>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={styles.deckOrderTitle}>{entry.title}</p>
                        <Pill tone={kindTone(entry.kind)}>{kindLabel(entry.kind)}</Pill>
                      </div>
                      <p className={styles.deckOrderSummary}>{entry.summary}</p>
                    </div>

                    <div className={styles.deckActions}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        loading={savingOrderKey === entry.itemKey}
                        onClick={() => updateDeckOrder(entry.itemKey, orderDrafts[key] ?? String(entry.sortOrder))}
                      >
                        <Save size={14} />
                        Save
                      </Button>

                      {entry.customId ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2"
                            onClick={() => populateDraftFromCustom(entry.customId)}
                          >
                            <PencilLine size={14} />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="gap-2"
                            loading={deletingCustomId === entry.customId}
                            onClick={() => {
                              if (entry.customId) {
                                removeCustomDua(entry.customId);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateDeckOrder(entry.itemKey, String(entry.sortOrder), { reset: true })}
                          disabled={savingOrderKey === entry.itemKey}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
