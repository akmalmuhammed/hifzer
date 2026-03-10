"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Headphones, Music4 } from "lucide-react";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { RECITER_OPTIONS, getReciterLabel, normalizeReciterId } from "@/hifzer/audio/reciters";

type ReciterSettingsClientProps = {
  initialReciterId: string;
  audioConfigured: boolean;
};

export function ReciterSettingsClient(props: ReciterSettingsClientProps) {
  const { pushToast } = useToast();
  const [reciterId, setReciterId] = useState(() => normalizeReciterId(props.initialReciterId));
  const [saving, setSaving] = useState(false);
  const selectedLabel = useMemo(() => getReciterLabel(reciterId), [reciterId]);

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
      <PageHeader
        eyebrow="Settings"
        title="Reciter"
        subtitle="Choose the voice used across the Qur'an reader and Hifz sessions. Keep one consistent reciter when you want a steadier listening memory."
      />

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[rgba(var(--kw-accent-rgb),0.14)] blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Active reciter</Pill>
              <Pill tone={props.audioConfigured ? "success" : "warn"}>
                {props.audioConfigured ? "Audio configured" : "Audio base URL missing"}
              </Pill>
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
              {selectedLabel}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Use one voice for reading, listening, and memorization when you want cleaner auditory recall. Switch when you need slower tajweed-focused pacing.
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Choose a reciter</p>
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

          <div className="mt-6 flex justify-end">
            <Button className="gap-2" loading={saving} onClick={save}>
              Save reciter <ArrowRight size={16} />
            </Button>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Preview</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Ayah 1 is used as a quick preview. If a reciter folder is not uploaded in your audio bucket, playback will fail cleanly and you can switch back.
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
