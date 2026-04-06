"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { useTheme, type AccentPreset, type ThemePreset } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function OptionRow(props: {
  title: string;
  desc: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{props.title}</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{props.desc}</p>
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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        props.selected
          ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
          : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-card)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-card-strong)]",
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
    description: "Balanced glass surfaces with the core Hifzer atmosphere.",
    previewClass: "from-[#dff7f1] via-[#eef2ff] to-[#fff4e5]",
  },
  {
    id: "paper",
    label: "Paper",
    description: "Warmer parchment tones for a softer reading feel.",
    previewClass: "from-[#fff8ef] via-[#fffaf6] to-[#f5efe8]",
  },
  {
    id: "noor",
    label: "Noor",
    description: "Cool luminous blues and teals with a calmer night-glow edge.",
    previewClass: "from-[#e1f5ff] via-[#eff6ff] to-[#dff7f1]",
  },
  {
    id: "dawn",
    label: "Dawn",
    description: "A sunrise mix of sand, gold, and early-sky warmth.",
    previewClass: "from-[#fff1d8] via-[#fff8ef] to-[#ffe4c7]",
  },
  {
    id: "rose",
    label: "Rose",
    description: "A pink-tinted gradient with a softer devotional mood.",
    previewClass: "from-[#ffe0ea] via-[#fff1f5] to-[#f7e8ff]",
  },
];

const ACCENT_OPTIONS: Array<{ id: AccentPreset; label: string; swatchClass: string }> = [
  { id: "teal", label: "Teal", swatchClass: "bg-[#0a8a77]" },
  { id: "cobalt", label: "Cobalt", swatchClass: "bg-[#2b4bff]" },
  { id: "ember", label: "Ember", swatchClass: "bg-[#ea580c]" },
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
        "w-full rounded-[22px] border p-3 text-left transition",
        props.selected
          ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.08)] shadow-[var(--kw-shadow-soft)]"
          : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] hover:bg-[color:var(--kw-surface)]",
      ].join(" ")}
    >
      <div className={`h-16 rounded-[18px] bg-gradient-to-br ${props.previewClass}`} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{props.label}</p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{props.description}</p>
        </div>
        {props.selected ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]">
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

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      fetch("/api/profile/display", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          darkMode: mode === "dark",
          themePreset: theme,
          accentPreset: accent,
        }),
      }).catch(() => {
        // Keep the local preference even if persistence fails.
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [accent, mode, theme]);

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title="Display"
        subtitle="Choose the mood, color, and contrast that make daily recitation easier to return to."
      />

      <Card>
        <OptionRow
          title="Mode"
          desc="Switch between light and dark while keeping the Qur'an script untouched."
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
          desc="These presets reshape the gradients and surface feel without changing the Qur'an font."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
          desc="Pick the color used for highlights, active states, and calls to action."
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
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-2 text-sm text-[color:var(--kw-muted)]"
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
