"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { useTheme, type AccentPreset, type ThemePreset } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SaveStatus, type SaveStatusState } from "@/components/ui/save-status";

function OptionRow(props: {
  title: string;
  desc: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[1rem] font-medium tracking-[-0.01em] text-[color:var(--kw-ink)]">{props.title}</p>
        <p className="mt-0.5 text-sm leading-6 text-[color:var(--kw-faint)]">{props.desc}</p>
        {props.children ? <div className="mt-4">{props.children}</div> : null}
      </div>
      {props.right ? <div className="shrink-0">{props.right}</div> : null}
    </div>
  );
}

function SelectPill(props: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-full border border-transparent px-4 py-1.5 text-sm font-medium transition-colors duration-200",
        props.selected
          ? "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
          : "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-strong)]",
      ].join(" ")}
    >
      {props.selected ? <Check size={14} /> : null}
      <span>{props.label}</span>
    </button>
  );
}

const THEME_OPTIONS: Array<{
  id: ThemePreset;
  label: string;
  description: string;
  previewClass: string;
}> = [
  {
    id: "standard",
    label: "Standard",
    description: "Default",
    previewClass: "bg-[#f5f5f7]",
  },
  {
    id: "paper",
    label: "Paper",
    description: "Warm",
    previewClass: "bg-[#f6f3ee]",
  },
  {
    id: "noor",
    label: "Noor",
    description: "Cool",
    previewClass: "bg-[#f2f5fa]",
  },
  {
    id: "dawn",
    label: "Dawn",
    description: "Soft",
    previewClass: "bg-[#f9f4ec]",
  },
  {
    id: "rose",
    label: "Rose",
    description: "Rose",
    previewClass: "bg-[#f9f2f4]",
  },
];

const ACCENT_OPTIONS: Array<{ id: AccentPreset; label: string; swatchClass: string }> = [
  { id: "teal", label: "Teal", swatchClass: "bg-[#077567]" },
  { id: "cobalt", label: "Cobalt", swatchClass: "bg-[#0071e3]" },
  { id: "ember", label: "Ember", swatchClass: "bg-[#c43c06]" },
];

function ThemeCard(props: {
  label: string;
  description: string;
  selected: boolean;
  previewClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "w-full rounded-[18px] border p-3 text-left transition-colors duration-200",
        props.selected
          ? "border-[rgba(var(--kw-accent-rgb),1)] bg-[rgba(var(--kw-accent-rgb),0.08)]"
          : "border-transparent bg-[color:var(--kw-fill)] hover:bg-[color:var(--kw-fill-strong)]",
      ].join(" ")}
    >
      <div className={`h-16 rounded-[12px] border border-[color:var(--kw-border)] ${props.previewClass}`} />
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-sm font-medium text-[color:var(--kw-ink)]">{props.label}</p>
          <p className="text-[0.82rem] leading-5 text-[color:var(--kw-faint)]">{props.description}</p>
        </div>
        {props.selected ? (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(var(--kw-accent-rgb),1)] text-white [&_svg]:h-3.5 [&_svg]:w-3.5">
            <Check size={16} />
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function DisplaySettingsPage() {
  const { mode, theme, accent, toggleMode, setTheme, setAccent } = useTheme();
  const mountedRef = useRef(false);
  const revisionRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const [saveState, setSaveState] = useState<SaveStatusState>({ kind: "not-saved" });
  const [sessionExpired, setSessionExpired] = useState(false);

  const saveLatest = useCallback(async () => {
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSessionExpired(false);
    setSaveState({ kind: "saving" });
    try {
      const response = await fetch("/api/profile/display", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          darkMode: mode === "dark",
          themePreset: theme,
          accentPreset: accent,
        }),
        signal: controller.signal,
      });
      if (revision !== revisionRef.current) {
        return;
      }
      if (!response.ok) {
        setSessionExpired(response.status === 401);
        setSaveState({ kind: "error", destination: "account" });
        return;
      }
      setSaveState({ kind: "saved", destination: "account" });
    } catch {
      if (controller.signal.aborted || revision !== revisionRef.current) {
        return;
      }
      setSaveState({ kind: "error", destination: "account" });
    }
  }, [accent, mode, theme]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    setSaveState({ kind: "dirty" });
    const timer = window.setTimeout(() => void saveLatest(), 250);

    return () => window.clearTimeout(timer);
  }, [accent, mode, saveLatest, theme]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title="Display"
        subtitle="Theme and color."
      />

      <div className="flex flex-wrap items-start gap-2">
        <SaveStatus state={saveState} />
        {saveState.kind === "error" ? (
          sessionExpired ? (
            <Button asChild variant="secondary">
              <Link href="/login?redirect_url=%2Fsettings%2Fdisplay">Sign in again</Link>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void saveLatest()}>Retry account save</Button>
          )
        ) : null}
      </div>

      <Card>
        <OptionRow
          title="Mode"
          desc="Light or dark."
          right={(
            <Button variant="secondary" className="gap-2" onClick={() => toggleMode()}>
              {mode === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              {mode === "dark" ? "Dark" : "Light"}
            </Button>
          )}
        />
      </Card>

      <Card>
        <OptionRow
          title="Theme"
          desc="Surface style."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {THEME_OPTIONS.map((option) => (
              <ThemeCard
                key={option.id}
                label={option.label}
                description={option.description}
                previewClass={option.previewClass}
                selected={theme === option.id}
                onClick={() => setTheme(option.id)}
              />
            ))}
          </div>
        </OptionRow>
      </Card>

      <Card>
        <OptionRow
          title="Accent"
          desc="Highlight color."
        >
          <div className="flex flex-wrap gap-2">
            {ACCENT_OPTIONS.map((option) => (
              <SelectPill
                key={option.id}
                label={option.label}
                selected={accent === option.id}
                onClick={() => setAccent(option.id)}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {ACCENT_OPTIONS.map((option) => (
              <div
                key={`${option.id}-swatch`}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--kw-fill)] px-3 py-2 text-sm text-[color:var(--kw-muted)]"
              >
                <span className={`h-3 w-3 rounded-full ${option.swatchClass}`} />
                {option.label}
              </div>
            ))}
          </div>
        </OptionRow>
      </Card>
    </div>
  );
}
