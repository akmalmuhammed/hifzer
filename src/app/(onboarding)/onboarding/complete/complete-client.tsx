"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { ArrowRight, CheckCircle2, Link2 } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  getOnboardingStartLane,
  setDashboardFirstRunGuidePending,
  setOnboardingCompleted,
} from "@/hifzer/local/store";
import type { OnboardingStartLane } from "@/hifzer/profile/onboarding";
import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

export function OnboardingCompleteClient(props: {
  initialQuranFoundationStatus: QuranFoundationConnectionStatus | null;
  initialOnboardingStartLane: OnboardingStartLane | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [finishing, setFinishing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const quranFoundationState = props.initialQuranFoundationStatus?.state;
  const quranLinkReady = Boolean(props.initialQuranFoundationStatus && quranFoundationState !== "not_configured");
  const quranLinked = quranFoundationState === "connected" || quranFoundationState === "degraded";
  const quranFeedback = (() => {
    const value = searchParams.get("qf");
    if (value === "connected") return "Quran.com linked.";
    if (value === "oauth-failed") return "Quran.com could not be linked right now.";
    if (value === "state-mismatch") return "Quran.com linking could not be verified.";
    if (value === "sign-in-required") return "Sign in before linking Quran.com.";
    return null;
  })();

  return (
    <OnboardingShell
      step="complete"
      title="You are ready."
      subtitle="Open the dashboard and start with the lane and ayah you just chose."
      backHref="/onboarding/start-point"
      supportTitle="One clear next step"
      supportBody="Start now. You can fine-tune details later once your routine feels real."
      supportPoints={[
        {
          title: "Optional later",
          description: "Quran.com linking and deeper settings stay available inside the app whenever you want them.",
        },
      ]}
    >
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Your setup is saved and your dashboard is ready.
              </p>
              <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
                Start with the plan and reading place you just chose. You can adjust the rest later from inside Hifzer.
              </p>
              {quranFeedback ? (
                <p className="text-sm text-[color:var(--kw-muted)]">{quranFeedback}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={async () => {
                    if (finishing) {
                      return;
                    }

                    setFinishing(true);
                    const onboardingStartLane = getOnboardingStartLane() ?? props.initialOnboardingStartLane;
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
                      Sentry.captureException(error, {
                        tags: {
                          area: "onboarding",
                          step: "complete",
                          action: "finish_onboarding",
                        },
                        extra: {
                          onboardingStartLane,
                        },
                      });
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
                  Open dashboard <ArrowRight size={18} />
                </Button>

                {quranLinkReady ? (
                  quranLinked ? (
                    <Button asChild size="lg" variant="secondary">
                      <Link href="/settings/quran-foundation">
                        Manage Quran.com <Link2 size={18} />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => {
                        setConnecting(true);
                        window.location.href = "/api/quran-foundation/connect?returnTo=%2Fonboarding%2Fcomplete";
                      }}
                      loading={connecting}
                    >
                      Link Quran.com <Link2 size={18} />
                    </Button>
                  )
                ) : null}
              </div>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)] shadow-[var(--kw-shadow-soft)]">
              <CheckCircle2 size={18} />
            </span>
          </div>
        </Card>
      </div>
    </OnboardingShell>
  );
}
