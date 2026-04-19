"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { BookmarkSyncAgent } from "@/components/bookmarks/bookmark-sync-agent";
import { ProfileHydrator } from "@/components/providers/profile-hydrator";
import type { ProfileSnapshot } from "@/hifzer/profile/server";

const FALLBACK_DELAY_MS = 1200;

type ProfileSnapshotPayload = {
  ok: true;
  profile: ProfileSnapshot | null;
};

export function AppShellSideEffects() {
  const [enabled, setEnabled] = useState(false);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile/snapshot", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await res.json().catch(() => null)) as (ProfileSnapshotPayload & { error?: string }) | null;
        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load profile snapshot.");
        }
        if (!active) {
          return;
        }
        setProfile(payload?.profile ?? null);
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
      <ProfileHydrator profile={profile} />
      <BookmarkSyncAgent />
    </>
  );
}
