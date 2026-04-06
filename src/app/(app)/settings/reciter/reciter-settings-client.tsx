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
  RECITER_OPTIONS,
  encodeQuranFoundationReciterId,
  getReciterLabel,
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
  const [saving, setSaving] = useState(false);

  const remoteChoices = useMemo(() => buildRemoteReciterChoices(props.remoteCatalog), [props.remoteCatalog]);
  const allChoices = useMemo(() => [...RECITER_OPTIONS.map((option) => ({ ...option, provider: "local" as const })), ...remoteChoices], [remoteChoices]);
  const selectedChoice = useMemo(() => allChoices.find((option) => option.id === reciterId) ?? null, [allChoices, reciterId]);
  const selectedLabel = selectedChoice?.label ?? getReciterLabel(reciterId);

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
      pushToast({
        tone: "success",
        title: "Saved",
        message: `${selectedLabel} is now your default reciter.`,
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
        subtitle="Choose the voice used across the Qur'an reader and Hifz sessions. Hifzer keeps your local audio library first, then can fall back to official Quran.com streams when a remote reciter is selected or a local file is missing."
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
              Use one voice for reading, listening, and memorization when you want cleaner auditory recall. Switch when you need slower tajweed-focused pacing or a different official Quran.com voice.
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <Music4 size={18} />
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <Card>
          <div className="flex items-center gap-2">
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
                      : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
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
                          : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
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
              <div className="mt-4 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/60 px-4 py-4 text-sm leading-7 text-[color:var(--kw-muted)]">
                Keep the local Hifzer voices for now. Once Quran.com enrichment is reachable, the full official catalog will appear here automatically.
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
            Ayah 1 is used as a quick preview. Hifzer plays local audio first, then falls back to official Quran.com audio when you pick a remote reciter or when a local file is missing.
          </p>
          <div className="mt-4">
            <AyahAudioPlayer ayahId={1} reciterId={reciterId} />
          </div>
          <div className="mt-4 space-y-2 text-xs leading-6 text-[color:var(--kw-faint)]">
            <p>Best practice: keep one reciter for your daily reading loop and your memorization loop.</p>
            <p>For slower tajweed-sensitive listening, try a more measured voice during review or fluency work.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
