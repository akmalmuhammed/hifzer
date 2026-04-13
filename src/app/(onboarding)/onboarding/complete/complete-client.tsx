"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Compass, PlayCircle, Sparkles } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { QuranFoundationConnectCard } from "@/components/quran/quran-foundation-connect-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import {
  getOnboardingStartLane,
  setDashboardFirstRunGuidePending,
  setOnboardingCompleted,
} from "@/hifzer/local/store";
import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

export function OnboardingCompleteClient(props: {
  initialQuranFoundationStatus: QuranFoundationConnectionStatus | null;
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [finishing, setFinishing] = useState(false);

  return (
    <OnboardingShell
      step="complete"
      title="You are ready to begin."
      subtitle="Setup is done. We’ll open the dashboard with a first-run guide so your next click feels obvious instead of overwhelming."
      backHref="/onboarding/permissions"
      supportTitle="What changes after this button"
      supportBody="The dashboard becomes your home base, with Hifz, Qur'an, dua, and journal connected from one calm starting point."
      supportPoints={[
        {
          title: "First-run guide",
          description: "The dashboard will show a welcome guide tied to the lane you chose during onboarding.",
        },
        {
          title: "Saved locally and remotely",
          description: "Completion is stored locally for instant UX, then synced to your profile whenever the API is available.",
        },
        {
          title: "Start small",
          description: "You do not need to use every feature on day one. A clean first Hifz or fluency session is enough.",
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
                Completion is saved locally first for instant UX, then synced to your profile when Clerk and Prisma are available.
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)] shadow-[var(--kw-shadow-soft)]">
              <CheckCircle2 size={18} />
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Open your lane",
                body: "Start with Hifz or the fluency path you selected during setup.",
                icon: <PlayCircle size={18} />,
                pill: "Step 1",
              },
              {
                title: "Use the dashboard",
                body: "Your reading place, reminders, streak, and quick actions now live in one place.",
                icon: <Compass size={18} />,
                pill: "Step 2",
              },
              {
                title: "Adjust as you learn",
                body: "Refine minutes, reminders, and starting points once your routine feels real.",
                icon: <Sparkles size={18} />,
                pill: "Step 3",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/72 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Pill tone="neutral">{item.pill}</Pill>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <QuranFoundationConnectCard
          initialStatus={props.initialQuranFoundationStatus}
          returnTo="/onboarding/complete"
          variant="onboarding"
        />

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <Pill tone="neutral">Final step</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                You can launch the dashboard now whether you linked Quran.com or skipped it for later.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={async () => {
                if (finishing) {
                  return;
                }

                setFinishing(true);
                const onboardingStartLane = getOnboardingStartLane();
                try {
                  const res = await fetch("/api/profile/onboarding-complete", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      ...(onboardingStartLane ? { onboardingStartLane } : {}),
                    }),
                  });
                  const payload = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    throw new Error(payload.error || "Failed to complete onboarding.");
                  }
                } catch (error) {
                  pushToast({
                    title: "Finish onboarding failed",
                    message: error instanceof Error ? error.message : "Failed to complete onboarding.",
                    tone: "warning",
                  });
                  setFinishing(false);
                  return;
                }

                setOnboardingCompleted();
                setDashboardFirstRunGuidePending();
                pushToast({ title: "Onboarding complete", message: "Welcome to Hifzer.", tone: "success" });
                router.push("/dashboard");
              }}
              loading={finishing}
            >
              Go to dashboard <ArrowRight size={18} />
            </Button>
          </div>
        </Card>
      </div>
    </OnboardingShell>
  );
}
