"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { BookmarkSyncAgent } from "@/components/bookmarks/bookmark-sync-agent";
import {
  ProfileHydrator,
  type ProfileHydrationState,
} from "@/components/providers/profile-hydrator";
import type { ProfileSnapshot } from "@/hifzer/profile/server";

const FALLBACK_DELAY_MS = 1200;

type ProfileSnapshotPayload = {
  ok: true;
  profile: ProfileSnapshot | null;
};

const UNRESOLVED_PROFILE_STATE: ProfileHydrationState = { status: "unresolved" };

export function AppShellSideEffects(props: { disabled?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [profileState, setProfileState] = useState<ProfileHydrationState>(UNRESOLVED_PROFILE_STATE);

  useEffect(() => {
    if (props.disabled) {
      setEnabled(false);
      setProfileState(UNRESOLVED_PROFILE_STATE);
      return;
    }

    let timeoutId: number | null = null;
    let idleHandle: number | null = null;

    const enable = () => {
      setEnabled(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(enable, { timeout: FALLBACK_DELAY_MS });
    } else {
      timeoutId = window.setTimeout(enable, FALLBACK_DELAY_MS);
    }

    return () => {
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
      if (idleHandle != null) {
        window.cancelIdleCallback?.(idleHandle);
      }
    };
  }, [props.disabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let active = true;
    // Never let an earlier identity resolution hydrate state while a new
    // snapshot request is still outstanding.
    setProfileState(UNRESOLVED_PROFILE_STATE);

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile/snapshot", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await res.json().catch(() => null)) as (ProfileSnapshotPayload & { error?: string }) | null;
        if (!res.ok) {
          // Unlike a missing/failed profile lookup, 401 is an explicit identity
          // result and is safe to treat as a confirmed sign-out transition.
          if (res.status === 401) {
            if (active) {
              setProfileState({ status: "signed-out" });
            }
            return;
          }
          throw new Error(payload?.error || "Failed to load profile snapshot.");
        }
        if (!active) {
          return;
        }
        if (payload?.profile) {
          setProfileState({ status: "signed-in", profile: payload.profile });
        } else {
          // A successful null profile is used in credentialless/local mode and
          // can also mean profile persistence is unavailable. It is not proof
          // that a previously known user signed out.
          setProfileState(UNRESOLVED_PROFILE_STATE);
        }
      } catch (error) {
        if (controller.signal.aborted || !active) {
          return;
        }
        Sentry.captureException(error, {
          tags: {
            area: "app-shell-side-effects",
            operation: "loadProfileSnapshot",
          },
        });
      }
    };

    void loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <ProfileHydrator state={profileState} />
      <BookmarkSyncAgent />
    </>
  );
}
