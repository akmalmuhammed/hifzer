"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Headphones, Link2, Mic, UserRoundCheck } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getOnboardingStartLane, setOnboardingStartLane, type OnboardingStartLane } from "@/hifzer/local/store";

export const metadata = {
  title: "Fluency Check",
};

export default function OnboardingFluencyCheckPage() {
  const router = useRouter();
  const [selectedLane, setSelectedLane] = useState<OnboardingStartLane>("hifz");

  useEffect(() => {
    const storedLane = getOnboardingStartLane();
    if (!storedLane) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      setSelectedLane(storedLane);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const options: Array<{
    lane: OnboardingStartLane;
    title: string;
    body: string;
    icon: ReactNode;
    note: string;
  }> = [
    {
      lane: "hifz",
      title: "I am ready to start with Hifz",
      body: "Open the main memorization flow first and let review plus guided recall set the pace.",
      note: "Best when your recitation already feels comfortable.",
      icon: <UserRoundCheck size={18} />,
    },
    {
      lane: "fluency",
      title: "I need guided fluency work",
      body: "Start with fluency lessons before you ask yourself to carry more memorization load.",
      note: "A calmer lane when consistency matters more than speed.",
      icon: <Mic size={18} />,
    },
    {
      lane: "listen",
      title: "I learn better by listening first",
      body: "Use listen-and-repeat practice to strengthen pronunciation and rhythm before heavy recall.",
      note: "Good when audio repetition unlocks confidence faster.",
      icon: <Headphones size={18} />,
    },
    {
      lane: "transitions",
      title: "My weakness is ayah transitions",
      body: "Start with seam-focused work so the joins between ayahs stop breaking your flow.",
      note: "Best when isolated ayahs are fine but the connections slip.",
      icon: <Link2 size={18} />,
    },
  ];

  return (
    <OnboardingShell
      step="fluency-check"
      title="Pick the lane that feels right today."
      subtitle="This is a quick self-placement step for now. Instead of pretending to score your recitation automatically, we use your own read on what would help most first."
      backHref="/onboarding/plan-preview"
      supportTitle="Honest guidance beats fake automation"
      supportBody="A clean onboarding flow should be transparent about what the product can do today while still guiding you to a good first step."
      supportPoints={[
        {
          title: "Self-placement first",
          description: "Choose the lane that best matches how your recitation feels right now.",
        },
        {
          title: "Dashboard guidance follows it",
          description: "Your first dashboard guide will highlight the route that matches the lane you pick here.",
        },
        {
          title: "Nothing is permanent",
          description: "You can move between Hifz, fluency, and reading later without redoing onboarding.",
        },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Pill tone="accent">Self-check</Pill>
            <span className="text-xs text-[color:var(--kw-faint)]">Choose one option to shape your first dashboard guide</span>
          </div>
          <div className="mt-4 space-y-3">
            {options.map((option) => {
              const active = option.lane === selectedLane;
              return (
                <button
                  key={option.title}
                  type="button"
                  onClick={() => {
                    setSelectedLane(option.lane);
                    setOnboardingStartLane(option.lane);
                  }}
                  aria-pressed={active}
                  className={[
                    "block w-full rounded-[22px] border px-4 py-4 text-left transition",
                    active
                      ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] shadow-[0_16px_34px_rgba(11,18,32,0.08)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{option.body}</p>
                      <p className="mt-2 text-xs font-medium text-[color:var(--kw-faint)]">{option.note}</p>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
                      {option.icon}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Mic size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">What happens next</p>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--kw-muted)]">
            <p>We store your selected lane locally so the first dashboard guide points you toward the most helpful opening surface.</p>
            <p>The goal is to reduce hesitation after onboarding, not force you into a permanent track.</p>
            <p>Automated recitation scoring can come later. For now, this step stays honest, quick, and useful.</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[color:var(--kw-faint)]">
              Selected lane: <span className="font-semibold text-[color:var(--kw-ink)]">{options.find((item) => item.lane === selectedLane)?.title}</span>
            </p>
            <Button
              className="gap-2"
              onClick={() => {
                setOnboardingStartLane(selectedLane);
                router.push("/onboarding/permissions");
              }}
            >
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </div>
    </OnboardingShell>
  );
}
