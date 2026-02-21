"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Download, Share } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { trackGaEvent } from "@/lib/ga/client";

export function FinalCta() {
  const reduceMotion = useReducedMotion();
  const install = useInstallApp();
  const { pushToast } = useToast();
  const InstallIcon = install.canPrompt ? Download : Share;

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
        message: "Tap Share, then Add to Home Screen.",
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
    <section className="py-10 md:py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
        className="relative overflow-hidden rounded-[28px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(ellipse_at_top,rgba(var(--kw-accent-rgb),0.10)_0%,transparent_62%)] px-6 py-14 md:px-12 md:py-16"
      >
        <div className="relative mx-auto max-w-[820px] text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]">
            Install and begin
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-4xl leading-[1.02] tracking-tight text-[color:var(--kw-ink)] sm:text-5xl">
            Add Hifzer to your home screen and start today.
          </h2>
          <p className="mx-auto mt-4 max-w-[56ch] text-base leading-7 text-[color:var(--kw-muted)]">
            Keep your daily Hifz flow one tap away. No clutter, just a consistent rhythm.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                void onInstallNow();
              }}
            >
              <InstallIcon size={18} />
              Add to Home Screen now
            </Button>
          </div>

          <p className="mt-4">
            <PublicAuthLink
              signedInHref="/today"
              signedOutHref="/signup"
              onClick={() => {
                trackGaEvent("landing.secondary_start_free_click", { placement: "final-cta" });
              }}
              className="text-sm font-semibold text-[color:var(--kw-muted)] underline underline-offset-2 transition hover:text-[color:var(--kw-ink)]"
            >
              Start free in browser
            </PublicAuthLink>
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-[820px] gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Android</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--kw-ink-2)]">
              Open Chrome or Edge menu, then choose Add to Home screen or Install app.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">iPhone</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--kw-ink-2)]">
              Open in Safari, tap Share, choose Add to Home Screen, then tap Add.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
