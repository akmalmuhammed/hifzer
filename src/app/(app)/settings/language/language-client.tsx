"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { QURAN_TRANSLATION_OPTIONS, type QuranTranslationId } from "@/hifzer/quran/translation-prefs";

type LanguageSettingsClientProps = {
  initial: {
    quranTranslationId: QuranTranslationId;
  };
  persistEnabled?: boolean;
};

export function LanguageSettingsClient(props: LanguageSettingsClientProps) {
  const { pushToast } = useToast();
  const [quranTranslationId, setQuranTranslationId] = useState<QuranTranslationId>(props.initial.quranTranslationId);
  const [saving, setSaving] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaveWarning(null);
    try {
      const res = await fetch("/api/profile/language", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quranTranslationId }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to save language settings.");
      }
      setSaveWarning(null);
      pushToast({ tone: "success", title: "Saved", message: "Language preference updated." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save language settings.";
      setSaveWarning(message);
      pushToast({
        tone: "warning",
        title: "Save failed",
        message,
      });
    } finally {
      setSaving(false);
    }
  }

  const selected = QURAN_TRANSLATION_OPTIONS.find((option) => option.id === quranTranslationId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Language"
        subtitle="Choose your default translation language for Qur'an reading and session translation UI."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Default translation</p>
            <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
              This preference is saved to your account and follows you across devices.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">{selected?.label ?? "Unknown language"}</Pill>
              <Pill tone="neutral">{selected?.rtl ? "RTL script" : "LTR script"}</Pill>
            </div>
          </div>
        </div>

        <label className="mt-5 block text-sm text-[color:var(--kw-muted)]">
          Language
          <select
            value={quranTranslationId}
            disabled={saving || props.persistEnabled === false}
            onChange={(e) => setQuranTranslationId(e.target.value as QuranTranslationId)}
            className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)] md:max-w-[560px]"
          >
            {QURAN_TRANSLATION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {props.persistEnabled === false ? (
          <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
            Sign in with Clerk to persist this setting per user.
          </p>
        ) : null}
        {saveWarning ? (
          <div className="mt-3 rounded-xl border border-[rgba(234,88,12,0.3)] bg-[rgba(234,88,12,0.08)] px-3 py-2">
            <p className="text-xs font-semibold text-[rgba(234,88,12,0.95)]">
              {saveWarning.startsWith("Persistence unavailable:") ? "Persistence unavailable" : "Save issue"}
            </p>
            <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{saveWarning}</p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button
            className="gap-2"
            loading={saving}
            disabled={props.persistEnabled === false}
            onClick={save}
          >
            Save language <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
