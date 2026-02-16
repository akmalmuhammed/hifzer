"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { DEMO } from "@/demo/data";
import type { ID, Team } from "@/demo/types";
import { useDemoAuth } from "@/demo/demo-auth";

const STORAGE_KEY = "kw_demo_team_v1";

type TeamContextValue = {
  teams: Team[];
  activeTeam: Team;
  activeTeamId: ID;
  setActiveTeamId: (teamId: ID) => void;
};

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

function readStoredTeamId(): ID | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && raw.trim().length > 0 ? raw : null;
}

function writeStoredTeamId(teamId: ID | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!teamId) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, teamId);
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useDemoAuth();
  const allowedTeams = useMemo(() => {
    if (!user) {
      return [];
    }
    const allowed = new Set(user.teamIds);
    return DEMO.teams.filter((t) => allowed.has(t.id));
  }, [user]);

  const [requestedTeamId, setRequestedTeamId] = useState<ID>(() => {
    const stored = readStoredTeamId();
    return stored ?? (DEMO.teams[0]?.id ?? "team_northstar");
  });

  const safeTeams = allowedTeams.length ? allowedTeams : DEMO.teams;
  const active =
    safeTeams.find((t) => t.id === requestedTeamId) ??
    (user ? safeTeams.find((t) => t.id === user.defaultTeamId) : null) ??
    safeTeams[0]!;

  const value: TeamContextValue = {
    teams: safeTeams,
    activeTeam: active,
    activeTeamId: active.id,
    setActiveTeamId: (teamId) => {
      setRequestedTeamId(teamId);
      writeStoredTeamId(teamId);
    },
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return ctx;
}
