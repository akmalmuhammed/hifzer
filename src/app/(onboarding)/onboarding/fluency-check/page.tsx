import Link from "next/link";
import { ArrowRight, Headphones, Link2, Mic, UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Fluency Check",
};

export default function OnboardingFluencyCheckPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Fluency check"
        subtitle="A live recitation test (UI scaffold). Later: mic capture + AI feedback."
        right={
          <Link href="/onboarding/complete">
            <Button variant="secondary" className="gap-2">
              Skip for now <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Pill tone="accent">Self-check</Pill>
            <span className="text-xs text-[color:var(--kw-faint)]">No microphone required yet</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "I read comfortably",
                body: "You can continue into the main app and let Hifz plus normal reading guide the next step.",
                href: "/onboarding/complete",
                icon: <UserRoundCheck size={18} />,
              },
              {
                title: "I need guided fluency work",
                body: "Start with fluency lessons before pushing harder on memorization.",
                href: "/fluency",
                icon: <Mic size={18} />,
              },
              {
                title: "I learn better by listening first",
                body: "Use compact reader audio with repeats and a steady reciter before heavy recall work.",
                href: "/fluency/lesson/listen-repeat",
                icon: <Headphones size={18} />,
              },
              {
                title: "My main weakness is the join between ayahs",
                body: "Open seam-focused practice so transitions become smoother, not just isolated ayahs.",
                href: "/fluency/lesson/transitions",
                icon: <Link2 size={18} />,
              },
            ].map((option) => (
              <Link
                key={option.title}
                href={option.href}
                className="block rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-4 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{option.body}</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
                    {option.icon}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Mic size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">What this screen is doing today</p>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--kw-muted)]">
            <p>It is not pretending to do AI recitation scoring yet.</p>
            <p>Instead, it helps the user choose the right starting path: normal reading, listening-led fluency, hesitation cleanup, or transition repair.</p>
            <p>That is a better honest experience than a fake “check” that cannot really evaluate recitation.</p>
          </div>
          <div className="mt-6">
            <Link href="/onboarding/complete">
              <Button className="gap-2">
                Continue onboarding <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
