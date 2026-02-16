"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEMO } from "@/demo/data";
import type {
  CheckIn,
  DemoData,
  ID,
  Initiative,
  Member,
  MetricSeries,
  OKR,
  Project,
  Ritual,
  Signal,
  Team,
} from "@/demo/types";

const STORAGE_KEY = "kw_demo_store_v1";

export type DemoPreferences = {
  density: "cozy" | "compact";
  weeklyDigest: boolean;
  showWeekendActivity: boolean;
};

type DemoStoreState = {
  // Only store deltas. Base data remains immutable.
  extraCheckInsByOkrId: Record<ID, CheckIn[]>;
  preferences: DemoPreferences;
};

type DemoStoreValue = {
  data: DemoData;
  state: DemoStoreState;
  preferences: DemoPreferences;

  getTeam: (teamId: ID) => Team | null;
  listTeams: () => Team[];
  listMembersForTeam: (teamId: ID) => Member[];
  getMember: (memberId: ID) => Member | null;

  listOkrsForTeam: (teamId: ID) => OKR[];
  getOkr: (okrId: ID) => OKR | null;
  addCheckIn: (params: {
    okrId: ID;
    authorId: ID;
    note: string;
    confidence: number;
  }) => void;

  listInitiativesForTeam: (teamId: ID) => Initiative[];
  listProjectsForTeam: (teamId: ID) => Project[];
  getProject: (projectId: ID) => Project | null;
  listSignalsForTeam: (teamId: ID) => Signal[];
  listSeriesForTeam: (teamId: ID) => MetricSeries[];
  listRitualsForTeam: (teamId: ID) => Ritual[];

  setPreferences: (patch: Partial<DemoPreferences>) => void;
  resetDemo: () => void;
};

const DemoStoreContext = createContext<DemoStoreValue | undefined>(undefined);

const DEFAULT_STATE: DemoStoreState = {
  extraCheckInsByOkrId: {},
  preferences: {
    density: "cozy",
    weeklyDigest: true,
    showWeekendActivity: false,
  },
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStoredState(): DemoStoreState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }
  const parsed = safeJsonParse<DemoStoreState>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed) {
    return DEFAULT_STATE;
  }
  return {
    extraCheckInsByOkrId: parsed.extraCheckInsByOkrId ?? {},
    preferences: {
      ...DEFAULT_STATE.preferences,
      ...(parsed.preferences ?? {}),
    },
  };
}

function writeStoredState(state: DemoStoreState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeOkr(base: OKR, extraCheckIns: CheckIn[] | undefined): OKR {
  if (!extraCheckIns || extraCheckIns.length === 0) {
    return base;
  }
  const merged = [...base.checkIns, ...extraCheckIns].sort((a, b) =>
    a.at < b.at ? 1 : -1,
  );
  return { ...base, checkIns: merged };
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoStoreState>(() => readStoredState());

  useEffect(() => {
    writeStoredState(state);
  }, [state]);

  const value = useMemo<DemoStoreValue>(() => {
    const data = DEMO;

    function getTeam(teamId: ID) {
      return data.teams.find((t) => t.id === teamId) ?? null;
    }

    function listTeams() {
      return data.teams.slice();
    }

    function getMember(memberId: ID) {
      return data.members.find((m) => m.id === memberId) ?? null;
    }

    function listMembersForTeam(teamId: ID) {
      const team = getTeam(teamId);
      if (!team) {
        return [];
      }
      const members = new Map(data.members.map((m) => [m.id, m] as const));
      return team.memberIds.map((id) => members.get(id)).filter(Boolean) as Member[];
    }

    function listOkrsForTeam(teamId: ID) {
      return data.okrs
        .filter((o) => o.teamId === teamId)
        .map((okr) => mergeOkr(okr, state.extraCheckInsByOkrId[okr.id]));
    }

    function getOkr(okrId: ID) {
      const base = data.okrs.find((o) => o.id === okrId);
      return base ? mergeOkr(base, state.extraCheckInsByOkrId[okrId]) : null;
    }

    function addCheckIn(params: { okrId: ID; authorId: ID; note: string; confidence: number }) {
      const trimmed = params.note.trim();
      if (!trimmed) {
        return;
      }
      const confidence = Math.max(0, Math.min(1, params.confidence));
      const checkIn: CheckIn = {
        id: `ci_${params.okrId}_${Date.now()}`,
        at: new Date().toISOString(),
        authorId: params.authorId,
        note: trimmed,
        confidence,
      };
      setState((current) => {
        const existing = current.extraCheckInsByOkrId[params.okrId] ?? [];
        return {
          ...current,
          extraCheckInsByOkrId: {
            ...current.extraCheckInsByOkrId,
            [params.okrId]: [...existing, checkIn],
          },
        };
      });
    }

    function listInitiativesForTeam(teamId: ID) {
      return data.initiatives
        .filter((i) => i.teamId === teamId)
        .slice()
        .sort((a, b) => (a.end < b.end ? -1 : 1));
    }

    function listProjectsForTeam(teamId: ID) {
      return data.projects
        .filter((p) => p.teamId === teamId)
        .slice()
        .sort((a, b) => (a.end < b.end ? -1 : 1));
    }

    function getProject(projectId: ID) {
      return data.projects.find((p) => p.id === projectId) ?? null;
    }

    function listSignalsForTeam(teamId: ID) {
      return data.signals
        .filter((s) => s.teamId === teamId)
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    function listSeriesForTeam(teamId: ID) {
      return data.series.filter((s) => s.teamId === teamId);
    }

    function listRitualsForTeam(teamId: ID) {
      return data.rituals.filter((r) => r.teamId === teamId);
    }

    function setPreferences(patch: Partial<DemoPreferences>) {
      setState((current) => ({
        ...current,
        preferences: {
          ...current.preferences,
          ...patch,
        },
      }));
    }

    function resetDemo() {
      setState(DEFAULT_STATE);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    return {
      data,
      state,
      preferences: state.preferences,
      getTeam,
      listTeams,
      listMembersForTeam,
      getMember,
      listOkrsForTeam,
      getOkr,
      addCheckIn,
      listInitiativesForTeam,
      listProjectsForTeam,
      getProject,
      listSignalsForTeam,
      listSeriesForTeam,
      listRitualsForTeam,
      setPreferences,
      resetDemo,
    };
  }, [state]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return ctx;
}

