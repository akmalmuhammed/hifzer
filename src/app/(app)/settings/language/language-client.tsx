"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { UiLanguageSwitcher } from "@/components/app/ui-language-switcher";
import { useUiLanguage } from "@/components/providers/ui-language-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import {
  buildQuranTranslationCookieValue,
  getQuranTranslationOption,
  QURAN_TRANSLATION_OPTIONS,
  type QuranTranslationId,
} from "@/hifzer/quran/translation-prefs";

type LanguageSettingsClientProps = {
  initial: {
    quranTranslationId: QuranTranslationId;
  };
  persistEnabled?: boolean;
};

export function LanguageSettingsClient(props: LanguageSettingsClientProps) {
  const router = useRouter();
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);
  const { pushToast } = useToast();
  const [quranTranslationId, setQuranTranslationId] = useState<QuranTranslationId>(props.initial.quranTranslationId);
  const [saving, setSaving] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaveWarning(null);
    document.cookie = buildQuranTranslationCookieValue(quranTranslationId);
    try {
      const res = await fetch("/api/profile/language", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quranTranslationId }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || copy.languageSettings.failedToSaveLanguage);
      }
      setSaveWarning(null);
      pushToast({
        tone: "success",
        title: copy.languageSettings.savedTitle,
        message: copy.languageSettings.languagePreferenceUpdated,
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.languageSettings.failedToSaveLanguage;
      setSaveWarning(message);
      pushToast({
        tone: "warning",
        title: copy.languageSettings.saveFailedTitle,
        message,
      });
      if (message.startsWith("Persistence unavailable:")) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const selected = getQuranTranslationOption(quranTranslationId);

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title={copy.languageSettings.title}
        subtitle="Interface and default translation."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[1rem] font-medium tracking-[-0.01em] text-[color:var(--kw-ink)]">{copy.languageSettings.interfaceLanguageTitle}</p>
            <p className="mt-0.5 text-sm leading-6 text-[color:var(--kw-faint)]">
              App language.
            </p>
          </div>
        </div>
        <UiLanguageSwitcher
          className="mt-5 block text-sm text-[color:var(--kw-muted)]"
          label={copy.languageSettings.interfaceLanguageLabel}
        />
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[1rem] font-medium tracking-[-0.01em] text-[color:var(--kw-ink)]">{copy.languageSettings.defaultTranslationTitle}</p>
            <p className="mt-0.5 text-sm leading-6 text-[color:var(--kw-faint)]">
              Reader translation.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">{selected?.label ?? copy.languageSettings.unknownLanguage}</Pill>
              <Pill tone="neutral">{selected?.rtl ? copy.languageSettings.rtlScript : copy.languageSettings.ltrScript}</Pill>
              <Pill tone={selected?.sourceStatus === "verified" ? "accent" : "warn"}>
                {selected?.sourceStatus === "verified" ? "Source verified" : "Source review pending"}
              </Pill>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-6 text-[color:var(--kw-faint)]">
              Source: {selected?.sourceLabel ?? "Unknown"}.
              {selected?.sourceNote ? ` ${selected.sourceNote}` : ""}
            </p>
          </div>
        </div>

        <label className="mt-5 block text-sm text-[color:var(--kw-muted)]">
          {copy.languageSettings.defaultTranslationLabel}
          <select
            value={quranTranslationId}
            disabled={saving || props.persistEnabled === false}
            onChange={(e) => setQuranTranslationId(e.target.value as QuranTranslationId)}
            className="mt-1.5 block h-11 w-full rounded-[12px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3.5 text-[0.94rem] text-[color:var(--kw-ink)] md:max-w-[560px]"
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
            {copy.languageSettings.signInToPersist}
          </p>
        ) : null}
        {saveWarning ? (
          <div className="mt-3 rounded-[12px] bg-[color:var(--kw-pill-warn-bg)] px-3.5 py-2.5">
            <p className="text-xs font-semibold text-[color:var(--kw-ember-600)]">
              {saveWarning.startsWith("Persistence unavailable:")
                ? copy.languageSettings.persistenceUnavailable
                : copy.languageSettings.saveIssue}
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
            {copy.languageSettings.saveLanguage} <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
