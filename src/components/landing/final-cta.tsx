"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Download,
  HandHeart,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { IphoneInstallGuide } from "@/components/landing/iphone-install-guide";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";
import styles from "./landing.module.css";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hifzer.com";

const PROMISES = [
  {
    title: "The core app stays free to use",
    body: [
      "No subscription tiers across the main experience",
      "No free-trial countdown pretending to be generosity",
      "No paid wall before reading, Hifz, or dua can help you",
    ],
    promise: "Optional one-time support exists if you want to help fund the work. Help is not withheld until you pay.",
    icon: HandHeart,
  },
  {
    title: "We will not gamify your faith",
    body: [
      "No meaningless badges",
      "No noisy streak guilt loops",
      "No social comparison pretending to measure sincerity",
    ],
    promise: "Your progress is between you and Allah.",
    icon: Sparkles,
  },
  {
    title: "We will not force one path on you",
    body: [
      "No rigid onboarding tunnel",
      "No single correct workflow to obey",
      "No pressure to use every feature before any feature can help",
    ],
    promise: "Open it. Explore it. Build your own way of returning.",
    icon: ShieldCheck,
  },
  {
    title: "We will not stop building with you",
    body: [
      "No closed roadmap decided in secret",
      "No worship features dropped just because a metric cooled down",
      "No pretending the current version is the final one",
    ],
    promise: "If people need something that serves worship, it stays on the table.",
    icon: Mail,
  },
  {
    title: "We will not sell your spirituality",
    body: [
      "No ads in the middle of devotion",
      "No selling personal data",
      "No spam disguised as care",
    ],
    promise: "Privacy, trust, and restraint have to remain visible.",
    icon: LockKeyhole,
  },
] as const;

const TRUST_SIGNALS = [
  {
    title: "Core app free to use",
    body: "Reading, Hifz, and dua do not sit behind a subscription gate.",
  },
  {
    title: "Optional support is one-time",
    body: "If you want to help keep Hifzer going, support is never required first.",
  },
  {
    title: "Browser first",
    body: "Use it on the web first. Add it to your home screen only if it earns the place.",
  },
  {
    title: "Open roadmap",
    body: "Requests and product direction stay visible instead of disappearing into a black box.",
  },
] as const;

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const install = useInstallApp();
  const { pushToast } = useToast();
  const featureRequestHref = `mailto:${SUPPORT_EMAIL}?subject=Hifzer+feature+request`;

  const onInstallNow = async () => {
    trackGaEvent("landing.install_primary_click", { placement: "final-cta" });
    const result = await install.requestInstall();

    if (result === "accepted") {
      trackGaEvent("landing.install_result.accepted", { placement: "final-cta" });
      pushToast({
        tone: "success",
        title: "Installed",
        message: "Hifzer was added to your home screen.",
      });
      return;
    }

    trackGaEvent("landing.install_result.dismissed", { placement: "final-cta", reason: result });

    if (result === "ios_instructions") {
      pushToast({
        tone: "warning",
        title: "iPhone install",
        message: "Safari requires Share, then Add to Home Screen.",
      });
      return;
    }

    pushToast({
      tone: "warning",
      title: "Install prompt not ready",
      message: "Use the steps below to add Hifzer manually.",
    });
  };

  return (
    <section id="promise" className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
        className={`${styles.finalShell} px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8`}
      >
        <div>
          <div className="max-w-[760px]">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">The promise</Pill>
              <Pill tone="neutral">Trust before pressure</Pill>
            </div>

            <h2 className="kw-marketing-display mt-5 max-w-[14ch] text-balance text-4xl leading-[0.96] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              The promises we made before we launched.
            </h2>

            <p className="mt-4 max-w-[64ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              This should feel like a trust between you, Allah, and the tool you use to serve that
              relationship. The product has to keep earning that trust.
            </p>
          </div>

          <div className={`${styles.promiseGrid} mt-7`}>
            {PROMISES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={styles.promiseCard}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {item.title}
                    </p>
                    <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]">
                      <Icon size={18} />
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {item.body.map((line) => (
                      <p key={line} className="text-sm leading-6 text-[color:var(--kw-muted)]">
                        {line}
                      </p>
                    ))}
                  </div>

                  <p className="mt-4 text-sm font-semibold leading-6 text-[color:var(--kw-ink-2)]">
                    {item.promise}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div id="install" className="mt-8 grid gap-7 xl:grid-cols-[0.94fr_1.06fr] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">No barriers</Pill>
              <Pill tone="neutral">Use what helps</Pill>
            </div>

            <h2 className="kw-marketing-display mt-5 max-w-[13ch] text-balance text-4xl leading-[0.96] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              Just open it. It is already yours.
            </h2>

            <p className="mt-4 max-w-[58ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              Use the browser immediately. Create a free space when you want your place, progress,
              and preferences to stay with you. Keep the tool. Ignore the noise.
            </p>

            <div className={`${styles.startGrid} mt-7`}>
              <div className={styles.startCard}>
                <Pill tone="brand">{isSignedIn ? "Continue" : "Start free"}</Pill>
                <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  {isSignedIn ? "Return to your space." : "Create your free space."}
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                  {isSignedIn
                    ? "Your reading, Hifz, reminders, and saved progress are already waiting."
                    : "Use a free account when you want Hifzer to remember your place, progress, and preferences across devices."}
                </p>
                <div className="mt-5">
                  <Button asChild size="lg">
                    <PublicAuthLink
                      signedInHref="/today"
                      signedOutHref="/signup"
                      onClick={() => {
                        trackGaEvent("landing.secondary_start_free_click", {
                          placement: "final-cta-start",
                          state: isSignedIn ? "signed_in" : "signed_out",
                        });
                      }}
                    >
                      {isSignedIn ? "Return to today" : "Create my free space"} <ArrowRight size={16} />
                    </PublicAuthLink>
                  </Button>
                </div>
              </div>

              <div className={styles.startCard}>
                <Pill tone="accent">Preview</Pill>
                <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  Start with the Qur&apos;an reader if you want.
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                  No dramatic first step is required. Open the reader, see the tone of the product,
                  and decide later whether you want a saved space.
                </p>
                <div className="mt-5">
                  <Button asChild size="lg" variant="secondary">
                    <PublicAuthLink signedInHref="/quran/read" signedOutHref="/quran-preview">
                      <BookOpenText size={16} />
                      Preview the Qur&apos;an reader
                    </PublicAuthLink>
                  </Button>
                </div>
              </div>

              <div className={styles.startCard}>
                <Pill tone="warn">Ask for what is missing</Pill>
                <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                  Tell us what would genuinely help.
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                  A better workflow, a missing surface, a pain point you keep hitting - feature
                  requests go straight to the team.
                </p>
                <div className="mt-5">
                  <Button asChild size="lg" variant="secondary">
                    <a href={featureRequestHref}>
                      <Mail size={16} />
                      Request a feature
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className={`${styles.returnBanner} mt-7 px-4 py-5`}>
              <p className="kw-marketing-display max-w-[15ch] text-balance text-3xl leading-[0.98] tracking-[-0.04em] text-[color:var(--kw-ink)] sm:text-4xl">
                It is free. It is yours. It is ready.
              </p>
              <p className="mt-4 max-w-[58ch] text-sm leading-8 text-[color:var(--kw-muted)]">
                The Qur&apos;an you have been meaning to return to is still waiting. It never judged
                your absence. And this time, you have a quieter space to come back to.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <PublicAuthLink
                    signedInHref="/today"
                    signedOutHref="/signup"
                    onClick={() => {
                      trackGaEvent("landing.secondary_start_free_click", {
                        placement: "final-cta-primary",
                        state: isSignedIn ? "signed_in" : "signed_out",
                      });
                    }}
                  >
                    {isSignedIn ? "Return to your practice" : "Create my free space"} <ArrowRight size={18} />
                  </PublicAuthLink>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <PublicAuthLink signedInHref="/quran/read" signedOutHref="/quran-preview">
                    {isSignedIn ? "Open the reader" : "Preview first"}
                  </PublicAuthLink>
                </Button>
              </div>

              <div className={`${styles.signalGrid} mt-6`}>
                {TRUST_SIGNALS.map((item) => (
                  <div key={item.title} className={styles.signalCard}>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <div className={`${styles.installCard} px-4 py-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Browser first
              </p>
              <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Start on the web, then install only if it earns the space.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Hifzer works best when the tool stays smaller than the worship it is trying to serve.
                The browser is enough for that.
              </p>
              <div className="mt-4 rounded-[20px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-3 text-sm leading-6 text-[color:var(--kw-ink-2)]">
                Keep the first move simple: preview, sign up if you want your space saved, then
                install later if it genuinely helps you keep showing up.
              </div>
            </div>

            <div className={`${styles.installCard} px-4 py-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Android
              </p>
              <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Add it to your home screen when the prompt is ready.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Chrome or Edge can install Hifzer directly. If the prompt does not appear, the
                browser menu can still add it manually.
              </p>
              <div className="mt-5">
                {install.canShowCta ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      void onInstallNow();
                    }}
                  >
                    <Download size={18} />
                    Install on Android
                  </Button>
                ) : (
                  <div className="rounded-[20px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-3 text-sm leading-6 text-[color:var(--kw-ink-2)]">
                    The install prompt appears only when the browser says the app is installable.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <IphoneInstallGuide />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
