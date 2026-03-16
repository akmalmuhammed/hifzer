"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { IphoneInstallGuide } from "@/components/landing/iphone-install-guide";
import { usePublicAuth } from "@/components/landing/public-auth-context";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";
import styles from "./landing.module.css";

const PROMISES = [
  {
    title: "We will not gamify your faith",
    body: [
      "No noisy streak pressure",
      "No social comparison loops",
      "No vanity badges pretending to measure sincerity",
    ],
    promise: "Your return is between you and Allah.",
    icon: Sparkles,
  },
  {
    title: "We will not overwhelm you",
    body: [
      "No wall of decisions on entry",
      "No clutter dressed up as productivity",
      "No bloated setup before you can begin",
    ],
    promise: "Open the app and the next honest step is ready.",
    icon: ShieldCheck,
  },
  {
    title: "We will not sell your spirituality",
    body: [
      "No ads interrupting devotion",
      "No selling your private data",
      "No turning sacred habits into marketing inventory",
    ],
    promise: "Private by design, with trust kept visible.",
    icon: LockKeyhole,
  },
] as const;

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  const { isSignedIn } = usePublicAuth();
  const install = useInstallApp();
  const { pushToast } = useToast();

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
              <Pill tone="neutral">Trust before hype</Pill>
            </div>

            <h2 className="kw-marketing-display mt-5 max-w-[14ch] text-balance text-4xl leading-[0.96] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              What Hifzer will not do with your faith.
            </h2>

            <p className="mt-4 max-w-[62ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              This should feel like a trust between you, Allah, and the app that quietly serves
              that relationship.
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

        <div id="install" className="mt-8 grid gap-7 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">Begin gently</Pill>
              <Pill tone="neutral">Browser first</Pill>
            </div>

            <h2 className="kw-marketing-display mt-5 max-w-[13ch] text-balance text-4xl leading-[0.96] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              Begin where you are, with what you have today.
            </h2>

            <p className="mt-4 max-w-[58ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              No fake urgency and no pressure to commit first. Use Hifzer in the browser, see if
              the return feels calmer, then keep it on your home screen only if it truly helps.
            </p>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <PublicAuthLink
                  signedInHref="/today"
                  signedOutHref="/signup"
                  onClick={() => {
                    trackGaEvent("landing.secondary_start_free_click", { placement: "final-cta-primary" });
                  }}
                >
                  {isSignedIn ? "Return to today's page" : "Begin today"} <ArrowRight size={18} />
                </PublicAuthLink>
              </Button>
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
              ) : null}
            </div>

            {!isSignedIn ? (
              <p className="mt-4">
                <PublicAuthLink
                  signedInHref="/today"
                  signedOutHref="/quran-preview"
                  onClick={() => {
                    trackGaEvent("landing.secondary_start_free_click", { placement: "final-cta" });
                  }}
                  className="text-sm font-semibold text-[color:var(--kw-muted)] underline underline-offset-4 transition hover:text-[color:var(--kw-ink)]"
                >
                  Preview the Qur&apos;an reader first
                </PublicAuthLink>
              </p>
            ) : null}

            <div className="mt-7 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">The final line is simple.</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                    Just you and your intention. No ads. No pressure. No pretending the app matters
                    more than the worship it is trying to serve.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <div className={`${styles.installCard} px-4 py-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Android
              </p>
              <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                One-tap install when the prompt is ready
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Chrome or Edge can install Hifzer directly. If the prompt does not appear, open the
                browser menu and choose Add to Home screen or Install app.
              </p>
              <div className="mt-4 rounded-[20px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-3 text-sm leading-6 text-[color:var(--kw-ink-2)]">
                Honest install matters here too: browser first, home screen second.
              </div>
            </div>

            <IphoneInstallGuide />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
