"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, Mic } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { getOnboardingStartLane } from "@/hifzer/local/store";

export function OnboardingPermissionsClient() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [continuing, setContinuing] = useState(false);

  return (
    <OnboardingShell
      step="permissions"
      title="Optional permissions, explained simply."
      subtitle="Nothing here blocks you from starting today. These permissions only make future reminders and recitation tools more convenient."
      backHref="/onboarding/fluency-check"
      supportTitle="Permissions should feel earned"
      supportBody="A professional onboarding flow explains why a permission matters before it is ever requested."
      supportPoints={[
        {
          title: "Start without friction",
          description: "You can finish onboarding without enabling anything extra right now.",
        },
        {
          title: "Ask in context later",
          description: "Microphone and notification prompts should appear when the user actually reaches the feature that needs them.",
        },
        {
          title: "Settings remain the home",
          description: "If you skip now, you can enable these from inside the dashboard settings once you are settled in.",
        },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="accent">Microphone</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Used for live recitation checks, fluency retests, and future voice-guided feedback.
              </p>
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                We only want to request it when you enter a feature that genuinely uses it.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <Mic size={18} />
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="brand">Notifications</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Reminders help the habit stick, especially once your daily timing is stable.
              </p>
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                You can tune reminder timing from Settings after onboarding.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <Bell size={18} />
            </span>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-2xl">
              <Pill tone="neutral">No blockers</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Finish setup now and enable permissions when they become useful in context. That keeps onboarding honest and fast.
              </p>
            </div>
            <Button
              className="gap-2"
              loading={continuing}
              onClick={async () => {
                if (continuing) {
                  return;
                }

                setContinuing(true);
                const onboardingStartLane = getOnboardingStartLane();
                try {
                  const res = await fetch("/api/profile/onboarding-progress", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      step: "complete",
                      ...(onboardingStartLane ? { onboardingStartLane } : {}),
                    }),
                  });
                  if (!res.ok) {
                    throw new Error("Failed to sync final onboarding progress.");
                  }
                } catch {
                  pushToast({
                    title: "We’ll finish the sync on the next screen",
                    message: "Your onboarding state is still available locally if the profile write is being slow.",
                    tone: "warning",
                  });
                } finally {
                  setContinuing(false);
                }

                router.push("/onboarding/complete");
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
