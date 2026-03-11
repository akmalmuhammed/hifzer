"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
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
const DUA_VISIBILITY_KEY = "hifzer.dua.support-copy.v2";

type ModuleProgressState = {
  currentIndex: number;
  repetitionCounts: Record<string, number>;
  visitedStepIds: string[];
};

type SavedState = {
  currentModuleId: DuaModuleId;
  moduleState: Record<string, ModuleProgressState>;
};

type DuaExperienceView = "home" | "experience" | "manage";

type DuaExperienceClientProps = {
  canManageCustomDuas: boolean;
  initialCustomDuas: CustomDuaSnapshot[];
  initialDeckOrders: DuaDeckOrderSnapshot[];
  initialModuleId?: DuaModuleId;
  initialView?: DuaExperienceView;
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
    return "Private dua";
  }
  return "Guided step";
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
  const currentIndex =
    typeof input?.currentIndex === "number" && input.currentIndex >= 0 && input.currentIndex < stepIds.length
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
  const fallback = {
    showTransliteration: false,
    showTranslation: true,
  };
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(DUA_VISIBILITY_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<DuaVisibilityPrefs>;
    return {
      showTransliteration: typeof parsed.showTransliteration === "boolean" ? parsed.showTransliteration : fallback.showTransliteration,
      showTranslation: typeof parsed.showTranslation === "boolean" ? parsed.showTranslation : fallback.showTranslation,
    };
  } catch {
    return fallback;
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

function moduleHref(moduleId: DuaModuleId): string {
  return `/dua/${moduleId}`;
}

function deckHref(moduleId: DuaModuleId): string {
  return `/dua/${moduleId}/deck`;
}

export function DuaExperienceClient({
  canManageCustomDuas,
  initialCustomDuas,
  initialDeckOrders,
  initialModuleId,
  initialView = "home",
}: DuaExperienceClientProps) {
  const initialModules = buildDuaModules({
    customDuas: initialCustomDuas,
    deckOrders: initialDeckOrders,
  });
  const [customDuas, setCustomDuas] = useState(initialCustomDuas);
  const [deckOrders, setDeckOrders] = useState(initialDeckOrders);
  const [experienceState, setExperienceState] = useState<SavedState>(() => loadSavedState(initialModules));
  const [draft, setDraft] = useState<CustomDuaDraft>(emptyDraft(initialModuleId ?? DEFAULT_DUA_MODULE_ID, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingOrderKey, setSavingOrderKey] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [visibilityPrefs, setVisibilityPrefs] = useState<DuaVisibilityPrefs>(loadVisibilityPrefs);
  const [showStudySupport, setShowStudySupport] = useState(false);

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
    if (!initialModuleId) {
      return;
    }
    setExperienceState((previous) =>
      previous.currentModuleId === initialModuleId
        ? previous
        : {
            ...previous,
            currentModuleId: initialModuleId,
          },
    );
  }, [initialModuleId]);

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

  const resolvedModuleId = initialModuleId ?? experienceState.currentModuleId;
  const currentModule = modules.find((journeyModule) => journeyModule.id === resolvedModuleId) ?? modules[0];
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
    if (!currentModule) {
      return;
    }
    setOrderDrafts((previous) => {
      const next: Record<string, string> = { ...previous };
      for (const entry of deckEntries) {
        next[draftKey(currentModule.id, entry.itemKey)] =
          previous[draftKey(currentModule.id, entry.itemKey)] ?? String(entry.sortOrder);
      }
      return next;
    });
  }, [currentModule, deckEntries]);

  useEffect(() => {
    if (!currentModule || draft.id !== null) {
      return;
    }
    setDraft((previous) => ({
      ...previous,
      moduleId: currentModule.id,
      sortOrder: previous.sortOrder || String(nextSuggestedSortOrder),
    }));
  }, [currentModule, draft.id, nextSuggestedSortOrder]);

  useEffect(() => {
    if (initialView !== "experience") {
      return;
    }
    setShowStudySupport(false);
  }, [currentModule?.id, currentModuleState.currentIndex, initialView]);

  const currentRepetitions = currentStep ? currentModuleState.repetitionCounts[currentStep.id] ?? 0 : 0;
  const currentStepHasTransliteration = Boolean(currentStep?.dua?.transliteration?.trim());
  const canManageCurrentModule = Boolean(currentModule?.supportsCustomDeck && canManageCustomDuas);
  const currentProgress = currentModule
    ? moduleProgress.find((entry) => entry.module.id === currentModule.id)
    : null;
  const currentModuleIndex = currentModule ? modules.findIndex((journeyModule) => journeyModule.id === currentModule.id) : -1;
  const nextModule =
    currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1
      ? modules[currentModuleIndex + 1]
      : null;

  function setModuleProgress(moduleId: DuaModuleId, updater: (previous: ModuleProgressState) => ModuleProgressState) {
    setExperienceState((previous) => {
      const journeyModule = modules.find((entry) => entry.id === moduleId);
      if (!journeyModule) {
        return previous;
      }
      const current = previous.moduleState[moduleId] ?? buildDefaultModuleProgress(journeyModule);
      return {
        ...previous,
        currentModuleId: moduleId,
        moduleState: {
          ...previous.moduleState,
          [moduleId]: normalizeModuleProgress(journeyModule, updater(current)),
        },
      };
    });
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
    if (!currentModule) {
      return;
    }
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
  }

  async function submitCustomDua(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageCustomDuas || !currentModule) {
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
    if (!currentModule || !canManageCustomDuas) {
      return;
    }

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
    if (!currentModule || !canManageCustomDuas) {
      return;
    }

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

  if (!currentModule) {
    return null;
  }

  if (initialView === "home") {
    const resumeSeen = currentProgress?.seen ?? 0;

    return (
      <div className={styles.page}>
        <Card className={styles.homeHeroCard}>
          <div className={styles.homeHeroTop}>
            <div>
              <p className={styles.homeEyebrow}>Dua</p>
              <h1 className={styles.homeTitle}>Focused guided dua experiences</h1>
              <p className={styles.homeSubtitle}>
                Choose a module, move one step at a time, open study support only when you need context, and keep
                private dua management separate from the worship flow.
              </p>
            </div>
            <div className={styles.homeActions}>
              <Button asChild className="gap-2">
                <Link href={moduleHref(currentModule.id)}>
                  {resumeSeen > 1 ? `Continue ${currentModule.label}` : `Open ${currentModule.label}`}
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="gap-2">
                <Link href="/quran">
                  Back to Qur&apos;an <BookOpenText size={16} />
                </Link>
              </Button>
            </div>
          </div>

          <div className={styles.principleGrid}>
            <div className={styles.principleCard}>
              <span className={styles.principleIcon}>
                <HandHeart size={16} />
              </span>
              <div>
                <p className={styles.principleTitle}>Guided first</p>
                <p className={styles.principleText}>The main experience stays centered on one current step and one clear action.</p>
              </div>
            </div>
            <div className={styles.principleCard}>
              <span className={styles.principleIcon}>
                <BookOpenText size={16} />
              </span>
              <div>
                <p className={styles.principleTitle}>Study when needed</p>
                <p className={styles.principleText}>Reflection prompts, authenticity notes, and sources stay secondary instead of competing with the dua.</p>
              </div>
            </div>
            <div className={styles.principleCard}>
              <span className={styles.principleIcon}>
                <Sparkles size={16} />
              </span>
              <div>
                <p className={styles.principleTitle}>Private management apart</p>
                <p className={styles.principleText}>Custom duas and deck order live in a dedicated surface so worship mode stays calm.</p>
              </div>
            </div>
          </div>
        </Card>

        <section className={styles.moduleGrid}>
          {moduleProgress.map(({ module: journeyModule, seen, total }) => {
            const Icon = moduleIcon(journeyModule.id);
            const progressWidth = Math.max(0, Math.min(100, Math.round((seen / Math.max(total, 1)) * 100)));
            const isResumeModule = journeyModule.id === currentModule.id;
            return (
              <Card key={journeyModule.id} className={styles.moduleOverviewCard} data-active={isResumeModule ? "1" : "0"}>
                <div className={styles.moduleOverviewTop}>
                  <div className={styles.moduleHeadline}>
                    <span className={styles.moduleIcon} data-tone={moduleTone(journeyModule.id)}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className={styles.moduleEyebrow}>{journeyModule.eyebrow}</p>
                      <h2 className={styles.moduleTitle}>{journeyModule.label}</h2>
                    </div>
                  </div>
                  <span className={styles.moduleCount}>{seen}/{total}</span>
                </div>

                <p className={styles.moduleDescription}>{journeyModule.description}</p>

                <div className={styles.moduleMetaRow}>
                  <span className={styles.metricChip}>Visited {seen} of {total}</span>
                  <span className={styles.metricChip}>
                    {journeyModule.supportsCustomDeck ? "Private deck available" : "Guided only"}
                  </span>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                  <span className={styles.progressFill} style={{ width: `${progressWidth}%` }} />
                </div>

                <div className={styles.moduleOverviewActions}>
                  <Button asChild className="gap-2">
                    <Link href={moduleHref(journeyModule.id)}>
                      {seen > 0 ? "Continue module" : "Start module"} <ArrowRight size={16} />
                    </Link>
                  </Button>
                  {journeyModule.supportsCustomDeck && canManageCustomDuas ? (
                    <Button asChild variant="ghost" className="gap-2">
                      <Link href={deckHref(journeyModule.id)}>
                        Private deck <Sparkles size={16} />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    );
  }

  if (!currentStep) {
    return null;
  }

  const isLastStep = currentModuleState.currentIndex === currentModule.steps.length - 1;
  const hasVisibleDuaCopy = Boolean(
    currentStep.dua &&
      (
        currentStep.dua.arabic?.trim() ||
        (visibilityPrefs.showTransliteration && currentStep.dua.transliteration?.trim()) ||
        (visibilityPrefs.showTranslation && currentStep.dua.translation.trim())
      ),
  );

  if (initialView === "manage") {
    return (
      <div className={styles.page}>
        <Card className={styles.focusHero}>
          <div className={styles.focusHeroTop}>
            <Button asChild variant="ghost" className="gap-2">
              <Link href={moduleHref(currentModule.id)}>
                <ArrowLeft size={16} />
                Back to experience
              </Link>
            </Button>
            <div className={styles.focusHeroActions}>
              <Button asChild variant="secondary" className="gap-2">
                <Link href="/dua">All modules</Link>
              </Button>
            </div>
          </div>

          <div>
            <Pill tone={moduleTone(currentModule.id)}>{currentModule.label}</Pill>
            <h1 className={styles.focusTitle}>Private deck management</h1>
            <p className={styles.focusSubtitle}>
              Add your own duas or adjust deck order here so the guided worship experience can stay uncluttered.
            </p>
          </div>

          <div className={styles.focusMetaRow}>
            <span className={styles.focusMetaPill}>{deckEntries.length} deck items</span>
            <span className={styles.focusMetaPill}>Separate from worship mode</span>
          </div>
        </Card>

        <section className={styles.managerShell}>
          <Card className={styles.managerCard}>
            <div className={styles.managerTop}>
              <div>
                <p className={styles.sectionLabel}>Private dua manager</p>
                <h2 className={styles.managerTitle}>Add your own dua to {currentModule.label}</h2>
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
            <div className={styles.managerTop}>
              <div>
                <p className={styles.sectionLabel}>Deck order</p>
                <h2 className={styles.managerTitle}>Control what comes first</h2>
                <p className={styles.managerSubtitle}>
                  Built-in duas and your private duas share one ordered sequence inside this module.
                </p>
              </div>
              <Pill tone="neutral">{currentModule.label}</Pill>
            </div>

            {!canManageCustomDuas ? (
              <div className={styles.notice} data-tone="neutral">
                Sign in to edit deck order for this module.
              </div>
            ) : null}

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
                        disabled={!canManageCustomDuas}
                      />
                    </label>

                    <div className={styles.deckBody}>
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
                        disabled={!canManageCustomDuas}
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
                            disabled={!canManageCustomDuas}
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
                            disabled={!canManageCustomDuas}
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
                          disabled={!canManageCustomDuas || savingOrderKey === entry.itemKey}
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
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card className={styles.focusHero}>
        <div className={styles.focusHeroTop}>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/dua">
              <ArrowLeft size={16} />
              All modules
            </Link>
          </Button>
          <div className={styles.focusHeroActions}>
            {canManageCurrentModule ? (
              <Button asChild variant="secondary" className="gap-2">
                <Link href={deckHref(currentModule.id)}>
                  <Sparkles size={16} />
                  Private deck
                </Link>
              </Button>
            ) : null}
            <Button variant="secondary" className="gap-2" onClick={resetCurrentModule}>
              Reset progress <RefreshCcw size={16} />
            </Button>
          </div>
        </div>

        <div>
          <Pill tone={moduleTone(currentModule.id)}>{currentModule.label}</Pill>
          <h1 className={styles.focusTitle}>{currentModule.title}</h1>
          <p className={styles.focusSubtitle}>{currentModule.subtitle}</p>
        </div>

        <div className={styles.focusMetaRow}>
          <span className={styles.focusMetaPill}>
            Step {currentModuleState.currentIndex + 1} of {currentModule.steps.length}
          </span>
          <span className={styles.focusMetaPill}>
            Visited {currentProgress?.seen ?? 0} of {currentModule.steps.length}
          </span>
          <button
            type="button"
            className={styles.focusMetaPill}
            data-interactive="1"
            onClick={() => setShowStudySupport((previous) => !previous)}
          >
            {showStudySupport ? "Hide study support" : "Open study support"}
          </button>
        </div>
      </Card>

      <section className={styles.stepShell}>
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
      </section>

      <section className={styles.focusStage}>
        <Card className={styles.stageCard}>
          <div className={styles.stageHeader}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={kindTone(currentStep.kind)}>{kindLabel(currentStep.kind)}</Pill>
            </div>
            <div>
              <p className={styles.stageCount}>
                Step {currentModuleState.currentIndex + 1} of {currentModule.steps.length}
              </p>
              <h2 className={styles.stageTitle}>{currentStep.title}</h2>
              <p className={styles.stageSummary}>{currentStep.summary}</p>
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

          {currentStep.dua ? (
            <div className={styles.duaCard}>
              <div>
                <p className={styles.sectionLabel}>Dua</p>
                <p className={styles.duaIntro}>Keep the recitation slow and present. Reveal only the support text you actually need.</p>
              </div>

              {currentStep.dua.arabic ? (
                <p dir="rtl" className={styles.duaArabic}>
                  {currentStep.dua.arabic}
                </p>
              ) : null}

              {hasVisibleDuaCopy ? (
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
                </div>
              ) : (
                <div className={styles.notice} data-tone="neutral">
                  Focus mode is hiding support text right now. Use Practice tools below if you want translation or transliteration back.
                </div>
              )}
            </div>
          ) : null}

          <section className={styles.practiceSection}>
            <p className={styles.sectionLabel}>Stay with this step</p>
            <div className={styles.practiceList}>
              {currentStep.practice.map((item) => (
                <div key={item} className={styles.practiceItem}>
                  <span className={styles.practiceDot} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

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
              <div className={styles.actionCluster}>
                {nextModule ? (
                  <Button asChild variant="secondary" className="gap-2">
                    <Link href={moduleHref(nextModule.id)}>
                      Open {nextModule.label} <ArrowRight size={16} />
                    </Link>
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

        {currentStep.dua ? (
          <Card className={styles.toolCard}>
            <div className={styles.toolTop}>
              <div>
                <p className={styles.sectionLabel}>Practice tools</p>
                <p className={styles.toolSummary}>
                  Keep the main experience simple, then reveal support copy or use a light repetition counter only when it helps.
                </p>
              </div>
            </div>

            <div className={styles.toolActions}>
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
          </Card>
        ) : null}

        <Card className={styles.studyCard}>
          <div className={styles.studyTop}>
            <div>
              <p className={styles.sectionLabel}>Study support</p>
              <h3 className={styles.studyTitle}>Why this step is here</h3>
              <p className={styles.studySummary}>
                Sources, reflection, and authenticity notes stay secondary so the current step can stay primary.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowStudySupport((previous) => !previous)}>
              {showStudySupport ? "Hide" : "Open"}
            </Button>
          </div>

          {showStudySupport ? (
            <div className={styles.supportGrid}>
              <div className={styles.contextNotice}>
                <span className={styles.boundaryIcon}>
                  <CircleAlert size={16} />
                </span>
                <p>{currentModule.authenticityBoundary}</p>
              </div>

              {currentStep.reflectionPrompt ? (
                <section className={styles.reflectionCard}>
                  <p className={styles.sectionLabel}>Reflection</p>
                  <p>{currentStep.reflectionPrompt}</p>
                </section>
              ) : null}

              <section className={styles.evidenceSection}>
                <p className={styles.sectionLabel}>Verified anchors</p>
                <div className={styles.evidenceList}>
                  {currentStep.evidence.map((item) => (
                    <div key={`${item.eyebrow}-${item.title}`} className={styles.evidenceItem}>
                      <div className={styles.evidenceBody}>
                        <p className={styles.sectionLabel}>{item.eyebrow}</p>
                        <p className={styles.evidenceTitle}>{item.title}</p>
                        <p className={styles.evidenceDetail}>{item.detail}</p>
                      </div>
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
                </div>
              </section>
            </div>
          ) : (
            <p className={styles.studyClosed}>
              Keep the page centered on worship. Open study support when you want authenticity notes, reflection, or sources.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
