import Link from "next/link";
import { ArrowRight, BookOpenText, Gauge, Sparkles } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Onboarding",
};

export default function OnboardingWelcomePage() {
  return (
    <OnboardingShell
      step="welcome"
      title="Set up a calm first week."
      subtitle="We will shape your study pace, choose your starting point, and open the dashboard with guidance so the app feels ready, not dense."
      backHref="/"
      backLabel="Back home"
      durationHint="Usually about two minutes from start to finish."
      supportTitle="A short setup with real payoff"
      supportBody="We only ask for the decisions that change your first plan and first impression."
      supportPoints={[
        {
          title: "Tailored pace",
          description: "Your daily minutes, cadence, and teacher setup help Hifzer avoid recommending more than you can sustain.",
        },
        {
          title: "Clear starting point",
          description: "You choose the exact surah and ayah to begin from, and you can adjust it later from the dashboard.",
        },
        {
          title: "Guided launch",
          description: "When setup ends, the dashboard opens with a first-run guide so you know what to do next right away.",
        },
      ]}
    >
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Retention first",
              body: "Warmup, review, and seam repair stay visible so progress does not come at the cost of forgetting.",
              icon: <Gauge size={18} />,
              pill: "Plan engine",
            },
            {
              title: "One calm home",
              body: "Hifz, Qur'an reading, dua, and journal all live under the dashboard instead of scattered routes.",
              icon: <BookOpenText size={18} />,
              pill: "Dashboard",
            },
            {
              title: "Simple to adjust",
              body: "Everything you set here is meant to be a starting point, not a trap. You can refine it later.",
              icon: <Sparkles size={18} />,
              pill: "Flexible",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/74 px-5 py-5 shadow-[var(--kw-shadow-soft)]"
            >
              <div className="flex items-center justify-between gap-3">
                <Pill tone="neutral">{item.pill}</Pill>
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
                  {item.icon}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <Pill tone="brand">Quick setup</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Hifzer is designed to feel focused from the first session, so we keep onboarding short and only collect the details that improve your plan.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href="/onboarding/assessment">
              Continue <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </Card>
    </OnboardingShell>
  );
}
