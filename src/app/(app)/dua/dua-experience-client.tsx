"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  CloudRain,
  HandHeart,
  Heart,
  HeartPulse,
  Minus,
  MoonStar,
  PencilLine,
  Plus,
  RefreshCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { SupportTextPanel } from "@/components/quran/support-text-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DisclosureCard } from "@/components/ui/disclosure-card";
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
const DEFAULT_VISIBILITY_PREFS: DuaVisibilityPrefs = {
  showTransliteration: false,
  showTranslation: true,
};

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
  if (moduleId === "laylat-al-qadr") {
    return MoonStar;
  }
  if (moduleId === "beautiful-names") {
    return Sparkles;
  }
  if (moduleId === "wealth") {
    return Coins;
  }
  if (moduleId === "ruqyah") {
    return Shield;
  }
  if (moduleId === "anxiety-distress") {
    return CloudRain;
  }
  if (moduleId === "istikhara-decisions") {
    return Compass;
  }
  if (moduleId === "healing-shifa") {
    return HeartPulse;
  }
  if (moduleId === "grief-loss") {
    return HandHeart;
  }
  if (moduleId === "family-home") {
    return UsersRound;
  }
  return Heart;
}

function moduleTone(moduleId: DuaModuleId): "accent" | "warn" | "success" {
  if (moduleId === "laylat-al-qadr") {
    return "accent";
  }
  if (moduleId === "beautiful-names") {
    return "success";
  }
  if (moduleId === "wealth") {
    return "success";
  }
  if (moduleId === "ruqyah") {
    return "accent";
  }
  if (moduleId === "healing-shifa" || moduleId === "family-home") {
    return "success";
  }
  if (moduleId === "istikhara-decisions") {
    return "accent";
  }
  return "warn";
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
    return "Personal dua";
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
  const currentModuleId =
    modules.find((journeyModule) => journeyModule.id === DEFAULT_DUA_MODULE_ID)?.id ??
    modules[0]?.id ??
    DEFAULT_DUA_MODULE_ID;
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
    return DEFAULT_VISIBILITY_PREFS;
  }
  try {
    const raw = window.localStorage.getItem(DUA_VISIBILITY_KEY);
    if (!raw) {
      return DEFAULT_VISIBILITY_PREFS;
    }
    const parsed = JSON.parse(raw) as Partial<DuaVisibilityPrefs>;
    return {
      showTransliteration:
        typeof parsed.showTransliteration === "boolean"
          ? parsed.showTransliteration
          : DEFAULT_VISIBILITY_PREFS.showTransliteration,
      showTranslation:
        typeof parsed.showTranslation === "boolean"
          ? parsed.showTranslation
          : DEFAULT_VISIBILITY_PREFS.showTranslation,
    };
  } catch {
    return DEFAULT_VISIBILITY_PREFS;
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

function normalizeSearchValue(input: string): string {
  return input.trim().toLowerCase();
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
  const [experienceState, setExperienceState] = useState<SavedState>(() => buildDefaultSavedState(initialModules));
  const [draft, setDraft] = useState<CustomDuaDraft>(emptyDraft(initialModuleId ?? DEFAULT_DUA_MODULE_ID, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingOrderKey, setSavingOrderKey] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [visibilityPrefs, setVisibilityPrefs] = useState<DuaVisibilityPrefs>(DEFAULT_VISIBILITY_PREFS);
  const [stepSearch, setStepSearch] = useState("");
  const [activeStepFilter, setActiveStepFilter] = useState("All");
  const [loadedBrowserPrefs, setLoadedBrowserPrefs] = useState(false);
  const deferredStepSearch = useDeferredValue(stepSearch);

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
    if (loadedBrowserPrefs) {
      return;
    }

    setExperienceState(() => {
      const savedState = loadSavedState(modules);
      if (!initialModuleId) {
        return savedState;
      }
      return {
        ...savedState,
        currentModuleId: initialModuleId,
      };
    });
    setVisibilityPrefs(loadVisibilityPrefs());
    setLoadedBrowserPrefs(true);
  }, [initialModuleId, loadedBrowserPrefs, modules]);

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
    if (!loadedBrowserPrefs || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experienceState));
  }, [experienceState, loadedBrowserPrefs]);

  useEffect(() => {
    if (!loadedBrowserPrefs || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DUA_VISIBILITY_KEY, JSON.stringify(visibilityPrefs));
  }, [loadedBrowserPrefs, visibilityPrefs]);

  const resolvedModuleId = initialModuleId ?? experienceState.currentModuleId;
  const currentModule = modules.find((journeyModule) => journeyModule.id === resolvedModuleId) ?? modules[0];
  const currentModuleState =
    (currentModule && experienceState.moduleState[currentModule.id]) ||
    (currentModule ? buildDefaultModuleProgress(currentModule) : { currentIndex: 0, repetitionCounts: {}, visitedStepIds: [] });
  const isNamesModule = currentModule?.id === "beautiful-names";

  const availableStepFilters = useMemo(() => {
    if (!currentModule || !isNamesModule) {
      return ["All"];
    }

    const filters = ["All"];
    const seen = new Set(filters);
    for (const step of currentModule.steps) {
      const nextFilter = step.spotlight?.category ?? "Method";
      if (seen.has(nextFilter)) {
        continue;
      }
      seen.add(nextFilter);
      filters.push(nextFilter);
    }
    return filters;
  }, [currentModule, isNamesModule]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experienceState));
    }
  }, [experienceState]);

  const hasNamesFilter = isNamesModule && (normalizeSearchValue(stepSearch).length > 0 || activeStepFilter !== "All");
  const matchedStepIndexes = useMemo(() => {
    if (!currentModule || !isNamesModule) {
      return currentModule?.steps.map((_, index) => index) ?? [];
    }

    const search = normalizeSearchValue(deferredStepSearch);
    return currentModule.steps.flatMap((step, index) => {
      const filterLabel = step.spotlight?.category ?? "Method";
      if (activeStepFilter !== "All" && filterLabel !== activeStepFilter) {
        return [];
      }

      const haystack = normalizeSearchValue(
        [
          step.title,
          step.summary,
          step.spotlight?.meaning,
          step.spotlight?.transliteration,
          step.spotlight?.arabic,
          filterLabel,
          ...(step.tags ?? []),
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (search && !haystack.includes(search)) {
        return [];
      }

      return [index];
    });
  }, [activeStepFilter, currentModule, deferredStepSearch, isNamesModule]);

  const visibleStepIndexes = useMemo(() => {
    if (!currentModule) {
      return [];
    }
    if (!isNamesModule) {
      return currentModule.steps.map((_, index) => index);
    }
    if (matchedStepIndexes.length > 0) {
      return matchedStepIndexes;
    }
    if (hasNamesFilter) {
      return [currentModuleState.currentIndex];
    }
    return currentModule.steps.map((_, index) => index);
  }, [currentModule, currentModuleState.currentIndex, hasNamesFilter, isNamesModule, matchedStepIndexes]);

  const currentStepIndex = visibleStepIndexes.includes(currentModuleState.currentIndex)
    ? currentModuleState.currentIndex
    : visibleStepIndexes[0] ?? currentModuleState.currentIndex;
  const currentStep = currentModule?.steps[currentStepIndex] ?? currentModule?.steps[0];

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
    if (isNamesModule) {
      return;
    }
    if (stepSearch || activeStepFilter !== "All") {
      setStepSearch("");
      setActiveStepFilter("All");
    }
  }, [activeStepFilter, isNamesModule, stepSearch]);

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
  const currentVisibleIndex = visibleStepIndexes.indexOf(currentStepIndex);
  const previousStepIndex = currentVisibleIndex > 0 ? visibleStepIndexes[currentVisibleIndex - 1] : null;
  const nextStepIndex =
    currentVisibleIndex >= 0 && currentVisibleIndex < visibleStepIndexes.length - 1
      ? visibleStepIndexes[currentVisibleIndex + 1]
      : null;
  const namesMatchCount = isNamesModule ? matchedStepIndexes.length : visibleStepIndexes.length;
  const namesShowingFallback = isNamesModule && hasNamesFilter && matchedStepIndexes.length === 0;
  const practiceCuePreview = currentStep?.actionLine ?? currentStep?.practice[0] ?? "Return gently to this step.";
  const supportSummaryParts = [
    visibilityPrefs.showTransliteration && currentStepHasTransliteration ? "Transliteration on" : null,
    visibilityPrefs.showTranslation ? "Translation on" : null,
    currentStep?.dua ? `${currentRepetitions} reps` : null,
  ].filter(Boolean) as string[];

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

  const syncNamesSelection = useEffectEvent(() => {
    if (!isNamesModule || !currentModule || matchedStepIndexes.length === 0) {
      return;
    }
    if (matchedStepIndexes.includes(currentModuleState.currentIndex)) {
      return;
    }
    const boundedIndex = matchedStepIndexes[0] ?? 0;
    const stepId = currentModule.steps[boundedIndex]?.id;
    setModuleProgress(currentModule.id, (previous) => ({
      ...previous,
      currentIndex: boundedIndex,
      visitedStepIds:
        stepId && !previous.visitedStepIds.includes(stepId)
          ? [...previous.visitedStepIds, stepId]
          : previous.visitedStepIds,
    }));
  });

  useEffect(() => {
    syncNamesSelection();
  }, [currentModule, currentModuleState.currentIndex, isNamesModule, matchedStepIndexes]);

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
    setFeedback("Editing your personal dua.");
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
        throw new Error(data.error || "Unable to save your personal dua.");
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
      setFeedback(draft.id ? "Personal dua updated in this module." : "Personal dua added to this module.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save your personal dua.");
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
        throw new Error(data.error || "Unable to save the module sequence.");
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
      setFeedback(options?.reset ? "Guided step returned to its default place." : "Module sequence updated.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save the module sequence.");
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
      setFeedback("Personal dua removed from this module.");
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
                Choose a module, move one step at a time, and open support only when you need it.
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

          <div className={styles.homePrincipleRow}>
            <span className={styles.metricChip}>Guided first</span>
            <span className={styles.metricChip}>Support on demand</span>
            <span className={styles.metricChip}>Personal duas stay personal</span>
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
                    {journeyModule.supportsCustomDeck ? "Personal space available" : "Guided only"}
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
                    <Button asChild variant="secondary" className="gap-2">
                      <Link href={deckHref(journeyModule.id)}>
                        Personal duas <PencilLine size={16} />
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

  const isLastStep = nextStepIndex === null;
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
        <Card className={`${styles.focusHero} ${styles.managerHero}`}>
          <div className={styles.focusHeroTop}>
            <Button asChild variant="ghost" className="gap-2">
              <Link href={moduleHref(currentModule.id)}>
                <ArrowLeft size={16} />
                Back to module
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
            <h1 className={styles.focusTitle}>Your personal dua space</h1>
            <p className={styles.focusSubtitle}>
              Write your own duas, keep them tied to your account, and place them gently beside this module&apos;s guided sequence.
            </p>
          </div>

          <div className={styles.managerMetaRow}>
            <span className={styles.focusMetaPill}>{deckEntries.length} items in this module</span>
            <span className={styles.focusMetaPill}>Personal to your account</span>
            <span className={styles.focusMetaPill}>Guided path stays intact</span>
          </div>
        </Card>

        <section className={styles.managerShell}>
          <Card className={`${styles.managerCard} ${styles.managerComposerCard}`}>
            <div className={styles.managerTop}>
              <div>
                <p className={styles.sectionLabel}>Personal dua</p>
                <h2 className={styles.managerTitle}>Write something personal for {currentModule.label}</h2>
                <p className={styles.managerSubtitle}>
                  Your own wording, notes, and transliteration stay on your account and can sit beside this module&apos;s guided sequence when that helps you return.
                </p>
              </div>
              <Pill tone={moduleTone(currentModule.id)}>Only you can see this</Pill>
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
                    <span className={styles.fieldLabel}>Translation or your own wording</span>
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
                    {draft.id ? "Update personal dua" : "Save personal dua"}
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
                Sign in to save personal duas in this space.
              </div>
            )}
          </Card>

          <Card className={`${styles.managerCard} ${styles.managerSequenceCard}`}>
            <div className={styles.managerTop}>
              <div>
                <p className={styles.sectionLabel}>Module sequence</p>
                <h2 className={styles.managerTitle}>Choose what comes first</h2>
                <p className={styles.managerSubtitle}>
                  Guided anchors and your personal duas share one quiet sequence inside this module. Adjust only what helps you return.
                </p>
              </div>
              <Pill tone="neutral">{currentModule.label}</Pill>
            </div>

            {!canManageCustomDuas ? (
              <div className={styles.notice} data-tone="neutral">
                Sign in to adjust the sequence for this module.
              </div>
            ) : null}

            <div className={styles.deckOrderList}>
              {deckEntries.map((entry) => {
                const key = draftKey(currentModule.id, entry.itemKey);
                return (
                  <div key={key} className={styles.deckOrderRow}>
                    <div className={styles.deckOrderMain}>
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
                        <div className={styles.deckTitleRow}>
                          <p className={styles.deckOrderTitle}>{entry.title}</p>
                          <Pill tone={kindTone(entry.kind)}>{kindLabel(entry.kind)}</Pill>
                        </div>
                        <p className={styles.deckOrderSummary}>{entry.summary}</p>
                      </div>
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
                  <PencilLine size={16} />
                  Personal duas
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
            Step {currentStepIndex + 1} of {currentModule.steps.length}
          </span>
          <span className={styles.focusMetaPill}>
            Visited {currentProgress?.seen ?? 0} of {currentModule.steps.length}
          </span>
          {isNamesModule ? (
            <span className={styles.focusMetaPill}>
              {namesMatchCount} {namesMatchCount === 1 ? "match" : "matches"}
            </span>
          ) : null}
        </div>
      </Card>

      {isNamesModule ? (
        <Card className={styles.explorerCard}>
          <div className={styles.explorerTop}>
            <div>
              <p className={styles.sectionLabel}>Names explorer</p>
              <p className={styles.toolSummary}>
                Find a name by need, meaning, or transliteration, then move through only the cards that matter right now.
              </p>
            </div>
            <label className={styles.searchField}>
              <span className={styles.fieldLabel}>Find a name</span>
              <input
                type="search"
                className={styles.searchInput}
                value={stepSearch}
                onChange={(event) => setStepSearch(event.target.value)}
                placeholder="Rahman, mercy, forgiveness, guidance..."
              />
            </label>
          </div>

          <div className={styles.filterRow}>
            {availableStepFilters.map((filterLabel) => (
              <button
                key={filterLabel}
                type="button"
                className={styles.filterChip}
                data-active={activeStepFilter === filterLabel ? "1" : "0"}
                onClick={() => {
                  startTransition(() => setActiveStepFilter(filterLabel));
                }}
              >
                {filterLabel}
              </button>
            ))}
          </div>

          {namesShowingFallback ? (
            <div className={styles.notice} data-tone="neutral">
              No name matched that filter. The current card is staying visible so you can reset your search gently.
            </div>
          ) : null}
        </Card>
      ) : null}

      <section className={styles.stepShell}>
        <div className={styles.stepRail}>
          {visibleStepIndexes.map((index) => {
            const step = currentModule.steps[index];
            if (!step) {
              return null;
            }
            const active = index === currentStepIndex;
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
                  {step.spotlight ? <span className={styles.stepArabic}>{step.spotlight.arabic}</span> : null}
                  <span className={styles.stepTitle}>{step.title}</span>
                  {step.spotlight ? <span className={styles.stepMeaning}>{step.spotlight.meaning}</span> : null}
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
              {currentStep.spotlight ? <Pill tone="success">{currentStep.spotlight.anchorType}</Pill> : null}
            </div>
            <div>
              <p className={styles.stageCount}>
                Step {currentStepIndex + 1} of {currentModule.steps.length}
              </p>
              <h2 className={styles.stageTitle}>{currentStep.title}</h2>
              <p className={styles.stageSummary}>{currentStep.summary}</p>
            </div>
          </div>

          {currentStep.spotlight ? (
            <div className={styles.nameCard}>
              <div className={styles.nameCopy}>
                <p dir="rtl" className={styles.nameArabic}>
                  {currentStep.spotlight.arabic}
                </p>
                <div>
                  <p className={styles.sectionLabel}>{currentStep.spotlight.category}</p>
                  <p className={styles.nameMeaning}>{currentStep.spotlight.meaning}</p>
                </div>
              </div>
              <p className={styles.nameTransliteration}>{currentStep.spotlight.transliteration}</p>
            </div>
          ) : null}

          {currentStep.dua ? (
            <div className={styles.duaCard}>
              <div>
                <p className={styles.sectionLabel}>{currentStep.dua.label ?? "Dua"}</p>
                <p className={styles.duaIntro}>
                  {currentStep.dua.intro ?? "Keep the recitation slow and present. Reveal only the support text you actually need."}
                </p>
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

          <div className={styles.stageActions}>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                if (previousStepIndex !== null) {
                  goToStep(previousStepIndex);
                }
              }}
              disabled={previousStepIndex === null}
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
              <Button
                className="gap-2"
                onClick={() => {
                  if (nextStepIndex !== null) {
                    goToStep(nextStepIndex);
                  }
                }}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </Card>

        {currentStep.actionLine || currentStep.practice.length > 0 ? (
          <DisclosureCard
            className={styles.compactCard}
            summary={(
              <div>
                <p className={styles.sectionLabel}>Practice cues</p>
                <p className={styles.compactSummary}>{practiceCuePreview}</p>
              </div>
            )}
          >
            <div className={styles.practiceDisclosureBody}>
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
                <div className={styles.practiceList}>
                  {currentStep.practice.map((item) => (
                    <div key={item} className={styles.practiceItem}>
                      <span className={styles.practiceDot} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </DisclosureCard>
        ) : null}

        {currentStep.dua ? (
          <DisclosureCard
            className={styles.toolCard}
            summary={(
              <div>
                <p className={styles.sectionLabel}>Practice tools</p>
                <p className={styles.compactSummary}>
                  {supportSummaryParts.length > 0
                    ? supportSummaryParts.join(" | ")
                    : "Reveal support copy only when it helps."}
                </p>
              </div>
            )}
          >
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
          </DisclosureCard>
        ) : null}

      </section>
    </div>
  );
}
