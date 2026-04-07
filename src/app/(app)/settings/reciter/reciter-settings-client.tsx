"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Headphones, Music4, RadioTower } from "lucide-react";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import {
  AUDIO_PLAYBACK_MODE_OPTIONS,
  normalizeAudioPlaybackMode,
  persistAudioPlaybackMode,
  readPersistedAudioPlaybackMode,
  type AudioPlaybackMode,
} from "@/hifzer/audio/playback-mode";
import {
  RECITER_OPTIONS,
  encodeQuranFoundationReciterId,
  getReciterLabel,
  parseQuranFoundationReciterId,
  normalizeReciterId,
} from "@/hifzer/audio/reciters";

type RemoteReciter = {
  id: number;
  label: string;
  translatedName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
  style: string | null;
  description: string;
  matchTokens: string[];
};

type RemoteCatalog = {
  status: "available" | "not_configured" | "degraded";
  detail: string;
  recitations: RemoteReciter[];
};

type ReciterSettingsClientProps = {
  initialReciterId: string;
  audioConfigured: boolean;
  remoteCatalog: RemoteCatalog;
};

type ReciterChoice = {
  id: string;
  label: string;
  description: string;
  provider: "local" | "quran_foundation";
};

function buildRemoteReciterChoices(catalog: RemoteCatalog): ReciterChoice[] {
  if (catalog.status !== "available") {
    return [];
  }
  return catalog.recitations.map((recitation) => ({
    id: encodeQuranFoundationReciterId(recitation.id),
    label: recitation.label,
    description:
      [recitation.style, recitation.languageName, "Official Quran.com stream"].filter(Boolean).join(" · ") ||
      "Official Quran.com stream",
    provider: "quran_foundation",
  }));
}

export function ReciterSettingsClient(props: ReciterSettingsClientProps) {
  const { pushToast } = useToast();
  const [reciterId, setReciterId] = useState(() => normalizeReciterId(props.initialReciterId));
  const [playbackMode, setPlaybackMode] = useState<AudioPlaybackMode>(() => readPersistedAudioPlaybackMode());
  const [saving, setSaving] = useState(false);

  const remoteChoices = useMemo(() => buildRemoteReciterChoices(props.remoteCatalog), [props.remoteCatalog]);
  const allChoices = useMemo(() => [...RECITER_OPTIONS.map((option) => ({ ...option, provider: "local" as const })), ...remoteChoices], [remoteChoices]);
  const selectedChoice = useMemo(() => allChoices.find((option) => option.id === reciterId) ?? null, [allChoices, reciterId]);
  const selectedLabel = selectedChoice?.label ?? getReciterLabel(reciterId);
  const selectedReciterNeedsQuran = parseQuranFoundationReciterId(reciterId) != null;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/reciter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reciterId }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to save reciter.");
      }
      persistAudioPlaybackMode(playbackMode);
      pushToast({
        tone: "success",
        title: "Saved",
        message: `${selectedLabel} is now your default reciter, and ${AUDIO_PLAYBACK_MODE_OPTIONS.find((option) => option.id === playbackMode)?.label ?? "Auto"} audio mode is active on this device.`,
      });
    } catch (error) {
      pushToast({
        tone: "warning",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Failed to save reciter.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title="Reciter"
        subtitle="Default reciter and audio source."
      />

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[rgba(var(--kw-accent-rgb),0.14)] blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Active reciter</Pill>
              <Pill tone={props.audioConfigured ? "success" : "warn"}>
                {props.audioConfigured ? "Local audio configured" : "Local audio base URL missing"}
              </Pill>
              <Pill tone={props.remoteCatalog.status === "available" ? "success" : "neutral"}>
                {props.remoteCatalog.status === "available" ? "Quran.com catalog ready" : "Quran.com catalog unavailable"}
              </Pill>
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
              {selectedLabel}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Used across the reader and Hifz.
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[color:var(--kw-border-2)] kw-surface-gradient text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <Music4 size={18} />
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <Card>
          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] kw-surface-gradient-soft px-4 py-4">
            <div className="flex items-center gap-2">
              <RadioTower size={16} className="text-[color:var(--kw-faint)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Audio route</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Choose local or Quran.com audio for this device.
            </p>
            <div className="mt-4 grid gap-3">
              {AUDIO_PLAYBACK_MODE_OPTIONS.map((option) => {
                const active = playbackMode === option.id;
                const quranModeUnavailable =
                  option.id === "quran_foundation_first" && props.remoteCatalog.status !== "available";
                const disabled = quranModeUnavailable;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const nextMode = normalizeAudioPlaybackMode(option.id);
                      setPlaybackMode(nextMode);
                      persistAudioPlaybackMode(nextMode);
                    }}
                    className={[
                      "rounded-[22px] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      active
                        ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                        : "border-[color:var(--kw-border-2)] kw-surface-gradient hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.label}</p>
                          {quranModeUnavailable ? <Pill tone="neutral">API unavailable</Pill> : null}
                        </div>
                        <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">{option.description}</p>
                      </div>
                      {active ? <Pill tone="accent">Selected</Pill> : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 text-xs leading-6 text-[color:var(--kw-faint)]">
              <p>Official Quran.com reciters always stream from Quran.com.</p>
              {selectedReciterNeedsQuran ? (
                <p>This selected reciter uses Quran.com audio.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Headphones size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Hifzer local voices</p>
          </div>
          <div className="mt-4 grid gap-3">
            {RECITER_OPTIONS.map((option) => {
              const active = reciterId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setReciterId(option.id)}
                  className={[
                    "rounded-[22px] border px-4 py-4 text-left transition",
                    active
                      ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                      : "border-[color:var(--kw-border-2)] kw-surface-gradient hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.label}</p>
                      <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">{option.description}</p>
                    </div>
                    {active ? <Pill tone="accent">Selected</Pill> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-[color:var(--kw-border-2)] pt-6">
            <div className="flex items-center gap-2">
              <RadioTower size={16} className="text-[color:var(--kw-faint)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Official Quran.com catalog
              </p>
            </div>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{props.remoteCatalog.detail}</p>
            {remoteChoices.length ? (
              <div className="mt-4 grid gap-3">
                {remoteChoices.map((option) => {
                  const active = reciterId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setReciterId(option.id)}
                      className={[
                        "rounded-[22px] border px-4 py-4 text-left transition",
                        active
                          ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                          : "border-[color:var(--kw-border-2)] kw-surface-gradient hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.label}</p>
                            <Pill tone="neutral">Quran.com</Pill>
                          </div>
                          <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">{option.description}</p>
                        </div>
                        {active ? <Pill tone="accent">Selected</Pill> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-[color:var(--kw-border-2)] kw-surface-gradient-soft px-4 py-4 text-sm leading-7 text-[color:var(--kw-muted)]">
                Local Hifzer voices are available now. Quran.com voices will appear here when the catalog is reachable.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="gap-2" loading={saving} onClick={save}>
              Save reciter <ArrowRight size={16} />
            </Button>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Preview</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Ayah 1 preview.
          </p>
          <div className="mt-4">
            <AyahAudioPlayer ayahId={1} reciterId={reciterId} playbackMode={playbackMode} />
          </div>
        </Card>
      </div>
    </div>
  );
}
